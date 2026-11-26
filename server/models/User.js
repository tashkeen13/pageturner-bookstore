import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const savedAddressSchema = new mongoose.Schema({
  label: { type: String, trim: true, maxlength: 40, default: 'Home' },
  fullName: { type: String, required: true, trim: true, maxlength: 100 },
  address: { type: String, required: true, trim: true, maxlength: 200 },
  city: { type: String, required: true, trim: true, maxlength: 100 },
  postalCode: { type: String, required: true, trim: true, maxlength: 30 },
  country: { type: String, required: true, trim: true, maxlength: 100 }
}, { _id: true });

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required.'],
      trim: true,
      maxlength: [80, 'Name cannot be longer than 80 characters.']
    },
    email: {
      type: String,
      required: [true, 'Email is required.'],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, 'Email cannot be longer than 254 characters.']
    },
    // Excluded from normal queries so password hashes are not returned by accident.
    password: {
      type: String,
      required: [true, 'Password is required.'],
      minlength: [8, 'Password must be at least 8 characters long.'],
      select: false
    },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    isBlocked: {
      type: Boolean,
      default: false
    },
    wishlist: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Book'
    }],
    savedAddresses: { type: [savedAddressSchema], default: [] }
  },
  { timestamps: true }
);

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;
