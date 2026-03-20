import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<UserEntity>;
export type UserStatus = 'pending' | 'active' | 'blocked' | 'suspended';

@Schema({ _id: false })
export class EmailVerificationData {
  @Prop({ type: String, default: null })
  codeHash?: string | null;

  @Prop({ type: Date, default: null })
  expiresAt?: Date | null;

  @Prop({ type: Date, default: null })
  lastSentAt?: Date | null;

  @Prop({ type: Number, default: 0 })
  attempts: number;
}

export const EmailVerificationDataSchema = SchemaFactory.createForClass(EmailVerificationData);

@Schema({ _id: false })
export class EmailChangeRequestData {
  @Prop({ type: String, default: null })
  newEmail?: string | null;

  @Prop({ type: String, default: null })
  codeHash?: string | null;

  @Prop({ type: Date, default: null })
  expiresAt?: Date | null;

  @Prop({ type: Date, default: null })
  lastSentAt?: Date | null;

  @Prop({ type: Number, default: 0 })
  attempts: number;
}

export const EmailChangeRequestDataSchema = SchemaFactory.createForClass(EmailChangeRequestData);

@Schema({ _id: false })
export class PhoneVerificationData {
  @Prop({ type: String, default: null })
  phone?: string | null;

  @Prop({ type: String, enum: ['sms', 'whatsapp'], default: null })
  channel?: 'sms' | 'whatsapp' | null;

  @Prop({ type: String, default: null })
  codeHash?: string | null;

  @Prop({ type: Date, default: null })
  expiresAt?: Date | null;

  @Prop({ type: Date, default: null })
  lastSentAt?: Date | null;

  @Prop({ type: Number, default: 0 })
  attempts: number;
}

export const PhoneVerificationDataSchema = SchemaFactory.createForClass(PhoneVerificationData);

@Schema({ _id: false })
export class PasswordResetRequestData {
  @Prop({ type: String, default: null })
  codeHash?: string | null;

  @Prop({ type: Date, default: null })
  expiresAt?: Date | null;

  @Prop({ type: Date, default: null })
  lastSentAt?: Date | null;

  @Prop({ type: Number, default: 0 })
  attempts: number;
}

export const PasswordResetRequestDataSchema = SchemaFactory.createForClass(PasswordResetRequestData);

@Schema({ _id: false })
export class PasswordHistoryItem {
  @Prop({ type: String, required: true, select: false })
  hash: string;

  @Prop({ type: Date, required: true })
  changedAt: Date;
}

export const PasswordHistoryItemSchema = SchemaFactory.createForClass(PasswordHistoryItem);

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
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

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

  @Prop({ type: String, default: null })
  photoStorageKey?: string | null;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ type: String, enum: ['pending', 'active', 'blocked', 'suspended'], default: 'pending' })
  status: UserStatus;

  @Prop({ type: String, default: null })
  statusReason?: string | null;

  @Prop({ type: Date, default: null })
  lastLoginAt?: Date | null;

  @Prop({ type: Number, default: 0 })
  failedLoginAttempts: number;

  @Prop({ type: Date, default: null })
  loginBlockedUntil?: Date | null;

  @Prop({ type: Date, default: null })
  passwordUpdatedAt?: Date | null;

  @Prop({ type: [PasswordHistoryItemSchema], default: [], select: false })
  passwordHistory?: PasswordHistoryItem[];

  @Prop({ type: String, default: null, select: false })
  refreshTokenHash?: string | null;

  @Prop({ type: Date, default: null, select: false })
  refreshTokenExpiresAt?: Date | null;

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

  @Prop({ type: EmailVerificationDataSchema, default: null })
  emailVerification?: EmailVerificationData | null;

  @Prop({ type: EmailChangeRequestDataSchema, default: null })
  emailChangeRequest?: EmailChangeRequestData | null;

  @Prop({ type: PhoneVerificationDataSchema, default: null })
  phoneVerification?: PhoneVerificationData | null;

  @Prop({ type: PasswordResetRequestDataSchema, default: null })
  passwordResetRequest?: PasswordResetRequestData | null;
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
