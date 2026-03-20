import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RoleDocument = HydratedDocument<RoleEntity>;

@Schema({
  collection: 'roles',
  timestamps: true,
})
export class RoleEntity {
  _id: Types.ObjectId;
  id: string;

  @Prop({ required: true, unique: true, trim: true, lowercase: true })
  code: string;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: Number, required: true })
  level: number;

  @Prop({ default: true })
  isActive: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const RoleSchema = SchemaFactory.createForClass(RoleEntity);
