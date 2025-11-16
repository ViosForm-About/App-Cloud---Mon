import { 
    showToast, 
    checkAuth, 
    redirectToLogin, 
    handleLogout, 
    apiRequest, 
    formatFileSize, 
    copyToClipboard,
    handleApiError,
    calculateStoragePercentage,
    formatDate
} from './common.js';

class Settings {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuthentication();
        
        // Bind events
        this.bindEvents();
        
        // Load user data
        await this.loadUserData();
        
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

        // Profile form
        document.getElementById('profileForm').addEventListener('submit', (e) => this.handleProfileUpdate(e));

        // Avatar upload
        document.getElementById('avatarInput').addEventListener('change', (e) => this.handleAvatarUpload(e));
        document.getElementById('removeAvatar').addEventListener('click', (e) => this.handleRemoveAvatar(e));

        // Premium upgrade
        document.getElementById('upgradePremiumBtn').addEventListener('click', () => this.showPremiumModal());

        // Account deletion
        document.getElementById('deleteAccountBtn').addEventListener('click', () => this.showDeleteModal());
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => this.handleDeleteAccount());
        document.getElementById('cancelDelete').addEventListener('click', () => this.hideDeleteModal());
        document.getElementById('closeDeleteModal').addEventListener('click', () => this.hideDeleteModal());
        document.getElementById('confirmDelete').addEventListener('input', (e) => this.toggleDeleteButton(e));

        // Premium modal
        document.getElementById('closePremiumModal').addEventListener('click', () => this.hidePremiumModal());
        document.getElementById('premiumModal').addEventListener('click', (e) => {
            if (e.target.id === 'premiumModal') this.hidePremiumModal();
        });

        // User dropdown
        this.setupUserDropdown();
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

    async loadUserData() {
        try {
            // Load user profile
            const userResponse = await apiRequest('/auth/me');
            if (userResponse.success) {
                this.currentUser = userResponse.data.user;
                this.populateProfileForm();
                this.updatePremiumStatus();
            }

            // Load storage info
            const storageResponse = await apiRequest('/users/storage');
            if (storageResponse.success) {
                this.updateStorageInfo(storageResponse.data);
            }

            // Load premium status
            const premiumResponse = await apiRequest('/premium/status');
            if (premiumResponse.success) {
                this.updatePremiumInfo(premiumResponse.data);
            }

            // Load total files count (you might need to implement this endpoint)
            await this.loadFilesCount();

        } catch (error) {
            console.error('Error loading user data:', error);
            showToast('Failed to load user data', 'error');
        }
    }

    async loadFilesCount() {
        try {
            const response = await apiRequest('/files?limit=1');
            if (response.success) {
                document.getElementById('totalFiles').textContent = response.data.pagination?.totalFiles || 0;
            }
        } catch (error) {
            console.error('Error loading files count:', error);
        }
    }

    populateProfileForm() {
        document.getElementById('profileName').value = this.currentUser.name;
        document.getElementById('profileEmail').value = this.currentUser.email;
        document.getElementById('profileId').value = this.currentUser.userId;

        // Update avatar preview
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
        const avatarImage = document.getElementById('avatarImage');
        
        if (this.currentUser.avatar) {
            avatarPlaceholder.classList.add('hidden');
            avatarImage.src = this.currentUser.avatar;
            avatarImage.classList.remove('hidden');
        } else {
            avatarPlaceholder.textContent = this.currentUser.name.charAt(0).toUpperCase();
            avatarImage.classList.add('hidden');
            avatarPlaceholder.classList.remove('hidden');
        }

        // Update join date and last login
        document.getElementById('joinDate').textContent = formatDate(this.currentUser.createdAt);
        document.getElementById('lastLogin').textContent = formatDate(this.currentUser.lastLogin);
    }

    updateStorageInfo(storageData) {
        const storageUsed = storageData.storageUsed;
        const maxStorage = storageData.maxStorage;
        const percentage = calculateStoragePercentage(storageUsed, maxStorage);
        
        document.getElementById('storageProgressFill').style.width = `${percentage}%`;
        document.getElementById('storageUsed').textContent = formatFileSize(storageUsed);
        document.getElementById('storageTotal').textContent = formatFileSize(maxStorage);
    }

    updatePremiumStatus() {
        const isPremium = this.currentUser.isPremium && 
                         (!this.currentUser.premiumExpires || 
                          new Date(this.currentUser.premiumExpires) > new Date());
        
        const accountStatus = document.getElementById('accountStatus');
        const premiumStatus = document.getElementById('premiumStatus');
        const premiumCard = document.getElementById('premiumCard');
        const premiumActions = premiumCard.querySelector('.premium-actions');

        if (isPremium) {
            accountStatus.textContent = 'Premium';
            accountStatus.className = 'status-badge premium';
            premiumStatus.textContent = 'ACTIVE';
            
            let expiresText = '';
            if (this.currentUser.premiumExpires) {
                expiresText = `Valid until: ${formatDate(this.currentUser.premiumExpires)}`;
            } else {
                expiresText = 'Lifetime access';
            }
            
            premiumActions.innerHTML = `
                <p class="success-text">✅ Premium Account Active</p>
                <small>${expiresText}</small>
            `;
        } else {
            accountStatus.textContent = 'Free';
            accountStatus.className = 'status-badge';
            premiumStatus.textContent = 'UPGRADE';
        }
    }

    updatePremiumInfo(premiumData) {
        document.getElementById('modalUserId').textContent = this.currentUser.userId;
        
        if (premiumData.hasActiveRequest) {
            const upgradeBtn = document.getElementById('upgradePremiumBtn');
            upgradeBtn.textContent = 'Premium Request Pending...';
            upgradeBtn.disabled = true;
        }
    }

    async handleProfileUpdate(e) {
        e.preventDefault();
        
        const name = document.getElementById('profileName').value.trim();
        const saveBtn = document.getElementById('saveProfileBtn');
        const btnText = saveBtn.querySelector('.btn-text');
        const btnLoading = saveBtn.querySelector('.btn-loading');

        if (!name) {
            showToast('Name is required', 'warning');
            return;
        }

        if (name.length < 2) {
            showToast('Name must be at least 2 characters', 'warning');
            return;
        }

        // Show loading
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        saveBtn.disabled = true;

        try {
            const response = await apiRequest('/users/profile', {
                method: 'PUT',
                body: JSON.stringify({ name }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.success) {
                // Update local user data
                this.currentUser = response.data.user;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                
                // Update UI
                this.updateUI();
                
                showToast('Profile updated successfully!', 'success');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Profile update error:', error);
            const errorMessage = handleApiError(error);
            showToast(errorMessage, 'error');
        } finally {
            // Hide loading
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
            saveBtn.disabled = false;
        }
    }

    async handleAvatarUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            showToast('Please select an image file', 'error');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showToast('File size must be less than 2MB', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const response = await apiRequest('/users/avatar', {
                method: 'POST',
                body: formData
            });

            if (response.success) {
                // Update local user data
                this.currentUser.avatar = response.data.avatar;
                localStorage.setItem('user', JSON.stringify(this.currentUser));
                
                // Update UI
                this.updateUI();
                this.populateProfileForm();
                
                showToast('Avatar updated successfully!', 'success');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            const errorMessage = handleApiError(error);
            showToast(errorMessage, 'error');
        }
    }

    async handleRemoveAvatar(e) {
        e.preventDefault();

        try {
            // Since we don't have a specific endpoint for removing avatar,
            // we'll update the UI and local storage directly
            this.currentUser.avatar = null;
            localStorage.setItem('user', JSON.stringify(this.currentUser));
            
            // Update UI
            this.updateUI();
            this.populateProfileForm();
            
            showToast('Avatar removed successfully!', 'success');
        } catch (error) {
            console.error('Remove avatar error:', error);
            showToast('Failed to remove avatar', 'error');
        }
    }

    showPremiumModal() {
        document.getElementById('premiumModal').classList.remove('hidden');
    }

    hidePremiumModal() {
        document.getElementById('premiumModal').classList.add('hidden');
    }

    showDeleteModal() {
        document.getElementById('deleteAccountModal').classList.remove('hidden');
    }

    hideDeleteModal() {
        document.getElementById('deleteAccountModal').classList.add('hidden');
        document.getElementById('confirmDelete').value = '';
        document.getElementById('confirmDeleteBtn').disabled = true;
    }

    toggleDeleteButton(e) {
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        confirmDeleteBtn.disabled = e.target.value !== 'HAPUS';
    }

    async handleDeleteAccount() {
        try {
            // Note: This endpoint doesn't exist yet in our backend
            // You would need to implement it
            const response = await apiRequest('/users/account', {
                method: 'DELETE'
            });

            if (response.success) {
                showToast('Account deleted successfully', 'success');
                handleLogout();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Delete account error:', error);
            const errorMessage = handleApiError(error);
            showToast(errorMessage, 'error');
        }
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

// Initialize settings when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Settings();
});