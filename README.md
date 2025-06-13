# 🎯 Persona Sales Demo - AI-Powered Hiring Platform

A comprehensive Next.js application featuring AI-powered candidate screening, interview simulation, and hiring analytics.

## 🌟 Features

- **🤖 AI Candidate Screening** - Automated resume analysis and candidate evaluation
- **🎤 AI Interview Simulation** - Interactive interview sessions with AI
- **📊 Analytics Dashboard** - Comprehensive hiring metrics and insights  
- **💼 Role-Based Access** - Dashboards for Recruiters, Hiring Managers, Interviewers, Candidates, and Admins
- **📁 Document Processing** - Intelligent resume parsing and job description analysis
- **🔄 Real-time Matching** - Smart job-candidate matching algorithms
- **🔒 Secure Authentication** - Firebase Authentication with role-based permissions
- **☁️ Cloud Storage** - Organized file management for resumes and documents

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd persona-sales-demo
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your Firebase configuration.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:7000](http://localhost:7000)** in your browser.

## 🔥 Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project or use existing: `replit-4f946`
3. Enable Authentication, Firestore, and Storage

### 2. Configure Authentication
- Enable Email/Password authentication
- Add your domain to authorized domains

### 3. Set up Firestore Database
- Create database in production mode
- Configure security rules (see DEPLOYMENT.md)

### 4. Configure Cloud Storage
- Enable storage bucket
- Set up security rules for file uploads

## 🏗️ Tech Stack

- **Frontend:** Next.js 15, TypeScript, Tailwind CSS
- **Backend:** Firebase (Auth, Firestore, Storage, Functions)
- **AI/ML:** Google AI Platform, Vertex AI, Document AI
- **Framework:** Google Genkit for AI workflows
- **UI Components:** Radix UI, Lucide React
- **Forms:** React Hook Form, Zod validation
- **Charts:** Recharts
- **Deployment:** Vercel/Firebase App Hosting

## 🚀 Production Deployment

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Quick Deploy to Vercel:
1. Push code to GitHub
2. Connect repository to Vercel  
3. Add environment variables
4. Deploy!

**Live Demo:** [Firebase Hosting](https://replit-4f946.web.app)

## 🧪 Testing

### Firebase Authentication Test
Visit `/test-auth.html` on your deployed application.

### Local Development
```bash
npm run dev
```

## 📊 Environment Variables

See `.env.example` for required configuration.

## 🔒 Security & Performance

- Firebase security rules configured
- Role-based access control
- Next.js optimizations enabled
- Secure file upload validation

---

**🎯 Persona Sales Demo** - Ready for production deployment!
