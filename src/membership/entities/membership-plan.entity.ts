import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MembershipPlanDocument = HydratedDocument<MembershipPlanEntity>;

@Schema({ timestamps: true, collection: 'membership_plans' })
export class MembershipPlanEntity {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: String, unique: true, sparse: true })
  slug: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' })
  interval: 'monthly' | 'quarterly' | 'yearly';

  @Prop({ type: [String], default: [] })
  benefits: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity' })
  createdBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'UserEntity' })
  updatedBy: Types.ObjectId;
}

export const MembershipPlanSchema = SchemaFactory.createForClass(MembershipPlanEntity);

MembershipPlanSchema.set('toJSON', {
  transform: (doc, ret: any) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});
