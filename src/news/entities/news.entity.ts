import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type NewsDocument = HydratedDocument<NewsEntity>;

export type NewsStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type NewsFormat = 'HTML' | 'BLOCKS';

@Schema({
  collection: 'news',
  timestamps: true,
})
export class NewsEntity {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: String, unique: true, required: true })
  slug: string;

  @Prop({ type: String, trim: true, default: null })
  subtitle?: string | null;

  @Prop({ required: true, type: MongooseSchema.Types.Mixed })
  content: string | Record<string, any>;

  @Prop({ required: true, enum: ['HTML', 'BLOCKS'] })
  format: NewsFormat;

  @Prop({ type: String, default: null })
  coverImageUrl?: string | null;

  @Prop({ type: String, default: null })
  coverImageStorageKey?: string | null;

  @Prop({ type: String, enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'], default: 'DRAFT' })
  status: NewsStatus;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ type: Date, default: null })
  publishedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', default: null })
  authorId?: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  authorDisplayName?: string | null;

  @Prop({ type: [String], default: [] })
  categories: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: Boolean, default: true })
  allowComments: boolean;

  @Prop({ type: Boolean, default: true })
  allowLikes: boolean;

  @Prop({ type: Number, default: 0 })
  likesCount: number;

  @Prop({ type: Number, default: 0 })
  views: number;

  createdAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', default: null })
  createdBy?: Types.ObjectId | null;

  updatedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', default: null })
  updatedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', default: null })
  deletedBy?: Types.ObjectId | null;
}

export const NewsSchema = SchemaFactory.createForClass(NewsEntity);
