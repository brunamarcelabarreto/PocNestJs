import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../common/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { UserRole } from './dto/user.dto';
import {
  BCRYPT_SALT_ROUNDS,
  MAX_SLUG_LENGTH,
  MIN_PASSWORD_LENGTH,
  REFRESH_TOKEN_EXPIRY_MS,
  REFRESH_TOKEN_EXPIRY_SECONDS,
} from '../../common/constants/auth.constants';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) { }

  async registerTenant(tenantName: string, email: string, password: string, adminName: string) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('Email já cadastrado');
    }

    const slug = tenantName.toLowerCase().replace(/\s+/g, '-').slice(0, MAX_SLUG_LENGTH);

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException('Senha deve ter pelo menos 8 caracteres');
    }

    const hashedPassword = await this.hashPassword(password);

    const result = await this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name: adminName,
          role: UserRole.ADMIN,
          tenantId: tenant.id,
        },
      });

      return { tenant, user };
    });

    return {
      tenant: result.tenant,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
    };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: { email },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.active) {
      throw new UnauthorizedException('Usuário inativo');
    }

    const passwordMatch = await this.comparePassword(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const accessToken = this.generateJwt(user.id, user.email, user.tenantId, user.role);
    const refreshTokenValue = this.generateRefreshToken(user.id);

    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
    await this.prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  async refreshToken(refreshTokenValue: string) {
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshTokenValue },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expirado');
    }

    const user = tokenRecord.user;
    const newAccessToken = this.generateJwt(
      user.id,
      user.email,
      user.tenantId,
      user.role,
    );

    const newRefreshTokenValue = this.generateRefreshToken(user.id);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);

    await this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.delete({
        where: { token: refreshTokenValue },
      });

      await tx.refreshToken.create({
        data: {
          token: newRefreshTokenValue,
          userId: user.id,
          expiresAt,
        },
      });
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenValue,
    };
  }

  async logout(refreshTokenValue: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshTokenValue },
    });
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  generateJwt(userId: string, email: string, tenantId: string, role: string) {
    return this.jwtService.sign({
      sub: userId,
      email,
      tenantId,
      role,
    });
  }

  generateRefreshToken(userId: string) {
    return this.jwtService.sign(
      {
        sub: userId,
        type: 'refresh',
      },
      {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRATION', REFRESH_TOKEN_EXPIRY_SECONDS),
      },
    );
  }
}
