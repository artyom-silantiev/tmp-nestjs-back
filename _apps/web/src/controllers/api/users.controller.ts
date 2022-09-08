import {
  Request,
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Query,
  HttpStatus,
  HttpException,
} from '@nestjs/common';

import {
  AuthDto,
  UserSignUpDto,
  GetUsersDto,
  UserActivationDto,
  UserForgotDto,
  UserRecoverytDto,
} from './users.dto';
import { AuthService } from '@share/modules/auth/auth.service';
import { LocalAuthGuard } from '@share/modules/auth/local-auth.guard';

import * as _ from 'lodash';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import {
  JwtUserActivationService,
  UserActivationType,
} from '@share/modules/jwt/jwt-user-activation.service';
import { PaginationService } from '@share/services/pagination.service';
import { JwtUserRecoveryService } from '@share/modules/jwt/jwt-user-recovery.service';
import { SendEmailService } from '@share/modules/app-mailer/send-email.service';
import { ByIdParamsDto } from '../dto';
import { ExErrors } from '@share/ex_errors.type';
import { PrismaService } from '@db/prisma.service';
import { UserService, UserViewType } from '@db/services/user.service';

@ApiTags('api/users')
@Controller('/api/users')
export class UsersController {
  constructor(
    private prismaService: PrismaService,
    private userService: UserService,
    private authService: AuthService,
    private paginationService: PaginationService,
    private mailer: SendEmailService,
    private jwtUserActivate: JwtUserActivationService,
    private jwtUserRecovery: JwtUserRecoveryService,
  ) {}

  @Get('')
  @ApiOperation({
    summary: '/',
  })
  async getUsers(@Query() paginationParams: GetUsersDto) {
    const grid = this.paginationService.parsePaginationParams(paginationParams);

    const fetchBuilder = this.userService.createFetchBuilder();
    fetchBuilder.init({
      where: {
        role: UserRole.USER,
        ...this.userService.whereNotDeleted(),
      },
      include: {
        ...this.userService.includeImage(),
      },
      skip: grid.skip,
      take: grid.take,
    });

    if (grid.sortBy) {
      fetchBuilder.orderBy({
        [grid.sortBy]: grid.sortType,
      });
    }

    const { rows, rowsTotal } = await fetchBuilder.fetch();
    const rowsResult = rows.map((v) => this.userService.toView(v));

    return grid.toWrapedResultRows(rowsResult, rowsTotal);
  }

  @Post('/signup')
  @ApiOperation({
    summary: '/signup',
  })
  async signup(@Body() body: UserSignUpDto) {
    const email = body.email;
    const password = body.password;
    const phone = body.phone;
    const publicUrl = body.publicUrl;
    const title = body.title;

    // TODO
    const data = await this.userService.createUser({
      email,
      password,
      phone,
      firstName: '',
      lastName: '',
    });

    const userActivationData = await this.jwtUserActivate.create(data.user.id, {
      type: UserActivationType.signup,
    });

    /*
    await this.mailer.sendUserRegistration({
      activationToken: userActivationData.token,
      userEmail: data.user.email,
      userPassword: data.password,
    });
    */

    const userView = this.userService.toView(data.user, UserViewType.PRIVATE);

    return {
      message:
        'The user has been created, an email was sent to activate the account.',
      user: userView,
    };
  }

  @Post('/activation')
  @ApiOperation({
    summary: '/activation',
  })
  async userActivate(@Body() userActivationDto: UserActivationDto) {
    const activationToken = userActivationDto.activationToken;

    const checkResult = await this.jwtUserActivate.check(activationToken);
    if (!checkResult) {
      throw new HttpException(
        ExErrors.JWT.BadOrInvalidToken,
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.userService.findFirst({
      id: BigInt(checkResult.payload.userId),
      ...this.userService.whereNotDeleted(),
    });

    if (!user) {
      throw new HttpException(ExErrors.Users.NotFound, HttpStatus.NOT_FOUND);
    }

    let email = user.email;
    if (checkResult.jwtRow.meta.type === UserActivationType.emailChange) {
      email = checkResult.jwtRow.meta.email;
    }

    const activatedUser = await this.prismaService.user.update({
      where: {
        id: user.id,
      },
      data: {
        email,
        emailActivatedAt: new Date().toISOString(),
        role: UserRole.USER,
      },
    });
    try {
      await this.prismaService.jwt.delete({
        where: {
          id: checkResult.jwtRow.id,
        },
      });
    } catch (error) {
      console.error(error);
    }

    const auth = await this.authService.login(activatedUser);

    return {
      accessToken: auth.accessToken,
      user: this.userService.toView(auth.user, UserViewType.PRIVATE),
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('/login')
  @ApiOperation({
    summary: '/login',
  })
  async login(
    @Request() req,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Body() body: AuthDto,
  ) {
    const auth = await this.authService.login(req.user);
    return {
      accessToken: auth.accessToken,
      user: this.userService.toView(auth.user, UserViewType.PRIVATE),
    };
  }

  @Post('/forgot')
  @ApiOperation({
    summary: '/forgot',
  })
  async forgot(@Body() userForgotDto: UserForgotDto) {
    const userEmail = userForgotDto.email;

    const user = await this.userService.findFirst({
      email: userEmail,
      ...this.userService.whereNotDeleted(),
    });

    if (!user) {
      throw new HttpException(ExErrors.Users.NotFound, HttpStatus.NOT_FOUND);
    }

    const recoveryData = await this.jwtUserRecovery.create(user.id);

    /*
    await this.mailer.sendUserPasswordRecovery({
      recoveryToken: recoveryData.token,
      userEmail: user.email,
    });
    */

    return {
      message: 'We have sent you an email to reset your password.',
    };
  }

  @Post('/recovery')
  @ApiOperation({
    summary: '/recovery',
  })
  async recovery(@Body() recoveryUserDto: UserRecoverytDto) {
    const recoveryToken = recoveryUserDto.recoveryToken;

    const checkResult = await this.jwtUserRecovery.check(recoveryToken);
    if (!checkResult) {
      throw new HttpException(
        ExErrors.JWT.BadOrInvalidToken,
        HttpStatus.BAD_REQUEST,
      );
    }

    const userId = BigInt(checkResult.payload.userId);
    const user = await this.userService.findFirst({
      id: userId,
      ...this.userService.whereNotDeleted(),
    });

    if (!user) {
      throw new HttpException(ExErrors.Users.NotFound, HttpStatus.NOT_FOUND);
    }

    await this.userService.changePassword(user.id, recoveryUserDto.password);
    try {
      await this.prismaService.jwt.delete({
        where: {
          id: checkResult.jwtRow.id,
        },
      });
    } catch (error) {}

    const auth = await this.authService.login(user);

    return {
      accessToken: auth.accessToken,
      user: this.userService.toView(auth.user, UserViewType.PRIVATE),
    };
  }

  @Get('/:id')
  @ApiOperation({
    summary: '/:id',
  })
  async getUserById(@Param() params: ByIdParamsDto) {
    const userIdBI = BigInt(params.id);

    const user = await this.userService.findFirst({
      id: userIdBI,
      role: UserRole.USER,
      ...this.userService.whereNotDeleted(),
    });

    if (!user) {
      throw new HttpException(ExErrors.Users.NotFound, HttpStatus.NOT_FOUND);
    }

    return {
      user: this.userService.toView(user),
    };
  }
}
