import { Match } from '@share/decorators/match.decorator';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  Min,
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsBoolean,
  IsIP,
  IsNumber,
} from 'class-validator';
import { EmailIsUnique } from '@share/decorators/email-is-unique.decorator';

export class UserCurrentPutDto {
  @IsBoolean()
  @ApiProperty({
    name: 'donationUse',
    enum: [true, false],
  })
  donationUse: boolean;

  @IsInt()
  @Min(0)
  @ApiProperty({
    default: 0,
  })
  donationAmount: number;

  @IsString()
  @ApiProperty({
    name: 'title',
  })
  title: string;

  @IsString()
  @ApiProperty({
    name: '',
  })
  donationMessage: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    default: '+18001001010',
  })
  phone: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    default: 'https://example.com/',
  })
  publicUrl: string;
}

export class UserChangeEmailDto {
  @IsNotEmpty()
  @IsEmail()
  @EmailIsUnique()
  @ApiProperty({
    name: 'email',
  })
  email: string;
}

export class UserChangePasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  @ApiProperty({
    name: 'passwordCurrent',
  })
  passwordCurrent: string;

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

export class UserGeoDto {
  @IsIP()
  @ApiProperty()
  ip: string;

  @IsString()
  @ApiProperty()
  country: string;

  @IsString()
  @ApiProperty()
  city: string;

  @IsString()
  @ApiProperty()
  continent: string;

  @IsNumber()
  @ApiProperty()
  latitude: number;

  @IsNumber()
  @ApiProperty()
  longitude: number;
}
