import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<UserEntity>;

@Schema({ _id: false })
export class UserContact {
  @Prop({ required: true, trim: true })
  type: string;

  @Prop({ required: true, trim: true })
  value: string;

  @Prop({ default: false })
  isPrimary: boolean;

  @Prop({ type: Date, default: null })
  verifiedAt?: Date | null;
}

export const UserContactSchema = SchemaFactory.createForClass(UserContact);

@Schema({ _id: false })
export class UserAddress {
  @Prop({ required: true, trim: true })
  type: string;

  @Prop({ required: true, trim: true })
  street: string;

  @Prop({ required: true, trim: true })
  number: string;

  @Prop({ type: String, default: null, trim: true })
  complement?: string | null;

  @Prop({ required: true, trim: true })
  neighborhood: string;

  @Prop({ required: true, trim: true })
  city: string;

  @Prop({ required: true, trim: true })
  state: string;

  @Prop({ required: true, trim: true })
  zipCode: string;

  @Prop({ required: true, trim: true })
  country: string;

  @Prop({ default: false })
  isPrimary: boolean;
}

export const UserAddressSchema = SchemaFactory.createForClass(UserAddress);

@Schema({
  collection: 'users',
  timestamps: true,
})
export class UserEntity {
  _id: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ trim: true })
  document?: string;

  @Prop({ trim: true })
  documentType?: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ type: Types.ObjectId, default: null })
  roleId?: Types.ObjectId | null;

  @Prop({ type: String, default: null })
  photoUrl?: string | null;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ type: Date, default: null })
  lastLoginAt?: Date | null;

  @Prop({ type: Date, default: null })
  passwordUpdatedAt?: Date | null;

  createdAt: Date;

  @Prop({ type: Types.ObjectId, default: null })
  createdBy?: Types.ObjectId | null;

  updatedAt: Date;

  @Prop({ type: Types.ObjectId, default: null })
  updatedBy?: Types.ObjectId | null;

  @Prop({ type: Date, default: null })
  deletedAt?: Date | null;

  @Prop({ type: Types.ObjectId, default: null })
  deletedBy?: Types.ObjectId | null;

  @Prop({ type: [UserContactSchema], default: [] })
  contacts?: UserContact[];

  @Prop({ type: [UserAddressSchema], default: [] })
  addresses?: UserAddress[];
}

export const UserSchema = SchemaFactory.createForClass(UserEntity);

UserSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { deletedAt: null },
  },
);

UserSchema.index(
  { document: 1 },
  {
    unique: true,
    partialFilterExpression: {
      deletedAt: null,
      document: { $exists: true, $type: 'string', $ne: '' },
    },
  },
);
