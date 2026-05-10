import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminGuard } from './guards/admin.guard';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { EnabledUserGuard } from './guards/enabled-user.guard';
import { GoogleStrategy } from './google.strategy';
import { SessionSerializer } from './session.serializer';

@Global()
@Module({
  imports: [PassportModule.register({ session: true })],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleStrategy,
    SessionSerializer,
    AuthenticatedGuard,
    EnabledUserGuard,
    AdminGuard,
  ],
  exports: [AuthService, AuthenticatedGuard, EnabledUserGuard, AdminGuard],
})
export class AuthModule {}
