import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { validateEmail } from '../utils/helpers.js';

const router = express.Router();

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE
    });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Harap isi semua field'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password minimal 6 karakter'
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Format email tidak valid'
            });
        }

        // Check if user exists
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: 'Email sudah terdaftar'
            });
        }

        // Create user
        const user = await User.create({
            name: name.trim(),
            email: email.toLowerCase(),
            password
        });

        if (user) {
            // Update last login
            user.lastLogin = new Date();
            await user.save();

            res.status(201).json({
                success: true,
                message: 'Registrasi berhasil',
                data: {
                    token: generateToken(user._id),
                    user: {
                        id: user._id,
                        userId: user.userId,
                        name: user.name,
                        email: user.email,
                        avatar: user.avatar,
                        isPremium: user.isPremium,
                        storageUsed: user.storageUsed,
                        maxStorage: user.maxStorage,
                        lastLogin: user.lastLogin
                    }
                }
            });
        }
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Harap isi email dan password'
            });
        }

        // Check if user exists and password matches
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
        
        if (user && (await user.comparePassword(password))) {
            // Update last login
            user.lastLogin = new Date();
            await user.save();

            res.json({
                success: true,
                message: 'Login berhasil',
                data: {
                    token: generateToken(user._id),
                    user: {
                        id: user._id,
                        userId: user.userId,
                        name: user.name,
                        email: user.email,
                        avatar: user.avatar,
                        isPremium: user.isPremium,
                        storageUsed: user.storageUsed,
                        maxStorage: user.maxStorage,
                        lastLogin: user.lastLogin
                    }
                }
            });
        } else {
            res.status(401).json({
                success: false,
                message: 'Email atau password salah'
            });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id,
                    userId: user.userId,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    isPremium: user.isPremium,
                    premiumExpires: user.premiumExpires,
                    storageUsed: user.storageUsed,
                    maxStorage: user.maxStorage,
                    lastLogin: user.lastLogin,
                    createdAt: user.createdAt
                }
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Terjadi kesalahan server'
        });
    }
});

export default router;