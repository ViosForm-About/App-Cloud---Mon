import express from 'express';
import File from '../models/File.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import upload, { handleUploadError } from '../middleware/upload.js';
import { 
    generateStandardUrl, 
    generateCustomUrl, 
    generateFileId,
    validateCustomName 
} from '../utils/generateUrl.js';
import { formatFileSize, getFileExtension, sanitizeFilename } from '../utils/helpers.js';
import emailService from '../utils/emailService.js';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// @desc    Upload file and generate URL
// @route   POST /api/files/upload
// @access  Private
router.post('/upload', auth, upload.single('file'), handleUploadError, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Harap pilih file'
            });
        }

        const { type = 'standard', customName } = req.body;
        const userId = req.user.id;

        // Validate upload type
        if (!['standard', 'custom'].includes(type)) {
            // Delete uploaded file
            await fs.unlink(req.file.path).catch(console.error);
            
            return res.status(400).json({
                success: false,
                message: 'Tipe upload tidak valid'
            });
        }

        // Check user storage
        const user = await User.findById(userId);
        if (!user) {
            await fs.unlink(req.file.path).catch(console.error);
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        if (user.storageUsed + req.file.size > user.maxStorage) {
            // Delete uploaded file
            await fs.unlink(req.file.path).catch(console.error);
            
            return res.status(400).json({
                success: false,
                message: `Penyimpanan tidak cukup. Anda menggunakan ${formatFileSize(user.storageUsed)} dari ${formatFileSize(user.maxStorage)}. Upgrade ke premium untuk mendapatkan lebih banyak space.`
            });
        }

        const fileExtension = path.extname(req.file.originalname);
        let fileUrl;
        let fileCustomName = null;
        let fileCustomUrl = null;

        if (type === 'custom') {
            if (!user.isPremiumActive()) {
                // Delete uploaded file
                await fs.unlink(req.file.path).catch(console.error);
                
                return res.status(403).json({
                    success: false,
                    message: 'Fitur custom URL hanya untuk user premium. Silakan upgrade terlebih dahulu.'
                });
            }

            if (!customName || !validateCustomName(customName)) {
                // Delete uploaded file
                await fs.unlink(req.file.path).catch(console.error);
                
                return res.status(400).json({
                    success: false,
                    message: 'Nama custom tidak valid. Gunakan hanya huruf, angka, dan dash (3-30 karakter)'
                });
            }

            // Check if custom URL already exists
            const existingFile = await File.findOne({ 
                customUrl: { $regex: new RegExp(`/${customName}/`, 'i') } 
            });
            
            if (existingFile) {
                // Delete uploaded file
                await fs.unlink(req.file.path).catch(console.error);
                
                return res.status(400).json({
                    success: false,
                    message: 'Nama custom sudah digunakan. Silakan pilih nama lain.'
                });
            }

            fileUrl = generateCustomUrl(customName, fileExtension);
            fileCustomUrl = fileUrl;
            fileCustomName = customName;
        } else {
            fileUrl = generateStandardUrl(fileExtension);
        }

        // Generate unique file ID
        const fileId = generateFileId();

        // Create file record
        const file = await File.create({
            fileId: fileId,
            originalName: sanitizeFilename(req.file.originalname),
            fileName: req.file.filename,
            fileSize: req.file.size,
            fileType: fileExtension.toLowerCase(),
            mimeType: req.file.mimetype,
            url: fileUrl,
            customUrl: fileCustomUrl,
            customName: fileCustomName,
            userId: userId,
            expiresAt: user.isPremiumActive() ? 
                new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : // 1 year for premium
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)    // 30 days for free
        });

        // Update user storage
        user.storageUsed += req.file.size;
        await user.save();

        // Send email notification (async - don't wait for it)
        emailService.sendFileUploadNotification(
            user.email,
            user.name,
            file.originalName,
            file.url,
            formatFileSize(file.fileSize)
        ).catch(error => {
            console.error('Failed to send upload notification email:', error);
        });

        res.status(201).json({
            success: true,
            message: type === 'custom' ? 'File berhasil diupload dengan URL custom!' : 'File berhasil diupload!',
            data: {
                file: {
                    id: file._id,
                    fileId: file.fileId,
                    originalName: file.originalName,
                    fileSize: file.fileSize,
                    sizeInMB: file.sizeInMB,
                    fileType: file.fileType,
                    url: file.url,
                    customUrl: file.customUrl,
                    accessCount: file.accessCount,
                    downloadCount: file.downloadCount,
                    expiresAt: file.expiresAt,
                    createdAt: file.createdAt
                }
            }
        });
    } catch (error) {
        console.error('File upload error:', error);
        
        // Delete uploaded file if exists
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Error deleting uploaded file:', unlinkError);
            }
        }
        
        const errorMessage = error.code === 11000 ? 
            'File ID sudah ada. Silakan coba lagi.' : 
            'Terjadi kesalahan server';
            
        res.status(500).json({
            success: false,
            message: errorMessage
        });
    }
});

