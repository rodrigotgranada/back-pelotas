import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Req,
  Query,
  UnauthorizedException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Express } from 'express';
import { ROLE_CODES } from '../auth/authorization/role-codes';
import { RequireRoleCodes } from '../auth/authorization/require-role-codes.decorator';
import { RolesGuard } from '../auth/authorization/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { ConfirmEmailChangeDto } from './dto/confirm-email-change.dto';
import { ConfirmPhoneVerificationDto } from './dto/confirm-phone-verification.dto';
import { RequestEmailChangeDto } from './dto/request-email-change.dto';
import { RequestPhoneVerificationDto } from './dto/request-phone-verification.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { SuspendUserDto } from './dto/suspend-user.dto';
import { UpdateOwnUserDto } from './dto/update-own-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ListUsersDto } from './dto/list-users.dto';
import { PaginatedUsersResponseDto } from './dto/paginated-users-response.dto';
import { UsersService } from './users.service';

interface RequestInfo {
  ip?: string;
  headers?: Record<string, string | string[] | undefined>;
  user?: { sub?: string };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiOperation({ summary: 'Cadastrar usuario' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'Usuario criado com sucesso', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email, documento ou telefone ja em uso' })
  create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: { user?: { sub?: string } },
  ): Promise<UserResponseDto> {
    if (!createUserDto.createdBy && req.user?.sub) {
      createUserDto.createdBy = req.user.sub;
    }

    return this.usersService.create(createUserDto);
  }

  @Post('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiOperation({ summary: 'Cadastrar usuario via Backoffice/Admin (Ignora validacao inicial e gera senha temporaria)' })
  @ApiBody({ type: CreateAdminUserDto })
  @ApiResponse({ status: 201, description: 'Usuario criado com sucesso', type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email, documento ou telefone ja em uso' })
  createAdminUser(
    @Body() createAdminUserDto: CreateAdminUserDto,
    @Req() req: { user?: { sub?: string } },
  ): Promise<UserResponseDto> {
    if (!req.user?.sub) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }

    return this.usersService.createAdminUser(createAdminUserDto, req.user.sub);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiOperation({ summary: 'Listar usuarios com filtros e paginacao' })
  @ApiOkResponse({ type: PaginatedUsersResponseDto })
  findAll(@Query() query: ListUsersDto): Promise<PaginatedUsersResponseDto> {
    return this.usersService.findAll(query);
  }

  @Get('me')
  @ApiOperation({ summary: 'Buscar dados do usuario autenticado' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 404, description: 'Usuario nao encontrado' })
  findMe(@Req() req: { user?: { sub?: string } }): Promise<UserResponseDto> {
    const authenticatedUserId = req.user?.sub;

    if (!authenticatedUserId) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }

    return this.usersService.findOne(authenticatedUserId);
  }

  @Patch(':id/reactivate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiOperation({ summary: 'Reativar usuario excluido (soft delete)' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  async reactivate(
    @Param('id') id: string,
    @Req() req: RequestInfo,
  ): Promise<UserResponseDto> {
    return this.usersService.reactivate(id, this.extractRequestContext(req));
  }

  @Patch(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiOperation({ summary: 'Suspender usuario com motivo' })
  @ApiBody({ type: SuspendUserDto })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  async suspend(
    @Param('id') targetUserId: string,
    @Body() dto: SuspendUserDto,
    @Req() req: { user?: { sub?: string } },
  ): Promise<UserResponseDto> {
    const actorUserId = req.user?.sub;
    if (!actorUserId) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }
    return this.usersService.suspend(targetUserId, dto.reason, actorUserId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiOperation({ summary: 'Buscar usuario por id' })
  @ApiParam({ name: 'id', description: 'Id do usuario (ObjectId)' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario nao encontrado' })
  findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Editar o proprio usuario autenticado' })
  @ApiBody({ type: UpdateOwnUserDto })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 409, description: 'Email, documento ou telefone ja em uso' })
  updateMe(
    @Body() updateOwnUserDto: UpdateOwnUserDto,
    @Req() req: { user?: { sub?: string } },
  ): Promise<UserResponseDto> {
    const authenticatedUserId = req.user?.sub;

    if (!authenticatedUserId) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }

    const payload: UpdateUserDto = {
      ...updateOwnUserDto,
      updatedBy: authenticatedUserId,
    };

    return this.usersService.update(authenticatedUserId, payload);
  }

  @Post('me/request-email-change')
  @ApiOperation({ summary: 'Solicitar troca do proprio email com codigo (validade 2h)' })
  @ApiBody({ type: RequestEmailChangeDto })
  @ApiResponse({
    status: 201,
    description: 'Codigo enviado para o novo email',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Codigo enviado para confirmacao da troca de email' },
        expiresInMinutes: { type: 'number', example: 120 },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 409, description: 'Novo email ja esta em uso' })
  async requestEmailChange(
    @Body() requestEmailChangeDto: RequestEmailChangeDto,
    @Req() req: { user?: { sub?: string } },
  ): Promise<{ message: string; expiresInMinutes: number }> {
    const authenticatedUserId = req.user?.sub;

    if (!authenticatedUserId) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }

    await this.usersService.requestOwnEmailChange(
      authenticatedUserId,
      requestEmailChangeDto.newEmail,
    );

    return {
      message: 'Codigo enviado para confirmacao da troca de email',
      expiresInMinutes: 120,
    };
  }

  @Post('me/photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload da foto de perfil do usuario autenticado' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Arquivo invalido ou nao enviado' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 413, description: 'Arquivo excede 5MB' })
  uploadOwnPhoto(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user?: { sub?: string } },
  ): Promise<UserResponseDto> {
    const authenticatedUserId = req.user?.sub;

    if (!authenticatedUserId) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }

    return this.usersService.uploadOwnPhoto(authenticatedUserId, file, this.extractRequestContext(req));
  }

  @Post(':id/photo')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  @ApiOperation({ summary: 'Upload de foto de perfil de um usuario pelo administrador' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Arquivo invalido ou nao enviado' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  uploadUserPhoto(
    @Param('id') targetUserId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: { user?: { sub?: string } },
  ): Promise<UserResponseDto> {
    const actorUserId = req.user?.sub;
    if (!actorUserId) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }
    return this.usersService.uploadUserPhotoByAdmin(
      targetUserId,
      actorUserId,
      file,
      this.extractRequestContext(req),
    );
  }

  @Post(':id/force-logout')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Encerra sessoes ativas do usuario (Derrubar Sessao)' })
  @ApiOkResponse({ description: 'Sessoes encerradas com sucesso' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao' })
  async forceLogout(
    @Param('id') targetUserId: string,
    @Req() req: { user?: { sub?: string } },
  ): Promise<{ message: string }> {
    const actorUserId = req.user?.sub;
    if (!actorUserId) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }

    await this.usersService.forceLogout(targetUserId, actorUserId);
    return { message: 'Sessoes do usuario encerradas com sucesso' };
  }

  @Delete('me/photo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover foto de perfil do usuario autenticado' })
  @ApiNoContentResponse({ description: 'Foto removida com sucesso' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  async removeOwnPhoto(@Req() req: RequestInfo): Promise<void> {
    const authenticatedUserId = req.user?.sub;

    if (!authenticatedUserId) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }

    await this.usersService.removeOwnPhoto(authenticatedUserId, this.extractRequestContext(req));
  }

  @Post('me/change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Alterar senha do usuario autenticado' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiNoContentResponse({ description: 'Senha alterada com sucesso' })
  @ApiResponse({ status: 400, description: 'Senha atual invalida ou nova senha nao permitida' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  async changeOwnPassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req: RequestInfo,
  ): Promise<void> {
    const authenticatedUserId = req.user?.sub;

    if (!authenticatedUserId) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }

    await this.usersService.changeOwnPassword(
      authenticatedUserId,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
      this.extractRequestContext(req),
    );
  }

  @Post('me/confirm-email-change')
  @ApiOperation({ summary: 'Confirmar troca do proprio email com codigo' })
  @ApiBody({ type: ConfirmEmailChangeDto })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Codigo invalido, expirado ou sem solicitacao pendente' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  confirmEmailChange(
    @Body() confirmEmailChangeDto: ConfirmEmailChangeDto,
    @Req() req: { user?: { sub?: string } },
  ): Promise<UserResponseDto> {
    const authenticatedUserId = req.user?.sub;

    if (!authenticatedUserId) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }

    return this.usersService.confirmOwnEmailChange(authenticatedUserId, confirmEmailChangeDto.code);
  }

  @Post('me/request-phone-verification')
  @ApiOperation({ summary: 'Solicitar verificacao de telefone com codigo (validade 2h)' })
  @ApiBody({ type: RequestPhoneVerificationDto })
  @ApiResponse({
    status: 201,
    description: 'Codigo enviado para verificacao do telefone',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Codigo enviado para verificacao do telefone' },
        expiresInMinutes: { type: 'number', example: 120 },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Telefone invalido ou nao pertence ao usuario' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  async requestPhoneVerification(
    @Body() requestPhoneVerificationDto: RequestPhoneVerificationDto,
    @Req() req: { user?: { sub?: string } },
  ): Promise<{ message: string; expiresInMinutes: number }> {
    const authenticatedUserId = req.user?.sub;

    if (!authenticatedUserId) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }

    await this.usersService.requestOwnPhoneVerification(
      authenticatedUserId,
      requestPhoneVerificationDto.phone,
      requestPhoneVerificationDto.channel,
    );

    return {
      message: 'Codigo enviado para verificacao do telefone',
      expiresInMinutes: 120,
    };
  }

  @Post('me/confirm-phone-verification')
  @ApiOperation({ summary: 'Confirmar verificacao de telefone com codigo' })
  @ApiBody({ type: ConfirmPhoneVerificationDto })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Codigo invalido, expirado ou sem solicitacao pendente' })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  confirmPhoneVerification(
    @Body() confirmPhoneVerificationDto: ConfirmPhoneVerificationDto,
    @Req() req: { user?: { sub?: string } },
  ): Promise<UserResponseDto> {
    const authenticatedUserId = req.user?.sub;

    if (!authenticatedUserId) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }

    return this.usersService.confirmOwnPhoneVerification(
      authenticatedUserId,
      confirmPhoneVerificationDto.code,
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @ApiOperation({ summary: 'Editar usuario terceiro (requer permissao)' })
  @ApiParam({ name: 'id', description: 'Id do usuario (ObjectId)' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 401, description: 'Nao autenticado' })
  @ApiResponse({ status: 403, description: 'Sem permissao para editar terceiros' })
  @ApiResponse({ status: 409, description: 'Email, documento ou telefone ja em uso' })
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: { user?: { sub?: string } },
  ): Promise<UserResponseDto> {
    const authenticatedUserId = req.user?.sub;

    if (!authenticatedUserId) {
      throw new UnauthorizedException('Usuario nao autenticado');
    }

    if (authenticatedUserId === id) {
      throw new ForbiddenException('Use PUT /api/users/me para editar o proprio usuario');
    }

    await this.usersService.assertCanUpdateTargetUser(authenticatedUserId, id);

    if (!updateUserDto.updatedBy) {
      updateUserDto.updatedBy = authenticatedUserId;
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER, ROLE_CODES.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete de usuario' })
  @ApiParam({ name: 'id', description: 'Id do usuario (ObjectId)' })
  @ApiNoContentResponse({ description: 'Usuario marcado como deletado' })
  async softDelete(@Param('id') id: string, @Req() req: { user?: { sub?: string } }) {
    await this.usersService.softDelete(id, req.user?.sub);
  }

  @Delete(':id/hard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @RequireRoleCodes(ROLE_CODES.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deletar usuario permanentemente de toda a base (Apenas Owner)' })
  @ApiParam({ name: 'id', description: 'Id do usuario a ser removido' })
  @ApiNoContentResponse({ description: 'Usuario e seus dados removidos fisicamente' })
  async hardDelete(@Param('id') id: string, @Req() req: { user?: { sub?: string } }) {
    await this.usersService.hardDelete(id, req.user?.sub);
  }

  private extractRequestContext(req: RequestInfo): {
    ipAddress?: string;
    userAgent?: string;
    correlationId?: string;
  } {
    const userAgent = req.headers?.['user-agent'];
    const correlationId = req.headers?.['x-correlation-id'];

    return {
      ipAddress: req.ip,
      userAgent: Array.isArray(userAgent) ? userAgent[0] : userAgent,
      correlationId: Array.isArray(correlationId) ? correlationId[0] : correlationId,
    };
  }
}
