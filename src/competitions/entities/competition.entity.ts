import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CompetitionDocument = HydratedDocument<CompetitionEntity>;

@Schema({
  collection: 'competitions',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      (ret as any).id = ret._id;
      return ret;
    },
  },
})
export class CompetitionEntity {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  season: string;

  @Prop({ type: String, default: null })
  externalTableUrl?: string | null;

  @Prop({ type: String, default: null })
  logoUrl?: string | null;

  @Prop({ type: String, default: null })
  logoStorageKey?: string | null;

  @Prop({ default: true })
  isActive: boolean;
}

export const CompetitionSchema = SchemaFactory.createForClass(CompetitionEntity);
