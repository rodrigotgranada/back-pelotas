import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiTags('Users')
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
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

  @Get()
  @ApiOperation({ summary: 'Listar usuarios ativos' })
  @ApiOkResponse({ type: UserResponseDto, isArray: true })
  findAll(): Promise<UserResponseDto[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuario por id' })
  @ApiParam({ name: 'id', description: 'Id do usuario (ObjectId)' })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 404, description: 'Usuario nao encontrado' })
  findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Editar usuario' })
  @ApiParam({ name: 'id', description: 'Id do usuario (ObjectId)' })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiResponse({ status: 409, description: 'Email, documento ou telefone ja em uso' })
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: { user?: { sub?: string } },
  ): Promise<UserResponseDto> {
    if (!updateUserDto.updatedBy && req.user?.sub) {
      updateUserDto.updatedBy = req.user.sub;
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Soft delete de usuario' })
  @ApiParam({ name: 'id', description: 'Id do usuario (ObjectId)' })
  @ApiNoContentResponse({ description: 'Usuario marcado como deletado' })
  async softDelete(@Param('id') id: string, @Req() req: { user?: { sub?: string } }) {
    await this.usersService.softDelete(id, req.user?.sub);
  }
}