// @desc    Get user files
// @route   GET /api/files
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const userId = req.user.id;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build search query
        const searchQuery = {
            userId,
            ...(search && {
                $or: [
                    { originalName: { $regex: search, $options: 'i' } },
                    { customName: { $regex: search, $options: 'i' } }
                ]
            })
        };

        const files = await File.find(searchQuery)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .select('-__v');

        const totalFiles = await File.countDocuments(searchQuery);
        const totalPages = Math.ceil(totalFiles / limitNum);

        // Calculate total storage used by these files
        const totalSizeResult = await File.aggregate([
            { $match: searchQuery },
            { $group: { _id: null, totalSize: { $sum: '$fileSize' } } }
        ]);

        const totalSize = totalSizeResult[0]?.totalSize || 0;

        res.json({
            success: true,
            data: {
                files,
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalFiles,
                    totalSize,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1
                }
            }
        });
    } catch (error) {
        console.error('Get files error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// @desc    Get file by ID
// @route   GET /api/files/:fileId
// @access  Private
router.get('/:fileId', auth, async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.user.id;

        const file = await File.findOne({ fileId, userId });
        
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File tidak ditemukan'
            });
        }

        // Increment access count
        await file.incrementAccess();

        res.json({
            success: true,
            data: { file }
        });
    } catch (error) {
        console.error('Get file error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// @desc    Download file
// @route   GET /api/files/download/:fileId
// @access  Public (with optional auth for tracking)
router.get('/download/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const file = await File.findOne({ fileId });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File tidak ditemukan'
            });
        }

        // Check if file expired
        if (file.expiresAt && new Date() > file.expiresAt) {
            return res.status(410).json({
                success: false,
                message: 'File telah kedaluwarsa'
            });
        }

        const filePath = path.join(__dirname, '..', 'uploads', file.fileName);

        // Check if file exists physically
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: 'File fisik tidak ditemukan'
            });
        }

        // Increment download count
        await file.incrementDownload();

        // Set headers for download
        res.setHeader('Content-Disposition', `attachment; filename="${file.originalName}"`);
        res.setHeader('Content-Type', file.mimeType);
        res.setHeader('Content-Length', file.fileSize);

        // Stream file
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('error', (error) => {
            console.error('File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({
                    success: false,
                    message: 'Error streaming file'
                });
            }
        });

    } catch (error) {
        console.error('Download file error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                message: 'Terjadi kesalahan server'
            });
        }
    }
});

