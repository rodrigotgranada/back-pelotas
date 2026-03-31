import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AthleteDocument = AthleteEntity & Document;

export class PreviousClub {
  @Prop({ required: true })
  club: string;

  @Prop({ required: true })
  yearStart: number;

  @Prop({ type: Number, default: null })
  yearEnd?: number;
}

@Schema({ timestamps: true, collection: 'athletes' })
export class AthleteEntity {
  @Prop({ required: true })
  name: string;

  @Prop({ type: String, default: null })
  nickname?: string;

  @Prop({ required: true })
  photoUrl: string;

  @Prop({ type: String })
  photoStorageKey?: string;

  @Prop({ type: [String], default: [] })
  positions: string[];

  @Prop({ type: Date, default: null })
  dateOfBirth?: Date;

  @Prop({ type: Number, default: null })
  height?: number; // em cm

  @Prop({ type: String, default: null })
  hometown?: string; // Naturalidade

  @Prop({ type: String, default: null })
  preferredFoot?: string; // Destro, Canhoto, Ambidestro

  @Prop({ type: [PreviousClub], default: [] })
  previousClubs: PreviousClub[];

  @Prop({ type: Boolean, default: false })
  isStaff: boolean;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity' })
  updatedBy?: Types.ObjectId;

  @Prop({ type: Date, default: null })
  deletedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity' })
  deletedBy?: Types.ObjectId;
}

export const AthleteSchema = SchemaFactory.createForClass(AthleteEntity);
