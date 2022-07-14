import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { JwtUserAuthService } from '@share/modules/jwt/jwt-user-auth.service';
import { RedisService } from '@share/modules/redis/redis.service';
import { JwtUser } from './types';
import { ExErrors } from '@share/ex_errors.type';
import { PrismaService } from '@db/prisma.service';
import { UserService } from '@db/services/user.service';
import { useBcrypt } from '@share/bcrypt';

@Injectable()
export class AuthService {
  private bcrypt = useBcrypt();

  constructor(
    private redisService: RedisService,
    private prismaService: PrismaService,
    private userService: UserService,
    private jwtUserAuth: JwtUserAuthService,
  ) {}

  async passwordCheck(userId: bigint, password: string) {
    const user = await this.userService.findFirst({
      id: userId,
    });

    if (!user) {
      throw new Error('user not found');
    }

    const compareResult = await this.bcrypt.compare(
      password,
      user.passwordHash,
    );
    if (compareResult) {
      return true;
    }

    return false;
  }

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userService.findFirst({
      email,
    });

    if (!user) {
      throw new HttpException(
        ExErrors.Users.PasswordWrongOrNotFound,
        HttpStatus.NOT_FOUND,
      );
    }

    const compareResult = await this.bcrypt.compare(
      password,
      user.passwordHash,
    );
    if (!compareResult) {
      throw new HttpException(
        ExErrors.Users.PasswordWrongOrNotFound,
        HttpStatus.BAD_REQUEST,
      );
    }

    return user;
  }

  async login(user: User) {
    const tokenData = await this.jwtUserAuth.create(user.id);
    return {
      user: user,
      accessToken: tokenData.token,
    };
  }

  async cheackAccessToken(accessToken: string): Promise<JwtUser> {
    const payload = this.jwtUserAuth.verify(accessToken);

    const redisClient = this.redisService.getClient();
    const userId = payload.sub;
    const cacheKey = this.redisService.keys.getJwtUserCacheKey(userId);
    const userJwtCache = await redisClient.get(cacheKey);
    if (userJwtCache) {
      const jwtUser = JSON.parse(userJwtCache);
      return Object.assign(new JwtUser(), jwtUser);
    }

    const user = await this.prismaService.user.findFirst({
      where: {
        id: BigInt(userId),
      },
    });

    if (!user) {
      throw new Error('User not found!');
    }

    const jwtUser = {
      userId: user.id.toString(),
      role: user.role,
    };
    await redisClient.set(cacheKey, JSON.stringify(jwtUser), 'EX', 3600);

    return Object.assign(new JwtUser(), jwtUser);
  }
}
