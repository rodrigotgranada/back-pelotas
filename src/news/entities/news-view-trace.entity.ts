import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NewsViewTraceDocument = HydratedDocument<NewsViewTraceEntity>;

@Schema({
  collection: 'news_view_traces',
  timestamps: { createdAt: true, updatedAt: false },
})
export class NewsViewTraceEntity {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'NewsEntity', required: true })
  newsId: Types.ObjectId;

  @Prop({ required: true, index: true })
  identifier: string; // Hash do IP ou User ID

  @Prop({ type: Date, default: Date.now, index: { expires: '24h' } })
  expiresAt: Date;
}

export const NewsViewTraceSchema = SchemaFactory.createForClass(NewsViewTraceEntity);

// Índice composto para garantir que o mesmo rastro só exista uma vez por matéria por janela de tempo
NewsViewTraceSchema.index({ newsId: 1, identifier: 1 }, { unique: true });
