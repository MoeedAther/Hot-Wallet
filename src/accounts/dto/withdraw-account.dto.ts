import { IsString, IsNotEmpty, IsNumber } from 'class-validator';

export class WithdrawAccountDto {
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsNotEmpty()
  balanceId: string;

  @IsString()
  @IsNotEmpty()
  coinId: string;

  @IsString()
  @IsNotEmpty()
  toAddress: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;
}
