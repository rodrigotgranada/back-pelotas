import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { AthleteEntity } from '../../athletes/entities/athlete.entity';

export type SquadDocument = SquadEntity & Document;

export class SquadMember {
  @Prop({ type: Types.ObjectId, ref: AthleteEntity.name, required: true })
  athleteId: Types.ObjectId;

  @Prop({ type: Number, default: null })
  number?: number;

  @Prop({ type: String, default: null })
  role?: string; // Ex: "Titular", "Reserva", "Capitão"
}

@Schema({ timestamps: true, collection: 'squads' })
export class SquadEntity {
  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  competition: string; // Ex: "Gauchão", "Copa FGF"

  @Prop({ required: true })
  category: string; // Ex: "Profissional Masculino", "Sub-20"

  @Prop({ type: [SquadMember], default: [] })
  members: SquadMember[];

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

export const SquadSchema = SchemaFactory.createForClass(SquadEntity);
