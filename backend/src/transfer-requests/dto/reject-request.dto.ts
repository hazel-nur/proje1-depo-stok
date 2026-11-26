import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RejectRequestDto {
  @ApiPropertyOptional({ example: 'Stok planı uygun değil' })
  @IsOptional()
  @IsString()
  redNedeni?: string;
}
