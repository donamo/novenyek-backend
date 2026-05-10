import { ApiProperty } from '@nestjs/swagger';

export class AuthMeResponse {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ type: String, nullable: true, required: false })
  displayName?: string | null;

  @ApiProperty()
  isEnabled!: boolean;

  @ApiProperty()
  isAdmin!: boolean;
}
