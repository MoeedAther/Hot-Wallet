import { Module, forwardRef } from '@nestjs/common';
import { XrplService } from './xrpl.service';
import { TransactionsModule } from 'src/transactions/transactions.module';
import { AccountsModule } from 'src/accounts/accounts.module';
import { CoinsModule } from 'src/coins/coins.module';

@Module({
  imports: [
    forwardRef(() => TransactionsModule), 
    forwardRef(() => AccountsModule), 
    forwardRef(() => CoinsModule),
  ],
  providers: [XrplService],
  exports: [XrplService]
})
export class XrplModule { }
