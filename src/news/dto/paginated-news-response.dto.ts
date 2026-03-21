import { ApiProperty } from '@nestjs/swagger';
import { NewsResponseDto } from './news-response.dto';

export class PaginatedNewsResponseDto {
  @ApiProperty({ type: [NewsResponseDto] })
  items: NewsResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  pages: number;
}
