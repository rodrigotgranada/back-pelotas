import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdateSettingDto } from './dto/update-setting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { ROLE_CODES } from '../auth/authorization/role-codes';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  @ApiOperation({ summary: 'Retorna configurações públicas do portal (badge, tema)' })
  getPublic() {
    return this.settingsService.getPublicSettings();
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualiza uma configuração (owner/admin)' })
  update(@Body() dto: UpdateSettingDto) {
    return this.settingsService.updateSetting(dto);
  }
}
