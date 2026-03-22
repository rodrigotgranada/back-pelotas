import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NewsLikeDocument = HydratedDocument<NewsLikeEntity>;

@Schema({ collection: 'news_likes', timestamps: true })
export class NewsLikeEntity {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'NewsEntity', required: true, index: true })
  newsId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: true, index: true })
  userId: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const NewsLikeSchema = SchemaFactory.createForClass(NewsLikeEntity);
NewsLikeSchema.index({ newsId: 1, userId: 1 }, { unique: true });
