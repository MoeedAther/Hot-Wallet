import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { WithdrawAccountDto } from './dto/withdraw-account.dto';
import { DatabaseService } from '../database/database.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CommonUtility } from '../utilities/common.utility';
import { CryptoUtility } from '../utilities/crypto.utility';
import { Account } from '@prisma/client';
import { NetworkType, TransactionType } from 'src/enums';
import { CreateUserAccountDto } from './dto/create-user-account.dto';

@Injectable()
export class AccountsService {
  constructor(
    private readonly databaseService: DatabaseService,
    @Inject(forwardRef(() => BlockchainService)) private web3Service: BlockchainService,
    private commonUtility: CommonUtility,
    private cryptoUtility: CryptoUtility,
  ) { }

  async create(createUserDto: CreateUserAccountDto): Promise<Account[]> {
    const { userId } = createUserDto;

    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingAccountsCount = await this.databaseService.account.count({
      where: { userId: user.id },
    });

    if (existingAccountsCount > 0) {
      throw new BadRequestException('User accounts already exist');
    }


    const createdAccounts = await this.databaseService.$transaction(async (prisma) => {

      const wallets = this.web3Service.createWallets();

      const accountData = (Object.entries(wallets) as [string, { address: string; privateKey: string }][]).map(([chain, wallet]) => ({
        userId: user.id,
        chain: chain as NetworkType,
        address: wallet.address,
        privateKey: this.cryptoUtility.encrypt(wallet.privateKey),
      }));

      await prisma.account.createMany({
        data: accountData
      });

      const userAccounts = await prisma.account.findMany({
        where: { userId: user.id }
      });

      const coins = await prisma.coin.findMany();


      const balanceData = userAccounts.flatMap(account =>
        coins
          .filter(coin => coin.chain === account.chain)
          .map(coin => ({
            userId: user.id,
            accountId: account.id,
            coinId: coin.id,
            balance: 0,
          }))
      );

      await prisma.balance.createMany({
        data: balanceData
      });

      return userAccounts;
    });

    const userAccountAddresses = createdAccounts.map(account => account.address);
    await this.commonUtility.addAddressesToList(userAccountAddresses);
    
    return createdAccounts;
  }

  async findByAddressOnChain(address: string, chain: NetworkType): Promise<Account | null> {
    return this.databaseService.account.findFirst({
      where: {
        address: {
          equals: address,
        },
        chain,
      },
    });
  }

  async withdraw(withdrawDto: WithdrawAccountDto) {

    const account = await this.databaseService.account.findUnique({
      where: { id: withdrawDto.accountId }
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const coin = await this.databaseService.coin.findUnique({
      where: { id: withdrawDto.coinId }
    });

    if (!coin) {
      throw new NotFoundException('Coin not found');
    }

    const balance = await this.databaseService.balance.findUnique({
      where: { id: withdrawDto.balanceId },
    });

    if (!balance) {
      throw new NotFoundException('Balance not found');
    }

    const tokenPriceInUsd = await this.commonUtility.getTokenPrice(coin.wrappedAddress);
    const feeInToken = coin.withdrawFeeInUsd / tokenPriceInUsd;

    const totalRequired = withdrawDto.amount + feeInToken;

    if (balance.balance < totalRequired) {
      throw new BadRequestException('Insufficient balance');
    }

    let txData;
    if (coin.isNative) {
      txData = await this.web3Service.nativeWithdraw(
        withdrawDto.toAddress,
        withdrawDto.amount,
        account.chain as NetworkType
      );
    } else {
      txData = await this.web3Service.tokenWithdraw(
        withdrawDto.toAddress,
        coin.address!,
        withdrawDto.amount,
        account.chain as NetworkType
      );
    }

    await this.databaseService.transaction.create({
      data: {
        userId: account.userId,
        accountId: account.id,
        coinId: coin.id,
        type: TransactionType.WITHDRAWAL,
        chain: account.chain as NetworkType,
        fromAddress: txData.fromAddress,
        toAddress: txData.toAddress,
        value: txData.amount,
        txHash: txData.txHash,
        blockNumber: txData.blockNumber,
      },
    });

    const updatedBalance = await this.databaseService.balance.update({
      where: { id: withdrawDto.balanceId },
      data: {
        balance: {
          decrement: totalRequired,
        },
      },
    });

    return updatedBalance;
  }
}
