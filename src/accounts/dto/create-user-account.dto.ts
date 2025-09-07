import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateUserAccountDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;
}
