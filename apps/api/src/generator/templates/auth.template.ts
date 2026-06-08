import { ProjectConfig } from '@ns/shared';
import { GeneratedFile } from '../types';

export function renderAuthModule(config: ProjectConfig): GeneratedFile[] {
  const hasRefresh = config.auth === 'jwt-refresh' || config.auth === 'jwt-refresh-roles';
  const hasRoles = config.auth === 'jwt-refresh-roles';
  const files: GeneratedFile[] = [];

  files.push({ path: 'src/auth/auth.module.ts', content: authModule(config, hasRefresh) });
  files.push({ path: 'src/auth/auth.controller.ts', content: authController(config, hasRefresh) });
  files.push({ path: 'src/auth/auth.service.ts', content: authService(config, hasRefresh) });
  files.push({ path: 'src/auth/strategies/jwt.strategy.ts', content: jwtStrategy() });
  files.push({ path: 'src/auth/guards/jwt-auth.guard.ts', content: jwtGuard() });
  files.push({ path: 'src/auth/dto/login.dto.ts', content: loginDto(config) });

  if (hasRefresh) {
    files.push({ path: 'src/auth/strategies/jwt-refresh.strategy.ts', content: jwtRefreshStrategy() });
    files.push({ path: 'src/auth/guards/jwt-refresh.guard.ts', content: jwtRefreshGuard() });
    files.push({ path: 'src/auth/dto/refresh.dto.ts', content: refreshDto() });
  }

  if (hasRoles) {
    files.push({ path: 'src/auth/decorators/roles.decorator.ts', content: rolesDecorator() });
    files.push({ path: 'src/auth/guards/roles.guard.ts', content: rolesGuard() });
    files.push({ path: 'src/auth/enums/role.enum.ts', content: roleEnum() });
  }

  return files;
}

function authModule(config: ProjectConfig, hasRefresh: boolean): string {
  return `import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
${hasRefresh ? "import { JwtRefreshStrategy } from './strategies/jwt-refresh.strategy';\n" : ''}
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN ?? '15m' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy${hasRefresh ? ', JwtRefreshStrategy' : ''}],
  exports: [AuthService],
})
export class AuthModule {}
`;
}

function authController(config: ProjectConfig, hasRefresh: boolean): string {
  const swagger = config.features.swagger;
  return `import { Body, Controller, Post${hasRefresh ? ', Get, Request, UseGuards' : ''} } from '@nestjs/common';
${swagger ? "import { ApiTags } from '@nestjs/swagger';\n" : ''}${hasRefresh ? "import { JwtRefreshGuard } from './guards/jwt-refresh.guard';\n" : ''}import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

${swagger ? "@ApiTags('auth')\n" : ''}@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
${hasRefresh ? `
  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  refresh(@Request() req: any) {
    return this.authService.refreshToken(req.user);
  }
` : ''}
}
`;
}

function authService(config: ProjectConfig, hasRefresh: boolean): string {
  return `import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(dto: LoginDto) {
    // TODO: look up user from your User entity/repository
    // const user = await this.userService.findByEmail(dto.email);
    // const valid = await bcrypt.compare(dto.password, user.password);
    // if (!valid) throw new UnauthorizedException();

    const payload = { sub: 1, email: dto.email };
    const accessToken = this.jwtService.sign(payload);
${hasRefresh ? `
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    });
    return { accessToken, refreshToken };
` : `    return { accessToken };`}
  }
${hasRefresh ? `
  refreshToken(user: any) {
    const payload = { sub: user.sub, email: user.email };
    return { accessToken: this.jwtService.sign(payload) };
  }
` : ''}
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }
}
`;
}

function jwtStrategy(): string {
  return `import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  validate(payload: any) {
    return { sub: payload.sub, email: payload.email };
  }
}
`;
}

function jwtGuard(): string {
  return `import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
`;
}

function jwtRefreshStrategy(): string {
  return `import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_REFRESH_SECRET,
    });
  }

  validate(payload: any) {
    return { sub: payload.sub, email: payload.email };
  }
}
`;
}

function jwtRefreshGuard(): string {
  return `import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtRefreshGuard extends AuthGuard('jwt-refresh') {}
`;
}

function loginDto(config: ProjectConfig): string {
  const useValidator = config.features.validation;
  return `${useValidator ? "import { IsEmail, IsString } from 'class-validator';\n\n" : ''}export class LoginDto {
  ${useValidator ? '@IsEmail()\n  ' : ''}email: string;
  ${useValidator ? '@IsString()\n  ' : ''}password: string;
}
`;
}

function refreshDto(): string {
  return `export class RefreshDto {\n  refreshToken: string;\n}\n`;
}

function rolesDecorator(): string {
  return `import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
`;
}

function rolesGuard(): string {
  return `import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;
    const { user } = context.switchToHttp().getRequest();
    return required.some((role) => user?.roles?.includes(role));
  }
}
`;
}

function roleEnum(): string {
  return `export enum Role {\n  USER = 'user',\n  ADMIN = 'admin',\n}\n`;
}
