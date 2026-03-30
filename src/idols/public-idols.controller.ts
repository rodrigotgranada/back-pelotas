import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IdolsService } from './idols.service';

@ApiTags('Public / Idols')
@Controller('public-idols')
export class PublicIdolsController {
  constructor(private readonly idolsService: IdolsService) {}

  @Get()
  @ApiOperation({ summary: 'Retorna a lista de ídolos ativos para exibição no site' })
  findAllPublic() {
    return this.idolsService.findAll(true);
  }
}
