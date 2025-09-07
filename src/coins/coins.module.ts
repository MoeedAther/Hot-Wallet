import { forwardRef, Module } from '@nestjs/common';
import { CoinsService } from './coins.service';
import { DatabaseModule } from 'src/database/database.module';


@Module({
  imports: [forwardRef(() => DatabaseModule)],
  providers: [CoinsService],
  exports: [CoinsService],
})
export class CoinsModule { }
