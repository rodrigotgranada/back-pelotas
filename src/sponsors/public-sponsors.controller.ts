import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SponsorsService } from './sponsors.service';

@ApiTags('Public / Sponsors')
@Controller('public/sponsors')
export class PublicSponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  @Get()
  @ApiOperation({ summary: 'Returns all strictly active sponsors ordered by "order" for the Carousel' })
  @ApiResponse({ status: 200, description: 'Returns an array of active sponsors' })
  findAllActive() {
    return this.sponsorsService.findAll(true);
  }
}
