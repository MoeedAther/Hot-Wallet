import { Global, Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import configuration, { validationSchema } from './configuration';
import { AppConfigService } from './config.service';

@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
      cache: true,
      validationSchema,
      // validationOptions: {
      //   allowUnknown: true,
      //   abortEarly: false,
      // },
    }),
  ],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class ConfigModule { }
