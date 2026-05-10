import { ApiProperty } from '@nestjs/swagger';

export class LogoutResponse {
  @ApiProperty()
  loggedOut!: boolean;
}
