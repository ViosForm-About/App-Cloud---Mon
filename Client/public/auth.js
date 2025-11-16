import { 
    showToast, 
    apiRequest, 
    redirectToDashboard, 
    validateEmail, 
    checkPasswordStrength,
    handleApiError 
} from './common.js';

class Auth {
    constructor() {
        this.init();
    }

    init() {
        // Check if user is already logged in
        this.checkExistingAuth();
        
        // Bind events
        this.bindEvents();
        
        // Hide loading screen
        this.hideLoadingScreen();
    }

    async checkExistingAuth() {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');
        
        if (token && user) {
            try {
                // Verify token is still valid
                await apiRequest('/auth/me');
                redirectToDashboard();
            } catch (error) {
                // Token is invalid, clear storage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        }
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegister(e));
        }

        // Password confirmation validation
        const confirmPassword = document.getElementById('registerConfirmPassword');
        if (confirmPassword) {
            confirmPassword.addEventListener('input', () => this.validatePasswordMatch());
        }

        // Real-time password strength check
        const passwordInput = document.getElementById('registerPassword');
        if (passwordInput) {
            passwordInput.addEventListener('input', () => this.checkPasswordStrength());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoading = loginBtn.querySelector('.btn-loading');

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!this.validateLoginForm(email, password)) {
            return;
        }

        // Show loading
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        loginBtn.disabled = true;

        try {
            const response = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.success) {
                // Save token and user data
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                showToast('Login successful!', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    redirectToDashboard();
                }, 1000);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Login error:', error);
            const errorMessage = handleApiError(error);
            showToast(errorMessage, 'error');
        } finally {
            // Hide loading
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
            loginBtn.disabled = false;
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value;
        const confirmPassword = document.getElementById('registerConfirmPassword').value;
        const acceptTerms = document.getElementById('acceptTerms')?.checked || true; // Default to true if checkbox doesn't exist
        const registerBtn = document.getElementById('registerBtn');
        const btnText = registerBtn.querySelector('.btn-text');
        const btnLoading = registerBtn.querySelector('.btn-loading');

        // Clear previous errors
        this.clearErrors();

        // Validation
        if (!this.validateRegisterForm(name, email, password, confirmPassword, acceptTerms)) {
            return;
        }

        // Show loading
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        registerBtn.disabled = true;

        try {
            const response = await apiRequest('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.success) {
                // Save token and user data
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                
                showToast('Registration successful!', 'success');
                
                // Redirect to dashboard
                setTimeout(() => {
                    redirectToDashboard();
                }, 1000);
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            console.error('Register error:', error);
            const errorMessage = handleApiError(error);
            showToast(errorMessage, 'error');
        } finally {
            // Hide loading
            btnText.classList.remove('hidden');
            btnLoading.classList.add('hidden');
            registerBtn.disabled = false;
        }
    }

    validateLoginForm(email, password) {
        let isValid = true;

        if (!email) {
            this.showError('emailError', 'Email is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            this.showError('emailError', 'Please enter a valid email address');
            isValid = false;
        }

        if (!password) {
            this.showError('passwordError', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            this.showError('passwordError', 'Password must be at least 6 characters');
            isValid = false;
        }

        return isValid;
    }

    validateRegisterForm(name, email, password, confirmPassword, acceptTerms) {
        let isValid = true;

        // Name validation
        if (!name) {
            this.showError('nameError', 'Full name is required');
            isValid = false;
        } else if (name.length < 2) {
            this.showError('nameError', 'Name must be at least 2 characters');
            isValid = false;
        }

        // Email validation
        if (!email) {
            this.showError('emailError', 'Email is required');
            isValid = false;
        } else if (!validateEmail(email)) {
            this.showError('emailError', 'Please enter a valid email address');
            isValid = false;
        }

        // Password validation
        if (!password) {
            this.showError('passwordError', 'Password is required');
            isValid = false;
        } else if (password.length < 6) {
            this.showError('passwordError', 'Password must be at least 6 characters');
            isValid = false;
        }

        // Confirm password validation
        if (!confirmPassword) {
            this.showError('confirmPasswordError', 'Please confirm your password');
            isValid = false;
        } else if (password !== confirmPassword) {
            this.showError('confirmPasswordError', 'Passwords do not match');
            isValid = false;
        }

        // Terms validation
        if (!acceptTerms) {
            showToast('Please accept the terms and conditions', 'warning');
            isValid = false;
        }

        return isValid;
    }

    validatePasswordMatch() {
        const password = document.getElementById('registerPassword')?.value;
        const confirmPassword = document.getElementById('registerConfirmPassword')?.value;
        const errorElement = document.getElementById('confirmPasswordError');

        if (!errorElement) return;

        if (confirmPassword && password !== confirmPassword) {
            this.showError('confirmPasswordError', 'Passwords do not match');
        } else {
            this.hideError('confirmPasswordError');
        }
    }

    checkPasswordStrength() {
        const password = document.getElementById('registerPassword')?.value;
        const errorElement = document.getElementById('passwordError');

        if (!password || !errorElement) return;

        const strength = checkPasswordStrength(password);
        
        if (password.length > 0 && password.length < 6) {
            this.showError('passwordError', 'Password is too weak (min 6 characters)');
        } else {
            this.hideError('passwordError');
        }
    }

    showError(elementId, message) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = message;
            element.classList.add('show');
        }
    }

    hideError(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.classList.remove('show');
        }
    }

    clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.classList.remove('show');
        });
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Auth();
});