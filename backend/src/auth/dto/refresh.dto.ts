import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshDto {
  @ApiProperty({ description: 'Login/refresh ile alınan refresh token' })
  @IsString()
  @IsNotEmpty()
  refresh_token: string;
}
