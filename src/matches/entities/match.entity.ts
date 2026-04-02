import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

export type MatchDocument = HydratedDocument<MatchEntity>;

export type MatchStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';

@Schema({ _id: false })
class MatchGoal {
  @Prop({ required: true })
  minute: number;

  @Prop({ required: true, trim: true })
  scorer: string;

  @Prop({ required: true, enum: ['PELOTAS', 'OPPONENT'] })
  team: 'PELOTAS' | 'OPPONENT';
}

const MatchGoalSchema = SchemaFactory.createForClass(MatchGoal);

@Schema({
  collection: 'matches',
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      (ret as any).id = ret._id;
      return ret;
    },
  },
})
export class MatchEntity {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'CompetitionEntity', required: false })
  competitionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'TeamEntity', required: true })
  opponentId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true, trim: true })
  stadium: string;

  @Prop({ default: true })
  isHome: boolean;

  @Prop({ type: Number, default: 0 })
  homeScore: number;

  @Prop({ type: Number, default: 0 })
  awayScore: number;

  @Prop({ type: String, enum: ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED'], default: 'SCHEDULED' })
  status: MatchStatus;

  @Prop({ type: [MatchGoalSchema], default: [] })
  goals: MatchGoal[];

  @Prop({ type: String, default: null })
  ticketsUrl?: string | null;

  @Prop({ type: String, default: null })
  transmissionUrl?: string | null;

  @Prop({ type: Types.ObjectId, ref: 'NewsEntity', default: null })
  newsId?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;
}

export const MatchSchema = SchemaFactory.createForClass(MatchEntity);
