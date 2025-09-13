import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { CoinsModule } from './coins/coins.module';
import { UtilitiesModule } from './utilities/utilities.module';
import { BlockchainModule } from './blockchain/blockchain.module';
import { AccountsModule } from './accounts/accounts.module';
import { TransactionsModule } from './transactions/transactions.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    DatabaseModule,
    CoinsModule,
    UtilitiesModule,
    BlockchainModule,
    AccountsModule,
    TransactionsModule,
    EventsModule,
  ],
  controllers: [AppController],
})
export class AppModule { }
