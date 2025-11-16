🚀 CloudMon - File Hosting Service

<div align="center">

https://img.shields.io/badge/CloudMon-File%20Hosting-blue?style=for-the-badge&logo=google-cloud&logoColor=white
https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge
https://img.shields.io/badge/license-MIT-blue?style=for-the-badge

Modern File Hosting Service dengan URL Generator Standar & Custom

Features • Demo • Installation • Deployment • Support

</div>

📖 Tentang CloudMon

CloudMon adalah layanan hosting file modern yang memungkinkan Anda mengupload file apa pun (dokumen, gambar, video) dan mengubahnya menjadi URL yang dapat dibagikan. Dengan antarmuka yang intuitif dan fitur premium yang powerful, CloudMon adalah solusi sempurna untuk berbagi file dengan mudah.

🎯 Use Cases

· 🔗 Berbagi file dengan URL yang rapi
· 📁 Hosting file sementara untuk project collaboration
· 🎨 Portfolio digital dengan URL custom
· 💼 Bisnis kecil yang butuh sharing file profesional
· 🚀 Developer yang butuh temporary file hosting

✨ Features

🆓 Free Features

· ✅ Upload semua jenis file - Support 100+ format file
· ✅ URL Standar - Generate URL acak yang aman
· ✅ Penyimpanan 1GB - Space cukup untuk ratusan file
· ✅ Dashboard responsive - Optimal di semua device
· ✅ Manajemen file - Lihat, copy, dan hapus file
· ✅ Security - Autentikasi JWT & password hashing

💎 Premium Features

· ⭐ URL Custom - Buat URL dengan nama sendiri
· ⭐ Penyimpanan 10GB - 10x lebih banyak space
· ⭐ Upload hingga 50MB - File lebih besar, upload lebih cepat
· ⭐ Masa aktif 1 tahun - File tetap tersimpan lebih lama
· ⭐ Priority support - Bantuan 24/7 via Telegram

🛠 Tech Stack

Frontend

· HTML5 - Semantic markup
· CSS3 - Custom properties & modern layout
· Vanilla JavaScript - ES6+ modules & modern syntax
· Responsive Design - Mobile-first approach

Backend

· Node.js - Runtime environment
· Express.js - Web framework
· MongoDB Atlas - Cloud database
· Mongoose - ODM for MongoDB
· JWT - Authentication system
· Multer - File upload handling
· Bcryptjs - Password hashing

Services

· MongoDB Atlas - Database hosting
· Gmail SMTP - Email service (App Password)
· Vercel - Deployment platform
· Telegram - Support channel

🚀 Quick Start

Prerequisites

· Node.js 16+
· MongoDB Atlas account
· Gmail account (untuk email service)

Installation

1. Clone repository

```bash
git clone https://github.com/username/cloudmon-fullstack.git
cd cloudmon-fullstack
```

1. Install dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies  
cd ../client
npm install
```

1. Setup environment variables

```bash
# server/.env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cloudmon
JWT_SECRET=your_super_secret_jwt_key
CLIENT_URL=http://localhost:3000
CLOUDMON_URL=https://cloudmon.com
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

1. Run development server

```bash
# Run backend (port 5000)
cd server
npm run dev

# Run frontend (port 3000)  
cd ../client
npm run dev
```

1. Access application

```
Frontend: http://localhost:3000
Backend API: http://localhost:5000/api
```

📦 Deployment

Deploy ke Vercel (Recommended)

1. Fork repository ini ke GitHub account Anda
2. Import ke Vercel
   · Buka Vercel
   · Login dengan GitHub
   · Klik "Import Project"
   · Pilih repository CloudMon
3. Configure Environment Variables
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLIENT_URL=https://your-app.vercel.app
   CLOUDMON_URL=https://your-app.vercel.app
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   TELEGRAM_SUPPORT_URL=https://t.me/your_support
   TELEGRAM_PREMIUM_URL=https://t.me/your_premium
   ```
4. Deploy! - Vercel akan otomatis deploy aplikasi

Manual Deployment

```bash
# Build production
npm run build

