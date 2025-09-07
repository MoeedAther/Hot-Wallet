import { Module, forwardRef } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { BlockchainModule } from '../blockchain/blockchain.module';
import { DatabaseModule } from '../database/database.module';
import { UtilitiesModule } from '../utilities/utilities.module';

@Module({
  imports: [
    forwardRef(() => DatabaseModule),
    forwardRef(() => BlockchainModule),
    forwardRef(() => UtilitiesModule),
  ],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountsModule { }
