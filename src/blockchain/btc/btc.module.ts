import { Module, forwardRef } from '@nestjs/common';
import { BtcService } from './btc.service';
import { AccountsModule } from 'src/accounts/accounts.module';
import { CoinsModule } from 'src/coins/coins.module';
import { TransactionsModule } from 'src/transactions/transactions.module';

@Module({
  imports: [
    forwardRef(() => AccountsModule),
    forwardRef(() => CoinsModule),
    forwardRef(() => TransactionsModule),
  ],
  providers: [BtcService],
  exports: [BtcService]
})
export class BtcModule { }
