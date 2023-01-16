import { Match } from '@share/decorators/match.decorator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  Min,
  Max,
  IsIn,
  IsOptional,
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
} from 'class-validator';
import { EmailIsUnique } from '@share/decorators/email-is-unique.decorator';
import { PaginationParams } from '@share/lib/grid';

export class AuthDto {
  @ApiProperty({
    name: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    name: 'password',
  })
  password: string;
}

export class UserSignUpDto {
  @IsNotEmpty()
  @IsEmail()
  @EmailIsUnique()
  @ApiProperty({
    name: 'email',
  })
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @ApiProperty({
    name: 'password',
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Match('password')
  @ApiProperty({
    name: 'passwordConfirm',
  })
  passwordConfirm: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    name: 'phone',
    default: '+18001001010',
  })
  phone: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    name: 'publicUrl',
    default: 'https://example.com/',
  })
  publicUrl: string;

  @IsString()
  @ApiProperty({
    name: 'title',
    default: '',
  })
  @ApiPropertyOptional()
  title: string;
}

export class GetUsersDto implements PaginationParams {
  @IsInt()
  @Min(1)
  @IsOptional()
  @ApiProperty({ required: false })
  page?: number;

  @IsInt()
  @Max(100)
  @IsOptional()
  @ApiProperty({ required: false })
  pageSize?: number;

  @IsIn(['id', 'createdAt'])
  @IsOptional()
  @ApiProperty({ required: false, enum: ['id', 'createdAt'] })
  sortBy?: string;

  @IsIn(['asc', 'desc'])
  @IsOptional()
  @ApiProperty({ required: false, enum: ['asc', 'desc'] })
  sortType?: 'asc' | 'desc';
}

export class UserActivationDto {
  @IsString()
  @ApiProperty({
    name: 'activationToken',
    default: '',
  })
  activationToken: string;
}

export class UserForgotDto {
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty({
    name: 'email',
    default: '',
  })
  email: string;
}

export class UserRecoverytDto {
  @IsString()
  @ApiProperty({
    name: 'recoveryToken',
    default: '',
  })
  recoveryToken: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @ApiProperty({
    name: 'password',
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @Match('password')
  @ApiProperty({
    name: 'passwordConfirm',
  })
  passwordConfirm: string;
}
