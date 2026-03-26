import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MembershipSubscriptionDocument = HydratedDocument<MembershipSubscriptionEntity>;

@Schema({ timestamps: true, collection: 'membership_subscriptions' })
export class MembershipSubscriptionEntity {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'MembershipPlanEntity', required: true })
  planId: Types.ObjectId;

  @Prop({ required: true, enum: ['active', 'pending_payment', 'canceled', 'expired'], default: 'pending_payment' })
  status: 'active' | 'pending_payment' | 'canceled' | 'expired';

  @Prop({ required: true, enum: ['pix', 'credit_card', 'boleto'] })
  paymentMethod: 'pix' | 'credit_card' | 'boleto';

  @Prop({ type: Date, required: true })
  validUntil: Date;

  @Prop({ type: Date })
  lastPaymentAt?: Date;

  @Prop({ type: Number })
  amountPaid?: number;
}

export const MembershipSubscriptionSchema = SchemaFactory.createForClass(MembershipSubscriptionEntity);

MembershipSubscriptionSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
