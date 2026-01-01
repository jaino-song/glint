import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '@supabase/supabase-js';
import { AuthService, UpdateProfileDto } from './auth.service';
import { SupabaseAuthGuard } from '../../common/guards/supabase-auth.guard';
import { CurrentUser, CurrentUserId } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { updateProfileSchema } from '@glint/validators';
import { Profile } from '@glint/types';

@ApiTags('Auth')
@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@CurrentUser() user: User): Promise<Profile> {
    // ensureProfile: 프로필이 없으면 생성 (Supabase 트리거 실패 대비)
    return this.authService.ensureProfile({
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.name || user.user_metadata?.full_name,
    });
  }

  @Patch('me')
  @UseGuards(SupabaseAuthGuard)
  @ApiBearerAuth()
  @UsePipes(new ZodValidationPipe(updateProfileSchema))
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUserId() userId: string,
    @Body() data: UpdateProfileDto,
  ): Promise<Profile> {
    return this.authService.updateProfile(userId, data);
  }
}
