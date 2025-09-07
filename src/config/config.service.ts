import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from './configuration';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService<AppConfig, true>) { }

  get databaseUrl(): string {
    return this.configService.get('databaseUrl', { infer: true })!;
  }

  get encryptionKey(): string {
    return this.configService.get('encryptionKey', { infer: true })!;
  }

  get quickNodeApiKey(): string {
    return this.configService.get('quickNodeApiKey', { infer: true })!;
  }

  get alchemyUrl(): string {
    return this.configService.get('alchemyUrl', { infer: true })!;
  }

  get port(): number {
    return this.configService.get('port', { infer: true }) || 3000;
  }

  get evm(): AppConfig['evm'] {
    return this.configService.get('evm', { infer: true })!;
  }

  get solana(): AppConfig['solana'] {
    return this.configService.get('solana', { infer: true })!;
  }

  get tron(): AppConfig['tron'] {
    return this.configService.get('tron', { infer: true })!;
  }

  get xrpl(): AppConfig['xrpl'] {
    return this.configService.get('xrpl', { infer: true })!;
  }

  get btc(): AppConfig['btc'] {
    return this.configService.get('btc', { infer: true })!;
  }
}
