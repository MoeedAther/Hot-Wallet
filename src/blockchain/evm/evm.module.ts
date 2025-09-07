import { Module, forwardRef } from '@nestjs/common';
import { EvmService } from './evm.service';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { AccountsModule } from 'src/accounts/accounts.module';
import { CoinsModule } from 'src/coins/coins.module';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [
    forwardRef(() => TransactionsModule),
    forwardRef(() => AccountsModule),
    forwardRef(() => CoinsModule),
    forwardRef(() => DatabaseModule),
  ],
  providers: [EvmService],
  exports: [EvmService]
})
export class EvmModule { }
