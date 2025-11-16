import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
    fileId: {
        type: String,
        required: true,
        unique: true
    },
    originalName: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    customUrl: {
        type: String,
        default: null
    },
    customName: {
        type: String,
        default: null
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    accessCount: {
        type: Number,
        default: 0
    },
    isPublic: {
        type: Boolean,
        default: true
    },
    expiresAt: {
        type: Date,
        default: function() {
            // Default expire in 30 days
            const date = new Date();
            date.setDate(date.getDate() + 30);
            return date;
        }
    },
    downloadCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Index untuk performa query
fileSchema.index({ userId: 1, createdAt: -1 });
fileSchema.index({ fileId: 1 });
fileSchema.index({ customUrl: 1 }, { sparse: true });
fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method untuk increment access count
fileSchema.methods.incrementAccess = function() {
    this.accessCount += 1;
    return this.save();
};

// Method untuk increment download count
fileSchema.methods.incrementDownload = function() {
    this.downloadCount += 1;
    return this.save();
};

// Static method untuk get user files
fileSchema.statics.getUserFiles = function(userId, limit = 10, page = 1) {
    const skip = (page - 1) * limit;
    return this.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-__v');
};

// Static method untuk find by fileId
fileSchema.statics.findByFileId = function(fileId) {
    return this.findOne({ fileId });
};

// Virtual untuk file size in MB
fileSchema.virtual('sizeInMB').get(function() {
    return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Virtual untuk days until expiration
fileSchema.virtual('daysUntilExpiration').get(function() {
    const now = new Date();
    const diffTime = this.expiresAt - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

export default mongoose.model('File', fileSchema);