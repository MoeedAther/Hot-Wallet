import { BadRequestException, Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { WithdrawAccountDto } from './dto/withdraw-account.dto';
import { DatabaseService } from '../database/database.service';
import { BlockchainService } from '../blockchain/blockchain.service';
import { CommonUtility } from '../utilities/common.utility';
import { CryptoUtility } from '../utilities/crypto.utility';
import { WalletAccount } from '@prisma/client';
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

  async create(createUserDto: CreateUserAccountDto): Promise<WalletAccount[]> {
    const { userId } = createUserDto;

      // NEW: Check if user exists in users table using raw SQL
  const userExists = await this.databaseService.$queryRaw`
    SELECT id FROM users WHERE id = ${userId}
  `;

   if (!userExists || (userExists as any[]).length === 0) {
    throw new BadRequestException('User accounts already exist');
  }

    const existingAccountsCount = await this.databaseService.walletAccount.count({
      where: { userId: userId },
    });

    if (existingAccountsCount > 0) {
      throw new BadRequestException('User accounts already exist');
    }


    const createdAccounts = await this.databaseService.$transaction(async (prisma) => {

      const wallets = this.web3Service.createWallets();

      const accountData = (Object.entries(wallets) as [string, { address: string; privateKey: string }][]).map(([chain, wallet]) => ({
        userId: userId,
        chain: chain as NetworkType,
        address: wallet.address,
        privateKey: this.cryptoUtility.encrypt(wallet.privateKey),
      }));

      await prisma.walletAccount.createMany({
        data: accountData
      });

      const userAccounts = await prisma.walletAccount.findMany({
        where: { userId: userId }
      });

      const coins = await prisma.walletCoin.findMany();


      const balanceData = userAccounts.flatMap(account =>
        coins
          .filter(coin => coin.chain === account.chain)
          .map(coin => ({
            userId: userId,
            accountId: account.id,
            coinId: coin.id,
            balance: 0,
          }))
      );

      await prisma.walletBalance.createMany({
        data: balanceData
      });

      return userAccounts;
    });

    const userAccountAddresses = createdAccounts.map(account => account.address);
    await this.commonUtility.addAddressesToList(userAccountAddresses);
    
    return createdAccounts;
  }

  async findByAddressOnChain(address: string, chain: NetworkType): Promise<WalletAccount | null> {
    return this.databaseService.walletAccount.findFirst({
      where: {
        address: {
          equals: address,
        },
        chain,
      },
    });
  }

  async withdraw(withdrawDto: WithdrawAccountDto) {

    const account = await this.databaseService.walletAccount.findUnique({
      where: { id: withdrawDto.accountId }
    });

    if (!account) {
      throw new NotFoundException('Account not found');
    }

    const coin = await this.databaseService.walletCoin.findUnique({
      where: { id: withdrawDto.coinId }
    });

    if (!coin) {
      throw new NotFoundException('Coin not found');
    }

    const balance = await this.databaseService.walletBalance.findUnique({
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

    await this.databaseService.walletTransaction.create({
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

      const updatedBalance = await this.databaseService.walletBalance.update({
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
