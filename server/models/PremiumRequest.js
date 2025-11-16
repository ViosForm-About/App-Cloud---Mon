import mongoose from 'mongoose';

const premiumRequestSchema = new mongoose.Schema({
    requestId: {
        type: String,
        required: true,
        unique: true,
        default: () => `PREQ${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'completed'],
        default: 'pending'
    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    approvedDate: {
        type: Date,
        default: null
    },
    approvedBy: {
        type: String,
        default: null
    },
    notes: {
        type: String,
        default: null
    },
    planType: {
        type: String,
        enum: ['monthly', 'yearly', 'lifetime'],
        default: 'monthly'
    },
    telegramUsername: {
        type: String,
        default: null
    },
    paymentProof: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Index untuk query yang sering
premiumRequestSchema.index({ userId: 1 });
premiumRequestSchema.index({ status: 1 });
premiumRequestSchema.index({ requestDate: -1 });

// Method untuk approve request
premiumRequestSchema.methods.approve = function(adminId) {
    this.status = 'approved';
    this.approvedBy = adminId;
    this.approvedDate = new Date();
    return this.save();
};

// Method untuk complete request
premiumRequestSchema.methods.complete = function() {
    this.status = 'completed';
    return this.save();
};

// Method untuk reject request
premiumRequestSchema.methods.reject = function(reason) {
    this.status = 'rejected';
    this.notes = reason;
    return this.save();
};

// Static method untuk get pending requests
premiumRequestSchema.statics.getPendingRequests = function() {
    return this.find({ status: 'pending' })
        .populate('userId', 'name email userId')
        .sort({ requestDate: -1 });
};

// Static method untuk get user active request
premiumRequestSchema.statics.getUserActiveRequest = function(userId) {
    return this.findOne({ 
        userId, 
        status: { $in: ['pending', 'approved'] } 
    });
};

export default mongoose.model('PremiumRequest', premiumRequestSchema);