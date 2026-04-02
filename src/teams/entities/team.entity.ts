import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TeamDocument = HydratedDocument<TeamEntity>;

@Schema({
  collection: 'teams',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      (ret as any).id = ret._id;
      return ret;
    },
  },
})
export class TeamEntity {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  shortName?: string;

  @Prop({ type: String, default: null })
  logoUrl?: string | null;

  @Prop({ type: String, default: null })
  logoStorageKey?: string | null;

  @Prop({ type: Boolean, default: false })
  isPelotas: boolean; // Para identificar o próprio Pelotas se necessário

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const TeamSchema = SchemaFactory.createForClass(TeamEntity);
