import { Schema, model, Document } from "mongoose";
import bcrypt from "bcrypt";
import { v4 as uuid } from "uuid";

export interface IUser extends Document {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: "investor" | "admin";
  referralCode: string;
  referredBy?: string;
  walletBalance: number;
  otp?: string;
  otpExpiry?: Date;
  isVerified: boolean;
  comparePassword(candidate: string): Promise<boolean>;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    fullName: { type: String, required: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    phoneNumber: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["investor", "admin"], default: "investor" },
    referralCode: { type: String, unique: true, required: false },
    referredBy: { type: String },
    walletBalance: { type: Number, default: 0, min: 0 },
    otp: { type: String },
    otpExpiry: { type: Date },
    isVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  // Hash password if modified
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  
  // Always generate referral code if it doesn't exist or is empty
  if (!this.referralCode || (typeof this.referralCode === 'string' && this.referralCode.trim() === "")) {
    let newReferralCode: string = "";
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 10;
    
    // Keep generating until we get a unique code
    while (!isUnique && attempts < maxAttempts) {
      newReferralCode = uuid().substring(0, 8).toUpperCase();
      
      // Get the User model
      const UserModel = this.model("User");
      
      // Build query to check for existing referral code, excluding current document if it exists
      const query: any = { referralCode: newReferralCode };
      if (this._id) {
        query._id = { $ne: this._id };
      }
      
      const existingUser = await UserModel.findOne(query);
      if (!existingUser) {
        isUnique = true;
      }
      attempts++;
    }
    
    if (!isUnique) {
      return next(new Error("Failed to generate unique referral code after multiple attempts"));
    }
    
    this.referralCode = newReferralCode;
  }
  
  next();
});

UserSchema.methods.comparePassword = async function (candidate: string) {
  return await bcrypt.compare(candidate, this.password);
};

export const User = model<IUser>("User", UserSchema);
