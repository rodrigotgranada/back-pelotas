import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SettingDocument = HydratedDocument<SettingEntity>;

@Schema({
  collection: 'settings',
  timestamps: true,
})
export class SettingEntity {
  @Prop({ required: true, unique: true, index: true })
  key: string;

  @Prop({ required: true, type: String })
  value: string;
}

export const SettingSchema = SchemaFactory.createForClass(SettingEntity);
