import express from 'express';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import upload, { handleUploadError } from '../middleware/upload.js';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', auth, async (req, res) => {
    try {
        const { name } = req.body;
        const userId = req.user.id;

        // Validation
        if (!name || name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Nama minimal 2 karakter'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        user.name = name.trim();
        await user.save();

        res.json({
            success: true,
            message: 'Profil berhasil diperbarui',
            data: {
                user: {
                    id: user._id,
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    isPremium: user.isPremium,
                    storageUsed: user.storageUsed,
                    maxStorage: user.maxStorage
                }
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// @desc    Upload user avatar
// @route   POST /api/users/avatar
// @access  Private
router.post('/avatar', auth, upload.single('avatar'), handleUploadError, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Harap pilih file avatar'
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        // Delete old avatar if exists
        if (user.avatar) {
            try {
                await fs.unlink(path.join('uploads', path.basename(user.avatar)));
            } catch (error) {
                console.error('Error deleting old avatar:', error);
            }
        }

        // Update user avatar
        user.avatar = `/uploads/${req.file.filename}`;
        await user.save();

        res.json({
            success: true,
            message: 'Avatar berhasil diupload',
            data: {
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Upload avatar error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// @desc    Get user storage info
// @route   GET /api/users/storage
// @access  Private
router.get('/storage', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User tidak ditemukan'
            });
        }

        res.json({
            success: true,
            data: {
                storageUsed: user.storageUsed,
                maxStorage: user.maxStorage,
                remainingStorage: user.remainingStorage,
                storagePercentage: (user.storageUsed / user.maxStorage * 100).toFixed(1)
            }
        });
    } catch (error) {
        console.error('Get storage error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

export default router;