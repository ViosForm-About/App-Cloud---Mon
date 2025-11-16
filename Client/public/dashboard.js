import { 
    showToast, 
    checkAuth, 
    redirectToLogin, 
    handleLogout, 
    apiRequest, 
    formatFileSize, 
    getFileIcon, 
    copyToClipboard,
    validateFile,
    handleApiError,
    calculateStoragePercentage,
    API_BASE
} from './common.js';

class Dashboard {
    constructor() {
        this.currentUser = null;
        this.isPremium = false;
        this.currentPage = 1;
        this.files = [];
        this.isUploading = false;

        this.init();
    }

    async init() {
        // Check authentication
        await this.checkAuthentication();
        
        // Bind events
        this.bindEvents();
        
        // Load user storage
        await this.loadStorageInfo();
        
        // Load recent files
        await this.loadRecentFiles();
        
        // Hide loading screen
        this.hideLoadingScreen();
    }

    async checkAuthentication() {
        this.currentUser = await checkAuth();
        if (!this.currentUser) {
            redirectToLogin();
            return;
        }

        this.isPremium = this.currentUser.isPremium;
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

        // Update premium features
        this.updatePremiumUI();
    }

    updatePremiumUI() {
        const premiumNotice = document.getElementById('premiumNotice');
        const customUploadArea = document.getElementById('customUploadArea');
        const customNameInput = document.getElementById('customNameInput');
        const generateCustomBtn = document.getElementById('generateCustom');
        const customBadge = document.getElementById('customBadge');

        if (this.isPremium) {
            // User is premium
            premiumNotice.classList.add('hidden');
            customUploadArea.classList.remove('hidden');
            customNameInput.classList.remove('hidden');
            generateCustomBtn.innerHTML = '<span class="btn-text">Generate</span><span class="btn-loading hidden">⏳</span>';
            generateCustomBtn.classList.remove('premium');
            customBadge.textContent = 'ACTIVE';
            customBadge.style.background = 'var(--success)';
        } else {
            // User is not premium
            premiumNotice.classList.remove('hidden');
            customUploadArea.classList.add('hidden');
            customNameInput.classList.add('hidden');
            generateCustomBtn.innerHTML = '<span class="btn-text">Buy Premium</span><span class="btn-loading hidden">⏳</span>';
            generateCustomBtn.classList.add('premium');
            customBadge.textContent = 'PREMIUM';
            customBadge.style.background = 'var(--warning)';
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

        // File uploads
        this.setupFileUploads();

        // Premium upgrade
        document.getElementById('premiumUpgradeBtn').addEventListener('click', () => this.showPremiumModal());
        
        // Refresh files
        document.getElementById('refreshFiles').addEventListener('click', () => this.loadRecentFiles());

        // Premium modal
        document.getElementById('closePremiumModal').addEventListener('click', () => this.hidePremiumModal());
        document.getElementById('premiumModal').addEventListener('click', (e) => {
            if (e.target.id === 'premiumModal') this.hidePremiumModal();
        });

        // User dropdown
        this.setupUserDropdown();
    }

    setupFileUploads() {
        const standardFile = document.getElementById('standardFile');
        const customFile = document.getElementById('customFile');
        const generateStandard = document.getElementById('generateStandard');
        const generateCustom = document.getElementById('generateCustom');
        const standardUploadArea = document.getElementById('standardUploadArea');
        const customUploadArea = document.getElementById('customUploadArea');

        // Standard file upload
        standardFile.addEventListener('change', (e) => this.handleFileSelect(e, 'standard'));
        generateStandard.addEventListener('click', () => this.generateStandardUrl());
        this.setupDragAndDrop(standardUploadArea, 'standard');

        // Custom file upload
        customFile.addEventListener('change', (e) => this.handleFileSelect(e, 'custom'));
        generateCustom.addEventListener('click', () => this.generateCustomUrl());
        this.setupDragAndDrop(customUploadArea, 'custom');
    }

    setupDragAndDrop(uploadArea, type) {
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                const fileInput = document.getElementById(`${type}File`);
                fileInput.files = files;
                this.handleFileSelect({ target: fileInput }, type);
            }
        });
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

    handleFileSelect(event, type) {
        const file = event.target.files[0];
        if (!file) return;

        const fileInfo = document.getElementById(`${type}FileInfo`);
        const maxSize = type === 'standard' ? 10 * 1024 * 1024 : 50 * 1024 * 1024;

        const validationError = validateFile(file, maxSize);
        if (validationError) {
            showToast(validationError, 'error');
            event.target.value = '';
            fileInfo.textContent = '';
            return;
        }

        fileInfo.textContent = `${file.name} (${formatFileSize(file.size)})`;
        fileInfo.style.color = 'var(--success)';
    }

    async generateStandardUrl() {
        if (this.isUploading) return;

        const fileInput = document.getElementById('standardFile');
        const file = fileInput.files[0];
        
        if (!file) {
            showToast('Please select a file first!', 'warning');
            return;
        }

        await this.uploadFile(file, 'standard');
    }

    async generateCustomUrl() {
        if (this.isUploading) return;

        if (!this.isPremium) {
            this.showPremiumModal();
            return;
        }

        const fileInput = document.getElementById('customFile');
        const file = fileInput.files[0];
        const customName = document.getElementById('customName').value.trim();
        
        if (!file) {
            showToast('Please select a file first!', 'warning');
            return;
        }

        if (!customName) {
            showToast('Please enter a custom name!', 'warning');
            return;
        }

        // Validate custom name
        if (!/^[a-zA-Z0-9-]{3,30}$/.test(customName)) {
            showToast('Custom name can only contain letters, numbers, and dashes (3-30 characters).', 'error');
            return;
        }

        await this.uploadFile(file, 'custom', customName);
    }

    async uploadFile(file, type, customName = null) {
        if (this.isUploading) return;
        
        this.isUploading = true;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        if (customName) {
            formData.append('customName', customName);
        }

        const progressFill = document.getElementById(`${type}ProgressFill`);
        const progressText = document.getElementById(`${type}ProgressText`);
        const progressBar = document.getElementById(`${type}Progress`);
        const generateBtn = document.getElementById(`generate${type.charAt(0).toUpperCase() + type.slice(1)}`);
        const btnText = generateBtn.querySelector('.btn-text');
        const btnLoading = generateBtn.querySelector('.btn-loading');

        // Show progress
        progressBar.classList.remove('hidden');
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        generateBtn.disabled = true;

        try {
            // Simulate upload progress (in real app, you'd use XMLHttpRequest or fetch with progress)
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += Math.random() * 10;
                if (progress >= 90) {
                    clearInterval(progressInterval);
                }
                progressFill.style.width = `${progress}%`;
                progressText.textContent = `${Math.round(progress)}%`;
            }, 200);

            const response = await apiRequest('/files/upload', {
                method: 'POST',
                body: formData
            });

            clearInterval(progressInterval);
            progressFill.style.width = '100%';
            progressText.textContent = '100%';

            if (response.success) {
                const urlInput = document.getElementById(`${type}Url`);
                urlInput.value = response.data.file.url;
                
                // Copy to clipboard automatically
                await this.copyToClipboard(response.data.file.url);
                
                showToast('File uploaded successfully! URL copied to clipboard.', 'success');
                
                // Reset form
                this.resetUploadForm(type);
                
                // Reload storage and files
                await this.loadStorageInfo();
                await this.loadRecentFiles();
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Upload error:', error);
            const errorMessage = handleApiError(error);
            showToast(errorMessage, 'error');
        } finally {
            // Hide progress
            setTimeout(() => {
                progressBar.classList.add('hidden');
                btnText.classList.remove('hidden');
                btnLoading.classList.add('hidden');
                generateBtn.disabled = false;
                progressFill.style.width = '0%';
                progressText.textContent = '0%';
                this.isUploading = false;
            }, 1000);
        }
    }

    resetUploadForm(type) {
        document.getElementById(`${type}File`).value = '';
        document.getElementById(`${type}FileInfo`).textContent = '';
        document.getElementById(`${type}Url`).value = '';
        
        if (type === 'custom') {
            document.getElementById('customName').value = '';
        }
    }

    async loadStorageInfo() {
        try {
            const response = await apiRequest('/users/storage');
            
            if (response.success) {
                const storageUsed = response.data.storageUsed;
                const maxStorage = response.data.maxStorage;
                const percentage = calculateStoragePercentage(storageUsed, maxStorage);
                
                document.getElementById('storageProgressFill').style.width = `${percentage}%`;
                document.getElementById('storageText').textContent = 
                    `${formatFileSize(storageUsed)} of ${formatFileSize(maxStorage)} used (${percentage.toFixed(1)}%)`;
            }
        } catch (error) {
            console.error('Error loading storage info:', error);
        }
    }

    async loadRecentFiles(page = 1) {
        const filesList = document.getElementById('recentFilesList');
        const emptyFiles = document.getElementById('emptyFiles');
        const loadingFiles = document.getElementById('loadingFiles');
        const filesPagination = document.getElementById('filesPagination');

        // Show loading
        filesList.classList.add('hidden');
        emptyFiles.classList.add('hidden');
        loadingFiles.classList.remove('hidden');
        filesPagination.classList.add('hidden');

        try {
            const response = await apiRequest(`/files?page=${page}&limit=10`);
            
            if (response.success) {
                this.files = response.data.files;
                this.currentPage = page;
                
                // Render files
                this.renderFilesList();
                
                // Render pagination
                this.renderPagination(response.data.pagination);
                
                // Show appropriate state
                if (this.files.length === 0) {
                    emptyFiles.classList.remove('hidden');
                    filesList.classList.add('hidden');
                } else {
                    filesList.classList.remove('hidden');
                    emptyFiles.classList.add('hidden');
                }
                
                loadingFiles.classList.add('hidden');
            }
        } catch (error) {
            console.error('Error loading files:', error);
            showToast('Failed to load files', 'error');
            loadingFiles.classList.add('hidden');
            emptyFiles.classList.remove('hidden');
        }
    }

    renderFilesList() {
        const filesList = document.getElementById('recentFilesList');
        filesList.innerHTML = '';

        this.files.forEach(file => {
            const fileItem = this.createFileItem(file);
            filesList.appendChild(fileItem);
        });
    }

    createFileItem(file) {
        const div = document.createElement('div');
        div.className = 'file-item';
        
        const fileIcon = getFileIcon(file.originalName);
        const uploadDate = new Date(file.createdAt).toLocaleDateString();
        
        div.innerHTML = `
            <div class="file-icon">${fileIcon}</div>
            <div class="file-details">
                <div class="file-name" title="${file.originalName}">${file.originalName}</div>
                <div class="file-meta">
                    <span>${file.sizeInMB} MB</span>
                    <span>${uploadDate}</span>
                    <span>Accessed ${file.accessCount} times</span>
                </div>
            </div>
            <div class="file-url">
                <input type="text" value="${file.url}" class="file-url-input" readonly title="${file.url}">
                <button class="copy-btn" data-url="${file.url}" title="Copy URL">📋</button>
            </div>
        `;

        // Add copy functionality
        const copyBtn = div.querySelector('.copy-btn');
        copyBtn.addEventListener('click', async () => {
            await this.copyToClipboard(file.url);
            showToast('URL copied to clipboard!', 'success');
        });

        return div;
    }

    renderPagination(pagination) {
        const filesPagination = document.getElementById('filesPagination');
        
        if (!pagination || pagination.totalPages <= 1) {
            filesPagination.classList.add('hidden');
            return;
        }

        filesPagination.classList.remove('hidden');
        
        let html = '';
        
        // Previous button
        if (pagination.hasPrev) {
            html += `<button class="pagination-btn" data-page="${pagination.currentPage - 1}">← Previous</button>`;
        } else {
            html += `<button class="pagination-btn" disabled>← Previous</button>`;
        }
        
        // Page info
        html += `<span class="pagination-info">Page ${pagination.currentPage} of ${pagination.totalPages}</span>`;
        
        // Next button
        if (pagination.hasNext) {
            html += `<button class="pagination-btn" data-page="${pagination.currentPage + 1}">Next →</button>`;
        } else {
            html += `<button class="pagination-btn" disabled>Next →</button>`;
        }
        
        filesPagination.innerHTML = html;
        
        // Add event listeners
        filesPagination.querySelectorAll('.pagination-btn:not(:disabled)').forEach(btn => {
            btn.addEventListener('click', () => {
                const page = parseInt(btn.dataset.page);
                this.loadRecentFiles(page);
            });
        });
    }

    async copyToClipboard(text) {
        try {
            await copyToClipboard(text);
            return true;
        } catch (err) {
            console.error('Failed to copy to clipboard:', err);
            showToast('Failed to copy to clipboard', 'error');
            return false;
        }
    }

    showPremiumModal() {
        document.getElementById('premiumModal').classList.remove('hidden');
    }

    hidePremiumModal() {
        document.getElementById('premiumModal').classList.add('hidden');
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

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});