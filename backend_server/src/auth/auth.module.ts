import { Module, forwardRef } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
@Module({
  imports: [],
  providers: [AuthService, AuthGuard, ],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}