// @desc    Get file info (public)
// @route   GET /api/files/info/:fileId
// @access  Public
router.get('/info/:fileId', async (req, res) => {
    try {
        const { fileId } = req.params;
        const file = await File.findOne({ fileId });

        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File tidak ditemukan'
            });
        }

        // Check if file expired
        if (file.expiresAt && new Date() > file.expiresAt) {
            return res.status(410).json({
                success: false,
                message: 'File telah kedaluwarsa'
            });
        }

        // Return basic file info (without sensitive data)
        res.json({
            success: true,
            data: {
                file: {
                    originalName: file.originalName,
                    fileSize: file.fileSize,
                    sizeInMB: file.sizeInMB,
                    fileType: file.fileType,
                    downloadCount: file.downloadCount,
                    createdAt: file.createdAt,
                    expiresAt: file.expiresAt
                }
            }
        });
    } catch (error) {
        console.error('Get file info error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// @desc    Delete file
// @route   DELETE /api/files/:fileId
// @access  Private
router.delete('/:fileId', auth, async (req, res) => {
    try {
        const { fileId } = req.params;
        const userId = req.user.id;

        const file = await File.findOne({ fileId, userId });
        
        if (!file) {
            return res.status(404).json({
                success: false,
                message: 'File tidak ditemukan'
            });
        }

        // Delete physical file
        const filePath = path.join(__dirname, '..', 'uploads', file.fileName);
        try {
            await fs.unlink(filePath);
        } catch (error) {
            console.error('Error deleting physical file:', error);
            // Continue with database deletion even if physical file is missing
        }

        // Update user storage
        const user = await User.findById(userId);
        if (user) {
            user.storageUsed = Math.max(0, user.storageUsed - file.fileSize);
            await user.save();
        }

        // Delete file record
        await File.findByIdAndDelete(file._id);

        res.json({
            success: true,
            message: 'File berhasil dihapus'
        });
    } catch (error) {
        console.error('Delete file error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// @desc    Get user storage statistics
// @route   GET /api/files/stats/storage
// @access  Private
router.get('/stats/storage', auth, async (req, res) => {
    try {
        const userId = req.user.id;

        const stats = await File.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: null,
                    totalFiles: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' },
                    averageSize: { $avg: '$fileSize' }
                }
            }
        ]);

        const fileTypes = await File.aggregate([
            { $match: { userId } },
            {
                $group: {
                    _id: '$fileType',
                    count: { $sum: 1 },
                    totalSize: { $sum: '$fileSize' }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const recentUploads = await File.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('originalName fileSize createdAt');

        res.json({
            success: true,
            data: {
                overview: stats[0] || { totalFiles: 0, totalSize: 0, averageSize: 0 },
                fileTypes,
                recentUploads
            }
        });
    } catch (error) {
        console.error('Get storage stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// @desc    Bulk delete files
// @route   DELETE /api/files/bulk/delete
// @access  Private
router.delete('/bulk/delete', auth, async (req, res) => {
    try {
        const { fileIds } = req.body;
        const userId = req.user.id;

        if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Harap pilih file yang akan dihapus'
            });
        }

        // Get files to delete
        const files = await File.find({ 
            fileId: { $in: fileIds },
            userId 
        });

        if (files.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tidak ada file yang ditemukan untuk dihapus'
            });
        }

        let totalFreedSpace = 0;
        const deletionResults = [];

        for (const file of files) {
            try {
                // Delete physical file
                const filePath = path.join(__dirname, '..', 'uploads', file.fileName);
                await fs.unlink(filePath).catch(error => {
                    console.error(`Error deleting physical file ${file.fileName}:`, error);
                });

                // Add to total freed space
                totalFreedSpace += file.fileSize;

                // Delete database record
                await File.findByIdAndDelete(file._id);

                deletionResults.push({
                    fileId: file.fileId,
                    name: file.originalName,
                    status: 'deleted'
                });

            } catch (error) {
                deletionResults.push({
                    fileId: file.fileId,
                    name: file.originalName,
                    status: 'error',
                    error: error.message
                });
            }
        }

        // Update user storage
        const user = await User.findById(userId);
        if (user) {
            user.storageUsed = Math.max(0, user.storageUsed - totalFreedSpace);
            await user.save();
        }

        const successfulDeletions = deletionResults.filter(r => r.status === 'deleted').length;
        const failedDeletions = deletionResults.filter(r => r.status === 'error').length;

        res.json({
            success: true,
            message: `Berhasil menghapus ${successfulDeletions} file${failedDeletions > 0 ? `, ${failedDeletions} gagal` : ''}`,
            data: {
                deletedCount: successfulDeletions,
                failedCount: failedDeletions,
                freedSpace: totalFreedSpace,
                results: deletionResults
            }
        });
    } catch (error) {
        console.error('Bulk delete error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

export default router;