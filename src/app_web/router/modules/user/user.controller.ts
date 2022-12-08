import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Put,
  Request,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ACL } from '@share/modules/auth/acl.decorator';
import { RequestExpressJwt } from '@share/modules/auth/types';
import * as _ from 'lodash';
import { JwtUserAuthService } from '@share/modules/jwt/jwt-user-auth.service';
import {
  UserChangeEmailDto,
  UserChangePasswordDto,
  UserCurrentPutDto,
} from './dto';
import { AuthService } from '@share/modules/auth/auth.service';
import {
  JwtUserActivationService,
  UserActivationType,
} from '@share/modules/jwt/jwt-user-activation.service';
import { SendEmailService } from '@share/modules/app-mailer/send-email.service';
import { ExErrors } from '@share/ex_errors.type';
import { FileInterceptor } from '@nestjs/platform-express';
import { ClearDataService } from '@share/modules/clear-data/clear-data.service';
import { Response } from 'express';
import { PrismaService } from '@db/prisma.service';
import { UserRepository, UserViewType } from '@db/repositories/user.repository';
import { IpfsInputService } from '@share/modules/ipfs/ipfs-input.service';
import { useEnv } from '@share/lib/env/env';

@ApiTags('api user')
@Controller()
@ACL()
export class UserController {
  private env = useEnv();

  constructor(
    private prisma: PrismaService,
    private ipfsInput: IpfsInputService,
    private userRepository: UserRepository,
    private authService: AuthService,
    private mailer: SendEmailService,
    private jwtUserAuth: JwtUserAuthService,
    private jwtUserActivate: JwtUserActivationService,
    private clearData: ClearDataService,
  ) {}

  @Post('logout')
  @ApiOperation({
    summary: 'logout',
  })
  async logout(@Request() req: RequestExpressJwt) {
    const bearerHeader = req.headers.authorization;
    const accessToken = bearerHeader && bearerHeader.split(' ')[1];

    if (!bearerHeader || !accessToken) {
      throw new HttpException('', HttpStatus.BAD_REQUEST);
    }

    const checkResult = await this.jwtUserAuth.check(accessToken);
    if (!checkResult) {
      throw new HttpException('Access token no found', HttpStatus.NOT_FOUND);
    }

    await this.prisma.jwt.delete({
      where: {
        id: checkResult.jwtRow.id,
      },
    });

    return {
      message: 'you got out',
    };
  }

  @Get('profile')
  @ApiOperation({
    summary: 'profile',
  })
  async getCurrentUser(@Request() req: RequestExpressJwt) {
    const user = await this.userRepository.findFirst({
      id: BigInt(req.user.userId),
    });

    if (!user) {
      throw new HttpException(ExErrors.Users.NotFound, HttpStatus.NOT_FOUND);
    }

    return {
      user: this.userRepository.toView(user, UserViewType.PRIVATE),
    };
  }

  @Put('profile')
  @ApiOperation({
    summary: 'profile',
  })
  async putCurrentUser(
    @Body() dto: UserCurrentPutDto,
    @Request() req: RequestExpressJwt,
  ) {
    const user = await this.userRepository.findFirst({
      id: BigInt(req.user.userId),
    });

    if (!user) {
      throw new HttpException(ExErrors.Users.NotFound, HttpStatus.NOT_FOUND);
    }

    const updatedUser = await this.userRepository.updateByModel(user, {
      phone: dto.phone,
    });

    return {
      user: this.userRepository.toView(updatedUser, UserViewType.PRIVATE),
    };
  }

  @Put('profile/email')
  @ApiOperation({
    summary: 'profile/email',
  })
  async changeUserEmail(
    @Body() body: UserChangeEmailDto,
    @Request() req: RequestExpressJwt,
  ) {
    const userIdBI = BigInt(req.user.userId);

    const currentUser = await this.userRepository.findFirst({
      id: userIdBI,
    });

    const userActivationData = await this.jwtUserActivate.create(
      currentUser.id,
      {
        type: UserActivationType.emailChange,
        email: body.email,
      },
    );

    /*
    await this.mailer.sendUserChangeEmail({
      activationToken: userActivationData.token,
      userEmail: currentUser.email,
    });
    */

    return {
      message: 'you have been sent an email to change your email address',
    };
  }

  @Put('profile/password')
  @ApiOperation({
    summary: 'profile/password',
  })
  async changeUserPassword(
    @Body() dto: UserChangePasswordDto,
    @Request() req: RequestExpressJwt,
  ) {
    const userIdBI = BigInt(req.user.userId);

    const passwordCheckResult = await this.authService.passwordCheck(
      userIdBI,
      dto.passwordCurrent,
    );
    if (!passwordCheckResult) {
      throw new HttpException(
        ExErrors.Users.PasswordWrong,
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.userRepository.changePassword(userIdBI, dto.password);

    return {
      message: 'your password has been changed',
    };
  }

  @Post('upload_image')
  @ApiOperation({
    summary: 'upload_image',
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadImageForUser(
    @Request() req: RequestExpressJwt,
    @UploadedFile() imageFile: Express.Multer.File,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (
      this.env.IPFS_IMAGE_ALLOW_MIME_TYPES.indexOf(imageFile.mimetype) === -1
    ) {
      throw new HttpException(
        ExErrors.Upload.InvalidMime,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (imageFile.size > this.env.IPFS_IMAGE_MAX_SIZE) {
      throw new HttpException(
        ExErrors.Upload.VeryLarge,
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userRepository.findFirst({
      id: BigInt(req.user.userId),
    });
    const oldImage = user.imageId;

    const uploadImageRes = await this.ipfsInput.uploadImageByMulterFile(
      imageFile,
    );
    if (uploadImageRes.isBad) {
      console.error(uploadImageRes.errData);
      throw new HttpException('', HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const image = uploadImageRes.data;
    const code = uploadImageRes.code;

    const updatedUser = await this.userRepository.updateByModel(user, {
      imageId: image.id,
    });

    if (oldImage) {
      await this.clearData.deleteImageById(oldImage);
    }

    res.status(code);
    return {
      stream: this.userRepository.toView(updatedUser, UserViewType.PRIVATE),
    };
  }
}
