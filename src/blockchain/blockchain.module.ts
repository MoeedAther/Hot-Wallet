import { Module, forwardRef } from '@nestjs/common';
import { BlockchainService } from './blockchain.service';
import { EvmModule } from './evm/evm.module';
import { SolanaModule } from './solana/solana.module';
import { TronModule } from './tron/tron.module';
import { BtcModule } from './btc/btc.module';
import { XrplModule } from './xrpl/xrpl.module';
import { BlockchainController } from './blockchain.controller';

@Module({
  imports: [
    forwardRef(() => EvmModule),
    forwardRef(() => SolanaModule),
    forwardRef(() => TronModule),
    forwardRef(() => BtcModule),
    forwardRef(() => XrplModule),
  ],
  controllers: [BlockchainController],
  providers: [BlockchainService],
  exports: [BlockchainService]
})
export class BlockchainModule { }
