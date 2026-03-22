import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CommentDocument = HydratedDocument<CommentEntity>;

export type CommentStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

@Schema({ collection: 'news_comments', timestamps: true })
export class CommentEntity {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'NewsEntity', required: true, index: true })
  newsId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: true })
  authorId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true, maxlength: 1000 })
  content: string;

  @Prop({ type: String, enum: ['APPROVED', 'PENDING', 'REJECTED'], default: 'APPROVED', index: true })
  status: CommentStatus;

  createdAt: Date;
  updatedAt: Date;
}

export const CommentSchema = SchemaFactory.createForClass(CommentEntity);
