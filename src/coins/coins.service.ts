import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { WalletCoin } from '@prisma/client';

@Injectable()
export class CoinsService {
  constructor(private readonly databaseService: DatabaseService) { }

  async findByAddressOnChain(address: string, chain: string): Promise<WalletCoin | null> {
    return this.databaseService.walletCoin.findFirst({
      where: {
        address: {
          equals: address,
        },
        chain,
      },
    });
  }

  async findNative(chain: string, isNative = false): Promise<WalletCoin | null> {
    return this.databaseService.walletCoin.findFirst({
      where: {
        chain,
        isNative,
      },
    });
  }

  async findAll(): Promise<WalletCoin[]> {
    return this.databaseService.walletCoin.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
