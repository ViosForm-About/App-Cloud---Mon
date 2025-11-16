import { 
    showToast, 
    checkAuth, 
    redirectToLogin, 
    handleLogout, 
    apiRequest, 
    copyToClipboard,
    formatDate
} from './common.js';

class Support {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuthentication();
        
        // Bind events
        this.bindEvents();
        
        // Update status time
        this.updateStatusTime();
        
        // Update status every minute
        setInterval(() => this.updateStatusTime(), 60000);
        
        // Hide loading screen
        this.hideLoadingScreen();
    }

    async checkAuthentication() {
        this.currentUser = await checkAuth();
        if (!this.currentUser) {
            redirectToLogin();
            return;
        }
        this.updateUI();
    }

    updateUI() {
        // Update user info in header
        document.getElementById('userName').textContent = this.currentUser.name;
        const userAvatar = document.getElementById('userAvatar');
        const avatarPlaceholder = userAvatar.querySelector('.avatar-placeholder');
        const avatarImage = userAvatar.querySelector('.avatar-image');

        if (this.currentUser.avatar) {
            avatarPlaceholder.classList.add('hidden');
            avatarImage.src = this.currentUser.avatar;
            avatarImage.classList.remove('hidden');
        } else {
            avatarPlaceholder.textContent = this.currentUser.name.charAt(0).toUpperCase();
        }
    }

    bindEvents() {
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => this.toggleSidebar());
        document.getElementById('mainMenuToggle').addEventListener('click', () => this.toggleSidebar());

        // Logout
        document.getElementById('logoutLink').addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
        document.getElementById('dropdownLogout').addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });

        // Quick actions
        document.getElementById('copyUserIdBtn').addEventListener('click', () => this.copyUserId());
        document.getElementById('testUploadBtn').addEventListener('click', () => this.testUpload());
        document.getElementById('clearCacheBtn').addEventListener('click', () => this.clearCache());

        // User dropdown
        this.setupUserDropdown();

        // FAQ accordion
        this.setupFAQAccordion();
    }

    setupUserDropdown() {
        const userInfo = document.getElementById('userInfo');
        const userDropdown = document.getElementById('userDropdown');

        userInfo.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            userDropdown.classList.remove('show');
        });
    }

    setupFAQAccordion() {
        const faqItems = document.querySelectorAll('.faq-item');
        
        faqItems.forEach(item => {
            const summary = item.querySelector('summary');
            summary.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Close other open items
                if (!item.open) {
                    faqItems.forEach(otherItem => {
                        if (otherItem !== item && otherItem.open) {
                            otherItem.open = false;
                        }
                    });
                }
                
                item.open = !item.open;
            });
        });
    }

    async copyUserId() {
        try {
            await copyToClipboard(this.currentUser.userId);
            showToast('User ID copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy User ID:', err);
            showToast('Failed to copy User ID', 'error');
        }
    }

    async testUpload() {
        // Create a small test file
        const content = 'This is a test file for CloudMon. Upload successful!';
        const blob = new Blob([content], { type: 'text/plain' });
        const file = new File([blob], 'test-file.txt', { 
            type: 'text/plain',
            lastModified: new Date()
        });

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'standard');

        try {
            const response = await apiRequest('/files/upload', {
                method: 'POST',
                body: formData
            });

            if (response.success) {
                showToast('Test upload successful! File has been uploaded.', 'success');
                
                // Show the URL
                const url = response.data.file.url;
                setTimeout(() => {
                    showToast(`Test file URL: ${url}`, 'info', 10000);
                }, 1000);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Test upload error:', error);
            showToast('Test upload failed: ' + error.message, 'error');
        }
    }

    clearCache() {
        try {
            // Clear localStorage except auth data
            const token = localStorage.getItem('token');
            const user = localStorage.getItem('user');
            
            localStorage.clear();
            
            // Restore auth data
            if (token) localStorage.setItem('token', token);
            if (user) localStorage.setItem('user', user);
            
            showToast('Cache cleared successfully!', 'success');
        } catch (error) {
            console.error('Clear cache error:', error);
            showToast('Failed to clear cache', 'error');
        }
    }

    updateStatusTime() {
        const now = new Date();
        document.getElementById('statusTime').textContent = formatDate(now);
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        sidebar.classList.toggle('active');
        mainContent.classList.toggle('sidebar-active');
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }
}

// Initialize support when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Support();
});