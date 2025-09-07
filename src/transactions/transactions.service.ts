import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { EventsGateway } from 'src/events/events.gateway';
import { BlockchainService } from 'src/blockchain/blockchain.service';
import { DatabaseService } from 'src/database/database.service';
import { TransactionType, EventType } from 'src/enums';
import { Transaction } from '@prisma/client';
import { CryptoUtility } from 'src/utilities/crypto.utility';

@Injectable()
export class TransactionsService {

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly eventsGateway: EventsGateway,
    @Inject(forwardRef(() => BlockchainService)) private readonly blockchainService: BlockchainService,
    private readonly cryptoUtility: CryptoUtility
  ) { }

  async create(createTxDto: CreateTransactionDto): Promise<Transaction> {
    const existingTx = await this.databaseService.transaction.findFirst({
      where: {
        txHash: createTxDto.txHash,
        chain: createTxDto.chain,
      },
    });

    if (existingTx) return existingTx;

    const createdTx = await this.databaseService.transaction.create({
      data: {
        userId: createTxDto.account.userId,
        accountId: createTxDto.account.id,
        coinId: createTxDto.coin.id,
        type: createTxDto.type,
        chain: createTxDto.chain,
        fromAddress: createTxDto.fromAddress,
        toAddress: createTxDto.toAddress,
        value: createTxDto.value,
        txHash: createTxDto.txHash,
        blockNumber: createTxDto.blockNumber,
      },
    });

    // Sweep funds only for user deposits
    if (createTxDto.account && createTxDto.type === TransactionType.DEPOSIT) {
      if (createTxDto.coin.isNative) {
        await this.blockchainService.sweepNativeFunds(
          this.cryptoUtility.decrypt(createTxDto.account.privateKey),
          createTxDto.value,
          createTxDto.chain
        );
      } else {
        await this.blockchainService.sweepTokenFunds(
          this.cryptoUtility.decrypt(createTxDto.account.privateKey),
          createTxDto.coin.address!,
          createTxDto.value,
          createTxDto.chain
        );
      }
    }

    // Update balance for user only
    if (createTxDto.account) {
      const updatedBalance = await this.databaseService.balance.upsert({
        where: {
          userId_accountId_coinId: {
            userId: createTxDto.account.userId,
            accountId: createTxDto.account.id,
            coinId: createTxDto.coin.id,
          },
        },
        update: {
          balance: createTxDto.type === TransactionType.DEPOSIT
            ? { increment: createTxDto.value }
            : { decrement: createTxDto.value },
        },
        create: {
          userId: createTxDto.account.userId,
          accountId: createTxDto.account.id,
          coinId: createTxDto.coin.id,
          balance: createTxDto.value,
        },
      });

      this.eventsGateway.emitToUser(
        createTxDto.account.userId,
        EventType.BALANCE_UPDATE,
        updatedBalance
      );
    }

    return createdTx;
  }

  async getLatestTransactionByChain(chain: string): Promise<Transaction | null> {
    const latestTransaction = await this.databaseService.transaction.findFirst({
      where: {
        chain: chain,
        type: TransactionType.DEPOSIT,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return latestTransaction;
  }
}
