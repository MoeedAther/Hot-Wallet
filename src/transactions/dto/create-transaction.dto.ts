import { WalletAccount, WalletCoin } from '@prisma/client';
import { NetworkType, TransactionType } from 'src/enums';
export interface CreateTransactionDto {
  account: WalletAccount,
  coin: WalletCoin,
  type: TransactionType,
  fromAddress: string;
  toAddress: string;
  value: number;
  chain: NetworkType;
  txHash: string;
  blockNumber: number;
}
