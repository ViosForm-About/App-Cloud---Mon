// Common utilities and functions used across all pages

const API_BASE = '/api';
const CLOUDMON_URL = 'https://cloudmon.com';

// API request helper with error handling
export async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const defaultOptions = {
        headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            ...options.headers
        }
    };

    const config = {
        ...defaultOptions,
        ...options
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
        config.body = JSON.stringify(config.body);
        config.headers = {
            'Content-Type': 'application/json',
            ...config.headers
        };
    }

    try {
        const response = await fetch(API_BASE + endpoint, config);
        
        if (!response.ok) {
            if (response.status === 401) {
                // Unauthorized - clear token and redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/login.html';
                throw new Error('Session expired. Please login again.');
            }
            
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        if (error.message === 'Failed to fetch') {
            throw new Error('Cannot connect to server. Please check your internet connection.');
        }
        throw error;
    }
}

// Auth check
export async function checkAuth() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (!token || !user) {
        return null;
    }

    try {
        // Verify token is still valid
        const response = await apiRequest('/auth/me');
        if (response.success) {
            // Update user data
            const updatedUser = { ...JSON.parse(user), ...response.data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            return updatedUser;
        }
    } catch (error) {
        console.warn('Auth check failed:', error.message);
        // Don't clear auth on network errors, only on 401
        if (error.message.includes('Session expired') || error.message.includes('401')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
        return JSON.parse(user);
    }

    return JSON.parse(user);
}

// Redirect to login
export function redirectToLogin() {
    window.location.href = '/login.html';
}

// Redirect to dashboard
export function redirectToDashboard() {
    window.location.href = '/';
}

// Handle logout
export function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    redirectToLogin();
}

// Toast notification system
export function showToast(message, type = 'info', duration = 5000) {
    const toastContainer = document.getElementById('toastContainer') || createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${message}</span>
        <button class="toast-close">&times;</button>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after duration
    const autoRemove = setTimeout(() => {
        toast.remove();
    }, duration);
    
    // Remove on click
    toast.querySelector('.toast-close').addEventListener('click', () => {
        clearTimeout(autoRemove);
        toast.remove();
    });
    
    return toast;
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Format file size
export function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get file icon
export function getFileIcon(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const iconMap = {
        'pdf': '📄',
        'doc': '📝',
        'docx': '📝',
        'txt': '📝',
        'jpg': '🖼️',
        'jpeg': '🖼️',
        'png': '🖼️',
        'gif': '🖼️',
        'svg': '🖼️',
        'webp': '🖼️',
        'mp4': '🎥',
        'avi': '🎥',
        'mov': '🎥',
        'mkv': '🎥',
        'mp3': '🎵',
        'wav': '🎵',
        'flac': '🎵',
        'zip': '📦',
        'rar': '📦',
        '7z': '📦',
        'tar': '📦'
    };
    
    return iconMap[extension] || '📁';
}

// Validate email
export function validateEmail(email) {
    const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return regex.test(email);
}

// Validate custom name
export function validateCustomName(name) {
    if (!name || name.length < 3 || name.length > 30) {
        return false;
    }
    const regex = /^[a-zA-Z0-9-]+$/;
    return regex.test(name);
}

// Copy to clipboard
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        return true;
    }
}

// Debounce function
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Format date
export function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Generate random ID
export function generateRandomId(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Check if user is premium
export function isUserPremium(user) {
    if (!user || !user.isPremium) return false;
    if (!user.premiumExpires) return true;
    return new Date(user.premiumExpires) > new Date();
}

// Calculate storage percentage
export function calculateStoragePercentage(storageUsed, maxStorage) {
    return Math.min(100, (storageUsed / maxStorage) * 100);
}

// Handle API errors
export function handleApiError(error) {
    console.error('API Error:', error);
    
    if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        return 'Network error. Please check your internet connection.';
    }
    
    if (error.message.includes('401')) {
        return 'Session expired. Please login again.';
    }
    
    if (error.message.includes('413')) {
        return 'File too large. Please check the file size limit.';
    }
    
    return error.message || 'An unexpected error occurred.';
}

// File validation
export function validateFile(file, maxSize) {
    if (!file) {
        return 'Please select a file.';
    }
    
    if (file.size > maxSize) {
        return `File size must be less than ${formatFileSize(maxSize)}.`;
    }
    
    return null;
}

// Password strength check
export function checkPasswordStrength(password) {
    if (password.length < 6) return 'weak';
    if (password.length < 8) return 'medium';
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strength = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
    
    if (strength >= 3) return 'strong';
    if (strength >= 2) return 'medium';
    return 'weak';
}

// Local storage helpers
export const storage = {
    get: (key, defaultValue = null) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch {
            return defaultValue;
        }
    },
    
    set: (key, value) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch {
            return false;
        }
    },
    
    remove: (key) => {
        try {
            localStorage.removeItem(key);
            return true;
        } catch {
            return false;
        }
    },
    
    clear: () => {
        try {
            localStorage.clear();
            return true;
        } catch {
            return false;
        }
    }
};

// Export constants
export { API_BASE, CLOUDMON_URL };