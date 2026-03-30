import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type IdolDocument = IdolEntity & Document;

export class IdolStatistics {
  @Prop({ type: Number, default: null })
  matches?: number;

  @Prop({ type: Number, default: null })
  goals?: number;

  @Prop({ type: [String], default: [] })
  titles?: string[];
}

@Schema({ timestamps: true, collection: 'idols' })
export class IdolEntity {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  photoUrl: string;

  @Prop({ type: String })
  photoStorageKey?: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Boolean, default: false })
  isAthlete: boolean;

  @Prop({ type: String, default: null })
  role?: string;

  @Prop({ type: IdolStatistics })
  statistics?: IdolStatistics;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Number, default: 0 })
  order: number;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity' })
  updatedBy?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity' })
  deletedBy?: Types.ObjectId;
}

export const IdolSchema = SchemaFactory.createForClass(IdolEntity);
