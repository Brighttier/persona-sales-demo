# 🚀 Persona Sales Demo - Production Deployment Guide

## Quick Deploy Options

### Option 1: Vercel (Recommended for Next.js)

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for production deployment"
   git push origin main
   ```

2. **Deploy to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js settings
   - Add environment variables (see below)

3. **Environment Variables:**
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAq_fOXtlSMfIEw-C9EQf-_FsqtoCOg2Qk
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=replit-4f946.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=replit-4f946
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=replit-4f946.firebasestorage.app
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1091951299632
   NEXT_PUBLIC_FIREBASE_APP_ID=1:1091951299632:web:4680336f7f98a75c4f71f5
   GCP_PROJECT=replit-4f946
   ```

### Option 2: Netlify

1. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Node version: 18

2. **Add environment variables** (same as above)

### Option 3: Firebase App Hosting

1. **Initialize App Hosting:**
   ```bash
   firebase apphosting:backends:create
   ```

2. **Connect to GitHub and deploy**

## 🔥 Firebase Services Setup

### 1. Authentication
- Go to Firebase Console → Authentication
- Enable "Email/Password" provider
- Add authorized domains for your production URL

### 2. Firestore Database
- Go to Firebase Console → Firestore Database
- Click "Create database"
- Start in production mode
- Choose region closest to your users

### 3. Cloud Storage
- Go to Firebase Console → Storage
- Get started
- Set up security rules:
  ```javascript
  rules_version = '2';
  service firebase.storage {
    match /b/{bucket}/o {
      match /resumes/{userId}/{allPaths=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      match /job_descriptions/{allPaths=**} {
        allow read, write: if request.auth != null;
      }
      match /profile-images/{userId}/{allPaths=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
  ```

### 4. Firestore Security Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Job listings
    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null; // Add role-based rules as needed
    }
    
    // Applications
    match /applications/{applicationId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 🧪 Testing Production Deployment

1. **Authentication Test:** Visit `/test-auth.html` on your deployed site
2. **Dashboard Access:** Test login flow and dashboard navigation  
3. **File Uploads:** Test resume uploads and document processing
4. **AI Features:** Verify AI screening and interview features work

## 🌐 Custom Domain Setup

### Vercel:
1. Go to Project Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Firebase Hosting:
1. `firebase hosting:channel:deploy production`
2. Go to Firebase Console → Hosting
3. Add custom domain

## 📊 Monitoring & Analytics

- **Firebase Console:** Monitor usage, errors, and performance
- **Vercel Analytics:** Track page views and performance
- **Google Cloud Console:** Monitor API usage and costs

## 🔒 Security Checklist

- ✅ Firebase security rules configured
- ✅ Environment variables secured (not in code)
- ✅ HTTPS enabled
- ✅ Authentication required for sensitive pages
- ✅ File upload size limits enforced
- ✅ Rate limiting on API endpoints

## 🚨 Troubleshooting

### Common Issues:
1. **Build Errors:** Check Node.js version (use 18+)
2. **Firebase Connection:** Verify environment variables
3. **AI Features Not Working:** Ensure Google Cloud APIs enabled
4. **File Uploads Failing:** Check Firebase Storage rules

Your Persona Sales Demo is now ready for production! 🎉