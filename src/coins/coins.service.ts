import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { Coin } from '@prisma/client';

@Injectable()
export class CoinsService {
  constructor(private readonly databaseService: DatabaseService) { }

  async findByAddressOnChain(address: string, chain: string): Promise<Coin | null> {
    return this.databaseService.coin.findFirst({
      where: {
        address: {
          equals: address,
        },
        chain,
      },
    });
  }

  async findNative(chain: string, isNative = false): Promise<Coin | null> {
    return this.databaseService.coin.findFirst({
      where: {
        chain,
        isNative,
      },
    });
  }
}
