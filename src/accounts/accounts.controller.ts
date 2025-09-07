import { Body, Controller, Post } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { WithdrawAccountDto } from './dto/withdraw-account.dto';
import { CreateUserAccountDto } from './dto/create-user-account.dto';

@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) { }

  @Post('create')
  create(@Body() createDto: CreateUserAccountDto) {
    return this.accountsService.create(createDto);
  }

  @Post('withdraw')
  withdraw(@Body() withdrawDto: WithdrawAccountDto) {
    return this.accountsService.withdraw(withdrawDto);
  }
}