# Deploy to your preferred platform
# (Vercel, Netlify, Heroku, etc.)
```

🔧 Configuration

MongoDB Setup

1. Buat account di MongoDB Atlas
2. Buat FREE cluster
3. Buat database user dengan read/write permissions
4. Whitelist IP 0.0.0.0/0
5. Dapatkan connection string

Gmail App Password

1. Aktifkan 2-Factor Authentication
2. Buat App Password
3. Pilih "Other" dan beri nama "CloudMon"
4. Copy 16-character password

Telegram Channels

1. Buat channel @cloudmon_support untuk support gratis
2. Buat channel @cloudmon_premium untuk user premium
3. Tambahkan URL ke environment variables

📁 Project Structure

```
cloudmon-fullstack/
├── client/                 # Frontend application
│   ├── public/
│   │   ├── index.html     # Dashboard
│   │   ├── login.html     # Login page
│   │   ├── register.html  # Registration page
│   │   ├── settings.html  # User settings
│   │   ├── support.html   # Support page
│   │   ├── style.css      # Main stylesheet
│   │   ├── *.js           # JavaScript modules
│   │   └── icons/         # Favicons & assets
│   └── package.json
├── server/                 # Backend API
│   ├── models/            # MongoDB models
│   │   ├── User.js
│   │   ├── File.js
│   │   └── PremiumRequest.js
│   ├── routes/            # API routes
│   │   ├── auth.js        # Authentication
│   │   ├── files.js       # File management
│   │   ├── users.js       # User management
│   │   └── premium.js     # Premium features
│   ├── middleware/        # Custom middleware
│   │   ├── auth.js        # JWT authentication
│   │   └── upload.js      # File upload handling
│   ├── utils/             # Utility functions
│   │   ├── emailService.js # Email service
│   │   ├── generateUrl.js # URL generation
│   │   └── helpers.js     # Helper functions
│   ├── config/
│   │   └── database.js    # MongoDB connection
│   ├── uploads/           # File storage
│   ├── server.js          # Main server file
│   └── package.json
├── .env.example           # Environment template
├── vercel.json           # Vercel configuration
└── README.md             # Documentation
```

🔌 API Endpoints

Authentication

· POST /api/auth/register - Register user baru
· POST /api/auth/login - Login user
· GET /api/auth/me - Get current user

Files

· POST /api/files/upload - Upload file
· GET /api/files - Get user files
· GET /api/files/:fileId - Get file by ID
· DELETE /api/files/:fileId - Delete file
· GET /api/files/download/:fileId - Download file

Users

· PUT /api/users/profile - Update user profile
· POST /api/users/avatar - Upload avatar
· GET /api/users/storage - Get storage info

Premium

· POST /api/premium/request - Request premium access
· GET /api/premium/status - Get premium status
· GET /api/premium/features - Get premium features

🎨 Customization

Branding

Edit CSS variables di client/public/style.css:

```css
:root {
  --primary: #4361ee;     /* Brand color */
  --secondary: #3f37c9;   /* Secondary color */
  --accent: #4895ef;      /* Accent color */
  /* ... */
}
```

Email Templates

Customize email templates di server/utils/emailService.js:

· Welcome emails
· File upload notifications
· Premium confirmations
· Support messages

File Limits

Edit upload limits di environment variables:

```env
UPLOAD_LIMIT=10485760     # 10MB untuk free
# Premium users get 50MB automatically
```

🤝 Contributing

Kontribusi sangat diterima! Berikut cara berkontribusi:

1. Fork repository ini
2. Buat feature branch (git checkout -b feature/AmazingFeature)
3. Commit changes (git commit -m 'Add some AmazingFeature')
4. Push to branch (git push origin feature/AmazingFeature)
5. Buat Pull Request

Development Guidelines

· Gunakan consistent coding style
· Test semua perubahan secara menyeluruh
· Update documentation sesuai kebutuhan
· Follow security best practices

📄 License

Distributed under the MIT License. See LICENSE file untuk detail lengkap.

🆘 Support & Community

📞 Support Channels

· Telegram Support: @cloudmon_support
· Premium Support: @cloudmon_premium
· Email Support: support@cloudmon.com
· GitHub Issues: Create Issue

❓ Frequently Asked Questions

Q: Berapa besar file yang bisa diupload?
A: Free: 10MB, Premium: 50MB per file

Q: Berapa lama file tersimpan?
A: Free: 30 hari, Premium: 1 tahun

Q: Bagaimana cara upgrade ke premium?
A: Hubungi @cloudmon_premium di Telegram dengan User ID Anda

Q: Apakah data saya aman?
A: Ya! Password di-hash, file disimpan secure, dan menggunakan JWT authentication

🚀 Premium Service

Upgrade ke CloudMon Premium untuk mendapatkan:

· 🔗 URL Custom - Buat URL dengan nama brand Anda
· 💾 10GB Storage - Space untuk semua kebutuhan
· ⚡ Priority Support - Bantuan teknis 24/7
· 📊 Advanced Analytics - Track downloads & engagement

Harga: Rp 50.000/bulan
Contact: @cloudmon_premium

---

<div align="center">

💙 Dibuat dengan ❤️ untuk developer Indonesia

CloudMon - Modern File Hosting Solution

Website • Documentation • Report Bug • Request Feature

</div>

📊 Project Status

https://img.shields.io/badge/status-active-success?style=flat-square
https://img.shields.io/badge/maintenance-active-green?style=flat-square
https://img.shields.io/github/issues/username/cloudmon-fullstack?style=flat-square
https://img.shields.io/github/issues-pr/username/cloudmon-fullstack?style=flat-square

Current Version: 1.0.0
Last Updated: December 2024
Next Update: Premium analytics dashboard
