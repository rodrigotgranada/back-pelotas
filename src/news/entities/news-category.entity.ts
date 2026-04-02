import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type NewsCategoryDocument = HydratedDocument<NewsCategoryEntity>;

@Schema({
  collection: 'news_categories',
  timestamps: true,
})
export class NewsCategoryEntity {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop({ required: true, unique: true, trim: true })
  slug: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: String, default: null })
  description?: string | null;
}

export const NewsCategorySchema = SchemaFactory.createForClass(NewsCategoryEntity);
