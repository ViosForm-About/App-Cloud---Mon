import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    initializeTransporter() {
        try {
            // Support multiple email services
            const emailConfig = {
                host: process.env.EMAIL_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.EMAIL_PORT) || 587,
                secure: process.env.EMAIL_SECURE === 'true',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
                tls: {
                    rejectUnauthorized: false
                }
            };

            // For Gmail, use OAuth2 if credentials provided
            if (process.env.EMAIL_SERVICE === 'gmail' && process.env.EMAIL_CLIENT_ID) {
                emailConfig.service = 'gmail';
                emailConfig.auth = {
                    type: 'OAuth2',
                    user: process.env.EMAIL_USER,
                    clientId: process.env.EMAIL_CLIENT_ID,
                    clientSecret: process.env.EMAIL_CLIENT_SECRET,
                    refreshToken: process.env.EMAIL_REFRESH_TOKEN,
                    accessToken: process.env.EMAIL_ACCESS_TOKEN,
                };
            }

            this.transporter = nodemailer.createTransporter(emailConfig);

            // Verify connection
            this.transporter.verify((error, success) => {
                if (error) {
                    console.error('❌ Email transporter verification failed:', error);
                } else {
                    console.log('✅ Email transporter is ready');
                }
            });

        } catch (error) {
            console.error('❌ Email service initialization failed:', error);
        }
    }

    /**
     * Send welcome email to new users
     */
    async sendWelcomeEmail(userEmail, userName) {
        if (!this.transporter) {
            console.warn('📧 Email service not configured');
            return false;
        }

        const mailOptions = {
            from: `"CloudMon Support" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: '🎉 Welcome to CloudMon - Your File Hosting Service',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #4361ee, #4895ef); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #4361ee; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Welcome to CloudMon! 🚀</h1>
                            <p>Your reliable file hosting service</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${userName},</h2>
                            <p>Thank you for joining CloudMon! We're excited to have you on board.</p>
                            
                            <h3>✨ What you can do now:</h3>
                            <div class="feature">
                                <strong>📁 Upload Files</strong> - Host any file type up to 10MB
                            </div>
                            <div class="feature">
                                <strong>🔗 Generate URLs</strong> - Get shareable links for your files
                            </div>
                            <div class="feature">
                                <strong>💾 1GB Storage</strong> - Free storage for all your files
                            </div>
                            <div class="feature">
                                <strong>📊 Dashboard</strong> - Manage all your files in one place
                            </div>

                            <h3>🚀 Get Started:</h3>
                            <p>1. Go to your <a href="${process.env.CLIENT_URL}" style="color: #4361ee;">Dashboard</a></p>
                            <p>2. Upload your first file</p>
                            <p>3. Share the generated URL with anyone</p>

                            <h3>💎 Want more features?</h3>
                            <p>Upgrade to <strong>CloudMon Premium</strong> to get:</p>
                            <ul>
                                <li>🔗 Custom URLs with your own names</li>
                                <li>💾 10GB storage space</li>
                                <li>⚡ Faster upload speeds</li>
                                <li>📅 Files active for 1 year</li>
                            </ul>

                            <p>Need help? Contact our support team anytime!</p>
                            
                            <div class="footer">
                                <p>Best regards,<br>The CloudMon Team</p>
                                <p><a href="${process.env.CLIENT_URL}/support.html" style="color: #4361ee;">Get Help</a> | <a href="${process.env.TELEGRAM_SUPPORT_URL}" style="color: #4361ee;">Telegram Support</a></p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Welcome to CloudMon!

Hello ${userName},

Thank you for joining CloudMon! We're excited to have you on board.

What you can do now:
📁 Upload Files - Host any file type up to 10MB
🔗 Generate URLs - Get shareable links for your files
💾 1GB Storage - Free storage for all your files
📊 Dashboard - Manage all your files in one place

Get Started:
1. Go to your Dashboard: ${process.env.CLIENT_URL}
2. Upload your first file
3. Share the generated URL with anyone

Want more features?
Upgrade to CloudMon Premium to get:
- Custom URLs with your own names
- 10GB storage space
- Faster upload speeds
- Files active for 1 year

Need help? Contact our support team anytime!

Best regards,
The CloudMon Team

Get Help: ${process.env.CLIENT_URL}/support.html
Telegram Support: ${process.env.TELEGRAM_SUPPORT_URL}
            `
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Welcome email sent to:', userEmail);
            return true;
        } catch (error) {
            console.error('❌ Failed to send welcome email:', error);
            return false;
        }
    }

    /**
     * Send premium upgrade confirmation
     */
    async sendPremiumConfirmation(userEmail, userName, planType) {
        if (!this.transporter) {
            console.warn('📧 Email service not configured');
            return false;
        }

        const planDetails = {
            monthly: { price: 'Rp 50.000', period: '1 month' },
            yearly: { price: 'Rp 500.000', period: '1 year' },
            lifetime: { price: 'Rp 1.000.000', period: 'lifetime' }
        };

        const plan = planDetails[planType] || planDetails.monthly;

        const mailOptions = {
            from: `"CloudMon Premium" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: '⭐ CloudMon Premium - Upgrade Request Received',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #f59e0b; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                        .highlight { background: #fff3cd; padding: 15px; border-radius: 5px; border: 1px solid #ffeaa7; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Premium Upgrade Request Received! ⭐</h1>
                            <p>Thank you for choosing CloudMon Premium</p>
                        </div>
                        <div class="content">
                            <h2>Hello ${userName},</h2>
                            <p>We've received your request to upgrade to <strong>CloudMon Premium ${planType}</strong> plan.</p>
                            
                            <div class="highlight">
                                <h3>📋 Order Details:</h3>
                                <p><strong>Plan:</strong> ${planType.charAt(0).toUpperCase() + planType.slice(1)}</p>
                                <p><strong>Price:</strong> ${plan.price}</p>
                                <p><strong>Period:</strong> ${plan.period}</p>
                            </div>

                            <h3>🚀 Next Steps:</h3>
                            <ol>
                                <li><strong>Contact our team</strong> on Telegram: <a href="${process.env.TELEGRAM_PREMIUM_URL}">${process.env.TELEGRAM_PREMIUM_URL}</a></li>
                                <li>Provide your <strong>User ID</strong> and <strong>plan details</strong></li>
                                <li>Complete the payment as instructed</li>
                                <li>We'll activate your premium features within 24 hours</li>
                            </ol>

                            <h3>✨ Premium Features You'll Get:</h3>
                            <div class="feature">
                                <strong>🔗 Custom URLs</strong> - Create URLs with your own names
                            </div>
                            <div class="feature">
                                <strong>💾 10GB Storage</strong> - 10x more storage space
                            </div>
                            <div class="feature">
                                <strong>⚡ 50MB Uploads</strong> - Upload larger files
                            </div>
                            <div class="feature">
                                <strong>📅 1 Year Validity</strong> - Files stay active longer
                            </div>
                            <div class="feature">
                                <strong>🎯 Priority Support</strong> - Faster response times
                            </div>

                            <p><strong>⏰ Important:</strong> Your premium request will be processed within 24 hours of payment confirmation.</p>

                            <div class="footer">
                                <p>Need immediate assistance?</p>
                                <p>
                                    <a href="${process.env.TELEGRAM_PREMIUM_URL}" style="color: #f59e0b;">Telegram Premium Support</a> | 
                                    <a href="mailto:${process.env.EMAIL_USER}" style="color: #f59e0b;">Email Support</a>
                                </p>
                                <p>Best regards,<br>The CloudMon Premium Team</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Premium Upgrade Request Received!

Hello ${userName},

We've received your request to upgrade to CloudMon Premium ${planType} plan.

Order Details:
Plan: ${planType}
Price: ${plan.price}
Period: ${plan.period}

Next Steps:
1. Contact our team on Telegram: ${process.env.TELEGRAM_PREMIUM_URL}
2. Provide your User ID and plan details
3. Complete the payment as instructed
4. We'll activate your premium features within 24 hours

Premium Features You'll Get:
🔗 Custom URLs - Create URLs with your own names
💾 10GB Storage - 10x more storage space
⚡ 50MB Uploads - Upload larger files
📅 1 Year Validity - Files stay active longer
🎯 Priority Support - Faster response times

Important: Your premium request will be processed within 24 hours of payment confirmation.

Need immediate assistance?
Telegram Premium Support: ${process.env.TELEGRAM_PREMIUM_URL}
Email Support: ${process.env.EMAIL_USER}

Best regards,
The CloudMon Premium Team
            `
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Premium confirmation email sent to:', userEmail);
            return true;
        } catch (error) {
            console.error('❌ Failed to send premium confirmation email:', error);
            return false;
        }
    }

    /**
     * Send premium activation notification
     */
    async sendPremiumActivation(userEmail, userName, planType, expiryDate) {
        if (!this.transporter) {
            console.warn('📧 Email service not configured');
            return false;
        }

        const mailOptions = {
            from: `"CloudMon Premium" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: '🎉 Your CloudMon Premium is Now Active!',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: linear-gradient(135deg, #10b981, #34d399); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
                        .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #10b981; }
                        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
                        .success-badge { background: #10b981; color: white; padding: 10px 20px; border-radius: 20px; display: inline-block; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>Premium Activated! 🎉</h1>
                            <p>Welcome to CloudMon Premium</p>
                        </div>
                        <div class="content">
                            <div style="text-align: center; margin-bottom: 20px;">
                                <span class="success-badge">⭐ PREMIUM ACTIVE</span>
                            </div>

                            <h2>Congratulations ${userName}! 🎊</h2>
                            <p>Your <strong>CloudMon Premium ${planType}</strong> subscription is now active and ready to use!</p>

                            <h3>📋 Subscription Details:</h3>
                            <div class="feature">
                                <strong>Plan:</strong> ${planType.charAt(0).toUpperCase() + planType.slice(1)}<br>
                                <strong>Activated:</strong> ${new Date().toLocaleDateString('id-ID')}<br>
                                ${expiryDate ? `<strong>Expires:</strong> ${new Date(expiryDate).toLocaleDateString('id-ID')}` : '<strong>Type:</strong> Lifetime Access'}
                            </div>

                            <h3>🚀 Start Using Premium Features:</h3>
                            <div class="feature">
                                <strong>🔗 Custom URLs</strong><br>
                                Create memorable URLs like: ${process.env.CLOUDMON_URL}/your-name/file-id
                            </div>
                            <div class="feature">
                                <strong>💾 10GB Storage</strong><br>
                                Plenty of space for all your files
                            </div>
                            <div class="feature">
                                <strong>⚡ 50MB Uploads</strong><br>
                                Upload larger files faster
                            </div>
                            <div class="feature">
                                <strong>📅 1 Year File Life</strong><br>
                                Your files stay active for 365 days
                            </div>

                            <h3>🎯 Getting Started with Premium:</h3>
                            <ol>
                                <li>Go to your <a href="${process.env.CLIENT_URL}" style="color: #10b981;">Dashboard</a></li>
                                <li>Try uploading a file with <strong>Custom URL</strong> feature</li>
                                <li>Enjoy faster uploads and more storage!</li>
                            </ol>

                            <div style="background: #d1fae5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <h4>💎 Premium Support</h4>
                                <p>As a premium member, you get priority support:</p>
                                <p>
                                    <strong>Telegram:</strong> <a href="${process.env.TELEGRAM_PREMIUM_URL}" style="color: #10b981;">${process.env.TELEGRAM_PREMIUM_URL}</a><br>
                                    <strong>Email:</strong> <a href="mailto:${process.env.EMAIL_USER}" style="color: #10b981;">${process.env.EMAIL_USER}</a>
                                </p>
                            </div>

                            <div class="footer">
                                <p>Thank you for choosing CloudMon Premium! 🚀</p>
                                <p>Best regards,<br>The CloudMon Team</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
Premium Activated!

Congratulations ${userName}!

Your CloudMon Premium ${planType} subscription is now active and ready to use!

Subscription Details:
Plan: ${planType}
Activated: ${new Date().toLocaleDateString('id-ID')}
${expiryDate ? `Expires: ${new Date(expiryDate).toLocaleDateString('id-ID')}` : 'Type: Lifetime Access'}

Start Using Premium Features:
🔗 Custom URLs - Create memorable URLs
💾 10GB Storage - Plenty of space for files
⚡ 50MB Uploads - Upload larger files faster
📅 1 Year File Life - Files stay active for 365 days

Getting Started with Premium:
1. Go to your Dashboard: ${process.env.CLIENT_URL}
2. Try uploading a file with Custom URL feature
3. Enjoy faster uploads and more storage!

Premium Support:
As a premium member, you get priority support:
Telegram: ${process.env.TELEGRAM_PREMIUM_URL}
Email: ${process.env.EMAIL_USER}

Thank you for choosing CloudMon Premium!

Best regards,
The CloudMon Team
            `
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Premium activation email sent to:', userEmail);
            return true;
        } catch (error) {
            console.error('❌ Failed to send premium activation email:', error);
            return false;
        }
    }

    /**
     * Send support request notification
     */
    async sendSupportNotification(userEmail, userName, message, subject) {
        if (!this.transporter) {
            console.warn('📧 Email service not configured');
            return false;
        }

        const mailOptions = {
            from: `"CloudMon Support" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to ourselves
            subject: `📧 Support Request: ${subject}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #4361ee; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; }
                        .user-info { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>📧 New Support Request</h2>
                        </div>
                        <div class="content">
                            <div class="user-info">
                                <strong>From:</strong> ${userName} (${userEmail})<br>
                                <strong>Subject:</strong> ${subject}<br>
                                <strong>Time:</strong> ${new Date().toLocaleString('id-ID')}
                            </div>
                            
                            <h3>Message:</h3>
                            <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #4361ee;">
                                ${message.replace(/\n/g, '<br>')}
                            </div>
                            
                            <p style="margin-top: 20px;">
                                <strong>Action Required:</strong> Please respond to this support request within 24 hours.
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
New Support Request

From: ${userName} (${userEmail})
Subject: ${subject}
Time: ${new Date().toLocaleString('id-ID')}

Message:
${message}

Action Required: Please respond to this support request within 24 hours.
            `
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Support notification email sent');
            return true;
        } catch (error) {
            console.error('❌ Failed to send support notification email:', error);
            return false;
        }
    }

    /**
     * Send file upload notification
     */
    async sendFileUploadNotification(userEmail, userName, fileName, fileUrl, fileSize) {
        if (!this.transporter) {
            console.warn('📧 Email service not configured');
            return false;
        }

        const mailOptions = {
            from: `"CloudMon" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `📁 File Uploaded: ${fileName}`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                        .header { background: #4895ef; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0; }
                        .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 10px 10px; }
                        .url-box { background: white; padding: 15px; border: 2px dashed #4895ef; border-radius: 5px; margin: 15px 0; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>📁 File Upload Successful</h2>
                        </div>
                        <div class="content">
                            <p>Hello <strong>${userName}</strong>,</p>
                            <p>Your file has been successfully uploaded to CloudMon!</p>
                            
                            <h3>File Details:</h3>
                            <div style="background: white; padding: 15px; border-radius: 5px;">
                                <strong>File Name:</strong> ${fileName}<br>
                                <strong>File Size:</strong> ${fileSize}<br>
                                <strong>Upload Time:</strong> ${new Date().toLocaleString('id-ID')}
                            </div>

                            <h3>🔗 Shareable URL:</h3>
                            <div class="url-box">
                                <a href="${fileUrl}" style="color: #4895ef; word-break: break-all;">${fileUrl}</a>
                            </div>

                            <p>You can share this URL with anyone to download your file.</p>

                            <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin-top: 20px;">
                                <h4>💡 Tip:</h4>
                                <p>Upgrade to <strong>CloudMon Premium</strong> to get custom URLs and more features!</p>
                                <p><a href="${process.env.CLIENT_URL}/settings.html" style="color: #4895ef;">Upgrade Now</a></p>
                            </div>

                            <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
                                <p>Best regards,<br>The CloudMon Team</p>
                            </div>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `
File Upload Successful

Hello ${userName},

Your file has been successfully uploaded to CloudMon!

File Details:
File Name: ${fileName}
File Size: ${fileSize}
Upload Time: ${new Date().toLocaleString('id-ID')}

Shareable URL:
${fileUrl}

You can share this URL with anyone to download your file.

Tip: Upgrade to CloudMon Premium to get custom URLs and more features!
Upgrade: ${process.env.CLIENT_URL}/settings.html

Best regards,
The CloudMon Team
            `
        };

        try {
            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ File upload notification sent to:', userEmail);
            return true;
        } catch (error) {
            console.error('❌ Failed to send file upload notification:', error);
            return false;
        }
    }
}

// Create singleton instance
const emailService = new EmailService();

export default emailService;