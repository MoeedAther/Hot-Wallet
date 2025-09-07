import { Account, Coin } from '@prisma/client';
import { NetworkType, TransactionType } from 'src/enums';
export interface CreateTransactionDto {
  account: Account,
  coin: Coin,
  type: TransactionType,
  fromAddress: string;
  toAddress: string;
  value: number;
  chain: NetworkType;
  txHash: string;
  blockNumber: number;
}
