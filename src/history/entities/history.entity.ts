import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type HistoryDocument = HydratedDocument<HistoryEntity>;

@Schema({
  collection: 'history',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret: any) => {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
    },
  },
})
export class HistoryEntity {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  title: string;

  @Prop({ type: String, default: '' })
  year: string;

  @Prop({ required: true, trim: true, unique: true, lowercase: true })
  slug: string;

  @Prop({ type: Object, required: true })
  content: any; // Editor.js JSON or HTML

  @Prop({ type: String, enum: ['HTML', 'BLOCKS'], default: 'BLOCKS' })
  format: 'HTML' | 'BLOCKS';

  @Prop({ type: String, default: null })
  coverImageUrl?: string | null;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, default: null })
  createdBy?: Types.ObjectId | null;

  @Prop({ type: Types.ObjectId, default: null })
  updatedBy?: Types.ObjectId | null;

  createdAt: Date;
  updatedAt: Date;
}

export const HistorySchema = SchemaFactory.createForClass(HistoryEntity);

HistorySchema.index({ order: 1 });
