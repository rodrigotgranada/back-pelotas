import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { NewsEntity, NewsDocument, NewsFormat, NewsStatus } from '../entities/news.entity';

export class ShortUserDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
}

export class NewsResponseDto {
  @ApiProperty({ example: '60d5ecb8b392d700153f3a1f' })
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  slug: string;

  @ApiPropertyOptional()
  subtitle?: string | null;

  @ApiProperty()
  content: any;

  @ApiProperty({ enum: ['HTML', 'BLOCKS'] })
  format: NewsFormat;

  @ApiPropertyOptional()
  coverImageUrl?: string | null;

  @ApiPropertyOptional({ type: ShortUserDto })
  author?: ShortUserDto;

  @ApiPropertyOptional({ type: ShortUserDto })
  lastEditor?: ShortUserDto;

  @ApiProperty()
  isFeatured: boolean;

  @ApiPropertyOptional()
  authorDisplayName?: string | null;

  @ApiProperty()
  categories: string[];

  @ApiProperty({ enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'] })
  status: NewsStatus;

  @ApiPropertyOptional()
  publishedAt?: Date | null;

  @ApiProperty()
  views: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(news: NewsDocument) {
    this.id = news._id.toHexString();
    this.title = news.title;
    this.slug = news.slug || this.id;
    this.subtitle = news.subtitle;
    this.content = news.content;
    this.format = news.format;
    this.coverImageUrl = news.coverImageUrl;
    this.isFeatured = news.isFeatured;
    this.authorDisplayName = news.authorDisplayName;
    this.categories = news.categories || [];
    this.status = news.status;
    this.publishedAt = news.publishedAt;
    this.views = news.views;
    this.createdAt = news.createdAt;
    this.updatedAt = news.updatedAt;

    if (news.createdBy && (news.createdBy as any).firstName) {
      this.author = {
        id: (news.createdBy as any)._id.toHexString(),
        name: `${(news.createdBy as any).firstName} ${(news.createdBy as any).lastName || ''}`.trim()
      };
    }

    if (news.updatedBy && (news.updatedBy as any).firstName) {
      this.lastEditor = {
        id: (news.updatedBy as any)._id.toHexString(),
        name: `${(news.updatedBy as any).firstName} ${(news.updatedBy as any).lastName || ''}`.trim()
      };
    }
  }
}
