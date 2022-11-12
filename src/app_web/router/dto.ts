import { ApiProperty } from '@nestjs/swagger';
import { IsNumberString, IsString } from 'class-validator';

export class ByIdParamsDto {
  @IsNumberString()
  @ApiProperty({ default: '1' })
  id: string;
}

export class ByEntityCodeParamsDto {
  @IsString()
  @ApiProperty()
  entityCode: string;
}
