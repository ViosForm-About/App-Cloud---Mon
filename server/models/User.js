import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        unique: true,
        default: () => `USER${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    },
    name: {
        type: String,
        required: [true, 'Nama harus diisi'],
        trim: true,
        minlength: [2, 'Nama minimal 2 karakter'],
        maxlength: [50, 'Nama maksimal 50 karakter']
    },
    email: {
        type: String,
        required: [true, 'Email harus diisi'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email tidak valid']
    },
    password: {
        type: String,
        required: [true, 'Password harus diisi'],
        minlength: [6, 'Password minimal 6 karakter']
    },
    avatar: {
        type: String,
        default: null
    },
    isPremium: {
        type: Boolean,
        default: false
    },
    premiumExpires: {
        type: Date,
        default: null
    },
    storageUsed: {
        type: Number,
        default: 0
    },
    maxStorage: {
        type: Number,
        default: 1073741824 // 1GB default
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Hash password sebelum simpan
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(12);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method untuk compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Method untuk check premium status
userSchema.methods.isPremiumActive = function() {
    return this.isPremium && (!this.premiumExpires || this.premiumExpires > new Date());
};

// Virtual untuk remaining storage
userSchema.virtual('remainingStorage').get(function() {
    return Math.max(0, this.maxStorage - this.storageUsed);
});

// Method untuk update storage
userSchema.methods.updateStorage = async function(fileSize) {
    this.storageUsed += fileSize;
    return this.save();
};

// Static method untuk get user by email
userSchema.statics.findByEmail = function(email) {
    return this.findOne({ email: email.toLowerCase() });
};

export default mongoose.model('User', userSchema);