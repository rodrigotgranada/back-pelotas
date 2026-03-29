import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SponsorDocument = HydratedDocument<SponsorEntity>;

@Schema({
  collection: 'sponsors',
  timestamps: true,
})
export class SponsorEntity {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: String, trim: true, default: null })
  websiteUrl?: string | null;

  @Prop({ required: true, type: String })
  logoUrl: string;

  @Prop({ type: String, default: null })
  logoStorageKey?: string | null;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: 0 })
  order: number;

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

export const SponsorSchema = SchemaFactory.createForClass(SponsorEntity);
