import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ActivityLogDocument = HydratedDocument<ActivityLogEntity>;

@Schema({
  collection: 'activity_logs',
  timestamps: { createdAt: true, updatedAt: false },
})
export class ActivityLogEntity {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  action: string;

  @Prop({ required: true, trim: true })
  entity: string;

  @Prop({ type: String, default: null, trim: true })
  entityId?: string | null;

  @Prop({ required: true, enum: ['success', 'failure'] })
  status: 'success' | 'failure';

  @Prop({ type: Types.ObjectId, default: null })
  actorUserId?: Types.ObjectId | null;

  @Prop({ type: String, default: null, trim: true, lowercase: true })
  actorEmail?: string | null;

  @Prop({ type: String, default: null })
  message?: string | null;

  @Prop({ type: [String], default: [] })
  flags: string[];

  @Prop({ type: Object, default: {} })
  metadata: Record<string, unknown>;

  @Prop({ type: String, default: null, trim: true })
  ipAddress?: string | null;

  @Prop({ type: String, default: null, trim: true })
  userAgent?: string | null;

  @Prop({ type: String, default: null, trim: true })
  correlationId?: string | null;

  createdAt: Date;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLogEntity);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ action: 1, status: 1 });
ActivityLogSchema.index({ entity: 1, entityId: 1 });
ActivityLogSchema.index({ flags: 1 });
ActivityLogSchema.index({ actorUserId: 1, createdAt: -1 });
