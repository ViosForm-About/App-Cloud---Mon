import express from 'express';
import PremiumRequest from '../models/PremiumRequest.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// @desc    Request premium access
// @route   POST /api/premium/request
// @access  Private
router.post('/request', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        const { planType = 'monthly', telegramUsername, notes } = req.body;

        // Check if user already has active premium
        const user = await User.findById(userId);
        if (user.isPremiumActive()) {
            return res.status(400).json({
                success: false,
                message: 'Anda sudah memiliki akses premium'
            });
        }

        // Check if user has pending request
        const existingRequest = await PremiumRequest.getUserActiveRequest(userId);
        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: 'Anda sudah memiliki request premium yang sedang diproses'
            });
        }

        // Create premium request
        const premiumRequest = await PremiumRequest.create({
            userId,
            userEmail: user.email,
            userName: user.name,
            planType,
            telegramUsername,
            notes
        });

        res.status(201).json({
            success: true,
            message: 'Request premium berhasil dikirim. Silakan hubungi admin di Telegram untuk proses selanjutnya.',
            data: {
                request: {
                    requestId: premiumRequest.requestId,
                    status: premiumRequest.status,
                    planType: premiumRequest.planType,
                    requestDate: premiumRequest.requestDate
                },
                telegramUrl: process.env.TELEGRAM_PREMIUM_URL
            }
        });
    } catch (error) {
        console.error('Premium request error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// @desc    Get premium status
// @route   GET /api/premium/status
// @access  Private
router.get('/status', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const user = await User.findById(userId);
        const activeRequest = await PremiumRequest.getUserActiveRequest(userId);

        res.json({
            success: true,
            data: {
                isPremium: user.isPremiumActive(),
                premiumExpires: user.premiumExpires,
                hasActiveRequest: !!activeRequest,
                activeRequest: activeRequest ? {
                    requestId: activeRequest.requestId,
                    status: activeRequest.status,
                    planType: activeRequest.planType,
                    requestDate: activeRequest.requestDate
                } : null
            }
        });
    } catch (error) {
        console.error('Get premium status error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// @desc    Get premium features
// @route   GET /api/premium/features
// @access  Public
router.get('/features', async (req, res) => {
    try {
        const features = {
            free: {
                storage: '1GB',
                maxFileSize: '10MB',
                customUrl: false,
                features: [
                    'URL Standar',
                    'Penyimpanan 1GB',
                    'File berlaku 30 hari',
                    'Support via Telegram'
                ]
            },
            premium: {
                storage: '10GB',
                maxFileSize: '50MB',
                customUrl: true,
                features: [
                    'URL Custom',
                    'Penyimpanan 10GB',
                    'File berlaku 1 tahun',
                    'Priority Support',
                    'Upload lebih cepat',
                    'Analytics download'
                ]
            }
        };

        res.json({
            success: true,
            data: { features }
        });
    } catch (error) {
        console.error('Get premium features error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

export default router;