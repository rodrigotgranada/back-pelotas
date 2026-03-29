import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MembershipInterestDocument = HydratedDocument<MembershipInterest>;

@Schema({ timestamps: true, collection: 'membership_interests' })
export class MembershipInterest {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', default: null })
  userId?: Types.ObjectId | null;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ default: true })
  isWhatsApp: boolean;

  @Prop({ type: Types.ObjectId, ref: 'MembershipPlanEntity', required: true })
  planId: Types.ObjectId;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ 
    type: String, 
    enum: ['PENDING', 'CONTACTED', 'COMPLETED', 'REJECTED'], 
    default: 'PENDING' 
  })
  status: string;

  @Prop({ trim: true, default: null })
  resolutionNotes?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const MembershipInterestSchema = SchemaFactory.createForClass(MembershipInterest);

MembershipInterestSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
