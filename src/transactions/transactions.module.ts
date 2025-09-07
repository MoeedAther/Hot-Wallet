import { forwardRef, Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { EventsModule } from 'src/events/events.module';
import { BlockchainModule } from 'src/blockchain/blockchain.module';
import { DatabaseModule } from 'src/database/database.module';
import { UtilitiesModule } from 'src/utilities/utilities.module';

@Module({
  imports: [
    forwardRef(() => DatabaseModule),
    forwardRef(() => UtilitiesModule),
    forwardRef(() => EventsModule),
    forwardRef(() => BlockchainModule),
  ],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule { }
