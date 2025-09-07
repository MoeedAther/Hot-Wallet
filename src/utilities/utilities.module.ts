import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '../config/config.module';
import { CommonUtility } from './common.utility';
import { CryptoUtility } from './crypto.utility';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CryptoUtility, CommonUtility],
  exports: [CryptoUtility, CommonUtility]
})
export class UtilitiesModule { }
