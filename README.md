# 🧠 BrainScript - AI-Powered Ed-Tech Platform

[![Node.js](https://img.shields.io/badge/Node.js-v16+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18+-blue.svg)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0+-green.svg)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**LearnStream** is a modern, AI-powered educational technology platform designed to transform how students learn from videos. It combines video learning with intelligent tools like transcription, summarization, quiz generation, and personal note-taking capabilities.

---

## 📋 Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Architecture Overview](#architecture-overview)
- [Data Flow & Workflows](#data-flow--workflows)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Features Guide](#features-guide)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## 🏗 How It Works

### 1. **Authentication System (Google OAuth 2.0)**

#### Flow Diagram:
```
User clicks "Sign In" 
    ↓
Frontend redirects to: GET /auth/google
    ↓
Backend initiates Google OAuth
    ↓
User grants permission on Google login page
    ↓
Google redirects to: /auth/google/callback
    ↓
Backend receives OAuth code and exchanges for user info
    ↓
Passport creates/updates User document in MongoDB
    ↓
Express session created with user ID
    ↓
User redirected to Frontend (authenticated)
    ↓
Frontend fetches user data via: GET /auth/login/success
    ↓
AuthContext updated with user info (stored in React state)
```

**What Happens:**
- When user logs in, their Google profile data (name, email, picture) is stored in MongoDB
- A secure session cookie is created that persists across page reloads
- Frontend always checks `/auth/login/success` on app load to restore user session
- All subsequent API calls include the session cookie for authentication

---

### 2. **Video Watching & Tracking System**

#### When User Watches a Video:
```
User navigates to video
    ↓
Frontend fetches playlist/video data from: GET /api/playlists/:playlistId
    ↓
YouTube iframe embedded with video ID
    ↓
Every 30 seconds, watch time is tracked
    POST /api/user/track { videoId, watchTime: 30 }
    ↓
Backend updates user.dailyActivity[today].watchTime
    ↓
Backend updates user.learningProgress (Continue Watching list)
    ↓
User's stats updated in MongoDB
```

**Data Stored:**
- Daily watch time per video
- Last watched timestamp
- Video added to "Continue Watching" section
- Streak counter increments if watched today/yesterday

---

### 3. **Notes System (Auto-Save)**

#### Taking & Saving Notes:
```
User clicks "Notes" tab
    ↓
Frontend sends: GET /api/user/notes/:videoId
    ↓
Backend searches user.notes array for matching videoId
    ↓
Note content displayed in textarea (or empty if new)
    ↓
User types in textarea
    ↓
Frontend detects changes (hasChanges = true)
    ↓
Every keystroke marked as unsaved
    ↓
After 30 seconds of inactivity → Auto-save triggered
    POST /api/user/notes { videoId, videoTitle, content }
    ↓
Backend finds existing note for this video OR creates new one
    ↓
Note saved to MongoDB with updatedAt timestamp
    ↓
Frontend shows "Saved successfully!" message
    ↓
User refreshes browser → Notes reloaded and displayed
```

**Database Storage:**
```javascript
user.notes = [
  {
    videoId: "dQw4w9WgXcQ",
    videoTitle: "Best Learning Video",
    content: "Important points...",
    createdAt: timestamp,
    updatedAt: timestamp
  }
]
```

---

### 4. **Transcript Generation System**

#### Getting Video Transcript:
```
User clicks "Transcribe" button
    ↓
Frontend sends: GET /api/videos/:videoId/transcript?lang=en
    ↓
Backend calls YouTube Transcript API
    ↓
API searches for available transcripts in requested language
    ↓
If found → Returns transcript lines
    ↓
If not found → Returns error message
    ↓
Backend formats transcript and sends to frontend
    ↓
Frontend displays in TranscriptBox component
    ↓
User can read full transcript or copy it
```

**Behind the Scenes:**
- Uses `youtube-transcript-api` Python library
- Backend runs Python script via `child_process`
- Results cached temporarily to avoid repeated API calls
- Available in multiple languages if transcript exists

---

### 5. **AI Summarization Pipeline**

#### Summary Generation Flow:
```
User has transcript & clicks "Summarize"
    ↓
Frontend sends: POST /api/ai/summarize
    Body: { transcript: "full transcript text..." }
    ↓
Backend receives transcript
    ↓
Backend calls Google Generative AI API (Gemini)
    Prompt: "Summarize this educational content..."
    ↓
AI processes and generates summary
    ↓
Summary returned to frontend
    ↓
Frontend displays in SummaryBox
    ↓
User can read summary or use it to generate quiz
```

**Key Points:**
- Requires valid `GOOGLE_AI_API_KEY` in backend `.env`
- AI model: Google Gemini
- Summary is generated on-demand (not stored)
- Takes 5-15 seconds depending on transcript length

---

### 6. **Quiz Generation & Grading**

#### Quiz Workflow:
```
User clicks "Quiz" after generating summary
    ↓
Frontend shows difficulty selector (Easy/Medium/Hard)
    ↓
User selects difficulty → Frontend sends: POST /api/ai/quiz
    Body: { summary: "summary text...", difficulty: "medium" }
    ↓
Backend calls Google Generative AI with difficulty context
    Prompt: "Generate 5 medium-difficulty multiple choice questions..."
    ↓
AI returns quiz JSON:
    [
      {
        question: "What is...",
        options: ["A", "B", "C", "D"],
        correctAnswer: 0
      }
    ]
    ↓
Frontend displays QuizBox with questions
    ↓
User answers questions
    ↓
User clicks "Submit Quiz"
    ↓
Frontend calculates score: (correct / total) * 100
    ↓
Frontend sends: POST /api/user/quiz-result
    Body: { videoId, score, totalQuestions, difficulty }
    ↓
Backend saves to user.quizHistory
    ↓
Backend updates user.stats.totalQuizzesSolved
    ↓
User sees instant feedback and score
```

**Smart Review System:**
```
Backend calculates: quizzes where (score / totalQuestions) < 0.6 (60%)
    ↓
These low-scoring quizzes shown in "Smart Review" section
    ↓
User can revisit topics they struggled with
    ↓
Tracks progress over time
```

---

### 7. **Profile Image Upload System**

#### Image Upload Flow:
```
User navigates to Profile page
    ↓
User clicks camera icon on profile picture
    ↓
File input opens → User selects image
    ↓
Frontend reads file and creates preview
    ↓
Frontend displays preview before upload
    ↓
User clicks "Upload Image"
    ↓
Frontend sends: POST /api/user/upload-profile-image
    With: FormData containing image file
    ↓
Backend (Multer middleware) processes upload:
    1. Validates file type (JPEG, PNG, GIF, WebP)
    2. Validates file size (max 5MB)
    3. Saves to: server/uploads/profiles/userId_timestamp.jpg
    4. Deletes old profile image if exists
    ↓
Backend updates user.profileImage = "uploads/profiles/..."
    ↓
Backend serves image via: GET /uploads/profiles/...
    ↓
Frontend receives new image path
    ↓
Frontend displays in header and profile
    ↓
Page reloads to update global user context
    ↓
All logged-in users see updated profile picture in header
```

**File Storage:**
- Images stored in local file system: `server/uploads/profiles/`
- Filenames: `{userId}_{timestamp}.{ext}`
- Max size: 5MB
- Formats: JPEG, PNG, GIF, WebP

---

### 8. **Dashboard & Analytics**

#### Dashboard Data Flow:
```
User navigates to Dashboard
    ↓
Frontend calls: GET /api/user/dashboard
    ↓
Backend retrieves user document from MongoDB
    ↓
Backend calculates:
    - Streak: Check consecutive days with activity
    - Total watch time: Sum all dailyActivity.watchTime
    - Quiz stats: Count quizHistory entries
    - Recent activity: Get last 7 days
    ↓
Backend returns:
    {
      stats: { totalWatchTime, totalQuizzesSolved },
      dailyActivity: [...],
      quizHistory: [...],
      streak: 5,
      user: { name, email, picture, ... }
    }
    ↓
Frontend displays:
    - Watch time chart
    - Quiz scores
    - Learning streak
    - Recent videos watched
    - Quick access buttons
```

---

## 🏛 Architecture Overview

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   AuthContext│  │  Components  │  │   Services & Hooks   │  │
│  │  (User State)│  │  & Pages     │  │   (API calls)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                         ↕ (HTTP/REST API)
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND (Node.js + Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Routes      │  │  Controllers │  │  Middleware          │  │
│  │  /auth       │  │  (Logic)     │  │  (Auth, Validation)  │  │
│  │  /api/user   │  │              │  │                      │  │
│  │  /api/ai     │  │              │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         ↕                 ↕                      ↕               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              Services & Utilities                         │   │
│  │  - YouTube Transcript API                               │   │
│  │  - Google Generative AI (Gemini)                       │   │
│  │  - Multer (File Upload)                                │   │
│  │  - Passport.js (Authentication)                        │   │
│  └──────────────────────────────────────────────────────────┘   │
│         ↕                                                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │            MongoDB (Data Persistence)                    │   │
│  │  Collections:                                            │   │
│  │  - users (with notes, quizHistory, dailyActivity)      │   │
│  │  - playlists                                            │   │
│  │  - sessions                                             │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                         ↕ (External APIs)
┌─────────────────────────────────────────────────────────────────┐
│              External Services                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Google     │  │ YouTube      │  │ Google Generative AI  │  │
│  │  OAuth      │  │ Transcript   │  │ (Summarize & Quiz)    │  │
│  │             │  │ API          │  │                       │  │
│  └─────────────┘  └──────────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow & Workflows

### Complete User Journey

```
1. USER REGISTRATION/LOGIN
   User → Frontend → Google OAuth → Backend → MongoDB
   Result: User document created, session established

2. HOME PAGE
   Frontend → /api/playlists → Backend → MongoDB
   Result: Playlists and videos displayed

3. WATCH VIDEO
   Frontend → YouTube iframe loaded
   Backend ← /api/user/track (every 30s)
   Result: Watch time recorded, progress updated

4. TAKE NOTES
   Frontend ← GET /api/user/notes/:videoId
   User types...
   Frontend → POST /api/user/notes (every 30s)
   Result: Notes saved to MongoDB

5. GET TRANSCRIPT
   Frontend → GET /api/videos/:videoId/transcript
   Backend → YouTube Transcript API
   Result: Transcript displayed in frontend

6. GENERATE SUMMARY
   Frontend → POST /api/ai/summarize
   Backend → Google Generative AI
   Result: AI summary displayed

7. CREATE QUIZ
   Frontend → POST /api/ai/quiz
   Backend → Google Generative AI
   Result: Quiz questions displayed

8. ANSWER QUIZ
   User answers questions...
   Frontend → POST /api/user/quiz-result
   Backend → Update user.quizHistory, stats
   Result: Score saved, feedback shown

9. VIEW DASHBOARD
   Frontend → GET /api/user/dashboard
   Backend → Calculates stats from dailyActivity
   Result: Analytics dashboard displayed

10. UPLOAD PROFILE IMAGE
    User selects image...
    Frontend → POST /api/user/upload-profile-image
    Backend → Save to disk, update MongoDB
    Result: Image displayed in header and profile
```

---

### Core Features
- 🎥 **Video Player**: Embedded YouTube video player with playlist support
- 📝 **Smart Notes**: Take and save notes while watching videos with auto-save functionality
- 📖 **Transcript Generation**: Automatic transcript extraction from YouTube videos
- ✨ **AI Summarization**: Generate intelligent summaries of video content
- 🧠 **Quiz Generation**: Create quizzes from video summaries with multiple difficulty levels
- 📊 **Progress Tracking**: Monitor watch time, quiz performance, and learning progress
- 👤 **User Profiles**: Customizable user profiles with profile image upload
- 📚 **Playlists**: Organize videos into learning playlists
- 🔐 **Authentication**: Secure Google OAuth 2.0 authentication
- 📱 **Responsive Design**: Mobile-friendly interface with Tailwind CSS

### Advanced Features
- 🎯 **Smart Review**: AI-powered review system highlighting low-performance quizzes
- ⏱️ **Activity Tracking**: Track daily learning activity and maintain learning streaks
- 📈 **Analytics Dashboard**: Comprehensive dashboard showing stats and progress
- 🔄 **Auto-Save Notes**: Notes automatically save every 30 seconds
- 🎨 **Modern UI**: Beautiful gradient designs and smooth animations with Framer Motion

---

## 🛠 Tech Stack

### Frontend
- **React 18+** - UI library
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Lucide React** - Icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB ODM
- **Passport.js** - Authentication middleware
- **Multer** - File upload handling
- **Google Generative AI** - AI summarization and quiz generation
- **YouTube Transcript API** - Video transcript extraction

### DevTools & Libraries
- **ESLint** - Code linting
- **Nodemon** - Development auto-reload
- **CORS** - Cross-origin resource sharing
- **dotenv** - Environment variable management

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **npm** (v8 or higher) - Comes with Node.js
- **MongoDB** (Local or Cloud) - [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/)
- **Google OAuth Credentials** - [Google Cloud Console](https://console.cloud.google.com/)
- **Google Generative AI API Key** - [Google AI Studio](https://makersuite.google.com/app/apikey)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/LearnStream.git
cd LearnStream-main
```

### 2. Install Backend Dependencies

```bash
cd server
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 4. Create Environment Files

#### Backend `.env` file (`server/.env`)

```env
# Server Configuration
PORT=8000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/learnstream

# Session Secret
SESSION_SECRET=your-super-secret-session-key-change-this

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Frontend URL
CLIENT_URL=http://localhost:5173

# Google AI API
GOOGLE_AI_API_KEY=your-google-generative-ai-api-key
```

#### Frontend `.env` file (`frontend/.env`)

```env
VITE_API_URL=http://localhost:8000
```

---

## ⚙️ Configuration

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials (Web application)
5. Set authorized redirect URIs:
   - `http://localhost:8000/auth/google/callback` (Development)
   - `https://yourdomain.com/auth/google/callback` (Production)
6. Copy Client ID and Client Secret to `.env`

### Google Generative AI Setup

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to the backend `.env` file

### MongoDB Setup

**Option 1: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string and add to `.env`

**Option 2: Local MongoDB**
```bash
# Install MongoDB Community Edition
# Then run:
mongod
```

---

## 🎯 Running the Application

### Development Mode

#### Terminal 1: Start Backend Server
```bash
cd server
npm start
# or with auto-reload:
npm run dev
```

Backend runs on: `http://localhost:8000`

#### Terminal 2: Start Frontend Development Server
```bash
cd frontend
npm run dev
```

Frontend runs on: `http://localhost:5173`

### Production Build

#### Backend
```bash
cd server
npm run build
npm start
```

#### Frontend
```bash
cd frontend
npm run build
```

---

## 📁 Project Structure

```
LearnStream-main/
│
├── server/                          # Backend application
│   ├── src/
│   │   ├── models/
│   │   │   ├── User.js             # User schema (notes, progress, profile)
│   │   │   └── Playlist.js         # Playlist schema
│   │   ├── routes/
│   │   │   ├── auth.js             # Authentication endpoints
│   │   │   ├── userRoutes.js       # User profile & notes endpoints
│   │   │   ├── playlist.js         # Playlist endpoints
│   │   │   ├── feed.js             # Feed endpoints
│   │   │   ├── aiRoutes.js         # AI (summarize, quiz) endpoints
│   │   │   └── playerControl/
│   │   │       └── transcript.js   # Transcript endpoints
│   │   ├── config/
│   │   │   └── passport.js         # Passport OAuth configuration
│   │   ├── utils/
│   │   │   ├── connectDB.js        # MongoDB connection
│   │   │   ├── uploadConfig.js     # Multer file upload config
│   │   │   ├── youtubeService.js   # YouTube API utilities
│   │   │   └── runPython.js        # Python script runner
│   │   └── middleware/
│   │       └── authMiddleware.js   # Authentication checks
│   ├── server.js                   # Main server file
│   ├── package.json
│   └── .env                        # Environment variables
│
├── frontend/                        # Frontend application
│   ├── src/
│   │   ├── components/
│   │   │   ├── header/
│   │   │   │   ├── Header.jsx      # Main header with navigation
│   │   │   │   └── UserDropdown.jsx # User profile menu
│   │   │   ├── navbar/
│   │   │   │   └── Navbar.jsx      # Navigation bar
│   │   │   ├── footer/
│   │   │   │   └── Footer.jsx      # Footer component
│   │   │   ├── ScrollToTop.jsx     # Scroll behavior
│   │   │   └── SkeletonLoader.jsx  # Loading skeleton
│   │   ├── pages/
│   │   │   ├── Home/               # Landing page
│   │   │   ├── Profile/            # User profile & settings
│   │   │   ├── Dashboard/          # Learning dashboard
│   │   │   ├── VideoPlayer/
│   │   │   │   ├── Player.jsx      # Main video player
│   │   │   │   └── components/
│   │   │   │       ├── VideoFrame.jsx
│   │   │   │       ├── VideoControls.jsx
│   │   │   │       ├── NotesBox.jsx        # Notes component
│   │   │   │       ├── TranscriptBox.jsx
│   │   │   │       ├── SummaryBox.jsx
│   │   │   │       └── QuizBox.jsx
│   │   │   ├── Playlist/           # Playlist management
│   │   │   ├── Feed/               # Content feed
│   │   │   ├── MyLearning/         # Learning progress
│   │   │   ├── About/              # About page
│   │   │   └── Contact/            # Contact page
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state
│   │   ├── hooks/
│   │   │   └── useAuth.js          # Custom auth hook
│   │   ├── services/
│   │   │   └── transcriptService.js
│   │   ├── config/
│   │   │   └── passport.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── public/
│   │   ├── robots.txt
│   │   ├── sitemap.xml
│   │   └── _redirects
│   ├── assets/                     # Images and static files
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── package.json
│   └── .env
│
├── docker-compose.yml              # Docker configuration
├── DEPLOY.md                       # Deployment guide
├── LICENSE
└── README.md                       # This file
```

---

## 🔌 API Endpoints

### Authentication Routes (`/auth`)

```
GET    /auth/google                 # Initiate Google login
GET    /auth/google/callback        # Google OAuth callback
GET    /auth/login/success          # Check login status & get user
GET    /auth/login/failed           # Login failure endpoint
GET    /auth/logout                 # Logout & clear session
```

### User Routes (`/api/user`)

```
# Profile Management
GET    /api/user/dashboard          # Get user dashboard data
PUT    /api/user/profile            # Update user profile
POST   /api/user/upload-profile-image # Upload profile picture
GET    /api/user/profile-image/:userId # Get profile image

# Notes Management
POST   /api/user/notes              # Save/update notes for video
GET    /api/user/notes/:videoId     # Get notes for video
DELETE /api/user/notes/:videoId     # Delete notes for video

# Activity Tracking
POST   /api/user/track              # Track watch time & activity
POST   /api/user/quiz-result        # Save quiz results
GET    /api/user/learning-history   # Get learning progress
```

### Playlist Routes (`/api/playlists`)

```
GET    /api/playlists/:playlistId   # Get playlist details
POST   /api/playlists               # Create new playlist
PUT    /api/playlists/:playlistId   # Update playlist
DELETE /api/playlists/:playlistId   # Delete playlist
```

### AI Routes (`/api/ai`)

```
POST   /api/ai/summarize            # Generate summary from transcript
POST   /api/ai/quiz                 # Generate quiz from summary
```

### Video Routes (`/api/videos`)

```
GET    /api/videos/:videoId/transcript # Get video transcript
```

---

## � API Request/Response Examples

### Authentication Examples

#### 1. Check Login Status
**Request:**
```http
GET http://localhost:8000/auth/login/success
Cookie: connect.sid=xxx
```

**Response (Success):**
```json
{
  "status": true,
  "message": "User authenticated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "googleId": "123456789",
    "name": "John Doe",
    "email": "john@example.com",
    "picture": "https://lh3.googleusercontent.com/...",
    "profileImage": "uploads/profiles/507f1f77bcf86cd799439011_1234567890.jpg",
    "accountType": "Student",
    "stats": {
      "totalWatchTime": 3600,
      "totalQuizzesSolved": 15
    },
    "createdAt": "2024-01-15T10:30:00Z",
    "lastLogin": "2024-01-25T14:20:00Z"
  }
}
```

**Response (Not Authenticated):**
```json
{
  "status": false,
  "message": "User not authenticated"
}
```

#### 2. Logout
**Request:**
```http
GET http://localhost:8000/auth/logout
Cookie: connect.sid=xxx
```

**Response:**
```json
{
  "status": true,
  "message": "Logged out successfully"
}
```

---

### User Profile Examples

#### 1. Get Dashboard Data
**Request:**
```http
GET http://localhost:8000/api/user/dashboard
Cookie: connect.sid=xxx
```

**Response:**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "profileImage": "uploads/profiles/507f1f77bcf86cd799439011_1234567890.jpg"
  },
  "stats": {
    "totalWatchTime": 3600,
    "totalQuizzesSolved": 15,
    "streak": 5
  },
  "dailyActivity": [
    {
      "date": "2024-01-25",
      "watchTime": 1800,
      "videosWatched": ["dQw4w9WgXcQ", "jNQXAC9IVRw"],
      "loginCount": 1
    }
  ],
  "recentVideos": [
    {
      "videoId": "dQw4w9WgXcQ",
      "title": "Machine Learning Basics",
      "lastWatched": "2024-01-25T14:20:00Z",
      "playlistId": "605f7b1234567890abcdef01"
    }
  ]
}
```

#### 2. Upload Profile Image
**Request:**
```http
POST http://localhost:8000/api/user/upload-profile-image
Cookie: connect.sid=xxx
Content-Type: multipart/form-data

[Image file: profile.jpg]
```

**Response:**
```json
{
  "status": true,
  "message": "Profile image uploaded successfully",
  "imagePath": "uploads/profiles/507f1f77bcf86cd799439011_1234567890.jpg",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "profileImage": "uploads/profiles/507f1f77bcf86cd799439011_1234567890.jpg"
  }
}
```

#### 3. Update User Profile
**Request:**
```http
PUT http://localhost:8000/api/user/profile
Cookie: connect.sid=xxx
Content-Type: application/json

{
  "name": "John Doe Updated",
  "accountType": "Teacher"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe Updated",
    "email": "john@example.com",
    "accountType": "Teacher",
    "updatedAt": "2024-01-25T14:30:00Z"
  }
}
```

---

### Notes Management Examples

#### 1. Save/Update Notes
**Request:**
```http
POST http://localhost:8000/api/user/notes
Cookie: connect.sid=xxx
Content-Type: application/json

{
  "videoId": "dQw4w9WgXcQ",
  "videoTitle": "Machine Learning Basics",
  "content": "Key points:\n- Introduction to ML\n- Supervised vs Unsupervised\n- Training and Testing sets"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Note saved successfully",
  "note": {
    "videoId": "dQw4w9WgXcQ",
    "videoTitle": "Machine Learning Basics",
    "content": "Key points:\n- Introduction to ML\n- Supervised vs Unsupervised\n- Training and Testing sets",
    "createdAt": "2024-01-25T10:00:00Z",
    "updatedAt": "2024-01-25T14:35:00Z"
  }
}
```

#### 2. Get Notes for Video
**Request:**
```http
GET http://localhost:8000/api/user/notes/dQw4w9WgXcQ
Cookie: connect.sid=xxx
```

**Response:**
```json
{
  "status": true,
  "note": {
    "videoId": "dQw4w9WgXcQ",
    "videoTitle": "Machine Learning Basics",
    "content": "Key points:\n- Introduction to ML\n- Supervised vs Unsupervised\n- Training and Testing sets",
    "createdAt": "2024-01-25T10:00:00Z",
    "updatedAt": "2024-01-25T14:35:00Z"
  }
}
```

#### 3. Delete Notes
**Request:**
```http
DELETE http://localhost:8000/api/user/notes/dQw4w9WgXcQ
Cookie: connect.sid=xxx
```

**Response:**
```json
{
  "status": true,
  "message": "Note deleted successfully"
}
```

---

### Activity Tracking Examples

#### 1. Track Watch Time
**Request:**
```http
POST http://localhost:8000/api/user/track
Cookie: connect.sid=xxx
Content-Type: application/json

{
  "videoId": "dQw4w9WgXcQ",
  "watchTime": 30
}
```

**Response:**
```json
{
  "status": true,
  "message": "Watch time tracked",
  "updatedActivity": {
    "date": "2024-01-25",
    "watchTime": 1800,
    "videosWatched": ["dQw4w9WgXcQ"]
  }
}
```

#### 2. Save Quiz Result
**Request:**
```http
POST http://localhost:8000/api/user/quiz-result
Cookie: connect.sid=xxx
Content-Type: application/json

{
  "videoId": "dQw4w9WgXcQ",
  "videoTitle": "Machine Learning Basics",
  "score": 80,
  "totalQuestions": 5,
  "difficulty": "medium"
}
```

**Response:**
```json
{
  "status": true,
  "message": "Quiz result saved successfully",
  "quizResult": {
    "videoId": "dQw4w9WgXcQ",
    "videoTitle": "Machine Learning Basics",
    "score": 80,
    "totalQuestions": 5,
    "difficulty": "medium",
    "date": "2024-01-25T14:40:00Z"
  }
}
```

---

### AI Features Examples

#### 1. Generate Summary
**Request:**
```http
POST http://localhost:8000/api/ai/summarize
Cookie: connect.sid=xxx
Content-Type: application/json

{
  "transcript": "This video covers machine learning basics. First, we'll discuss what machine learning is. Machine learning is a subset of artificial intelligence... [full transcript continues]"
}
```

**Response:**
```json
{
  "status": true,
  "summary": "This video provides an introduction to machine learning, explaining it as a subset of AI. Key topics covered include the definition of ML, types of learning (supervised and unsupervised), and practical applications in industry. The video emphasizes the importance of training and testing datasets for model validation."
}
```

#### 2. Generate Quiz
**Request:**
```http
POST http://localhost:8000/api/ai/quiz
Cookie: connect.sid=xxx
Content-Type: application/json

{
  "summary": "This video provides an introduction to machine learning...",
  "difficulty": "medium"
}
```

**Response:**
```json
{
  "status": true,
  "quiz": [
    {
      "id": 1,
      "question": "What is machine learning?",
      "options": [
        "A type of programming language",
        "A subset of artificial intelligence",
        "A database management system",
        "A hardware component"
      ],
      "correctAnswer": 1
    },
    {
      "id": 2,
      "question": "What are the two main types of machine learning?",
      "options": [
        "Supervised and Distributed",
        "Supervised and Unsupervised",
        "Supervised and Neural",
        "Supervised and Predictive"
      ],
      "correctAnswer": 1
    }
  ]
}
```

---

### Playlist Examples

#### 1. Get Playlist Details
**Request:**
```http
GET http://localhost:8000/api/playlists/605f7b1234567890abcdef01
Cookie: connect.sid=xxx
```

**Response:**
```json
{
  "status": true,
  "playlist": {
    "_id": "605f7b1234567890abcdef01",
    "title": "Python Basics Course",
    "description": "Complete beginner-friendly Python course",
    "createdBy": "507f1f77bcf86cd799439011",
    "isPublic": true,
    "videos": [
      {
        "videoId": "dQw4w9WgXcQ",
        "title": "Python Introduction",
        "thumbnailUrl": "https://i.ytimg.com/vi/dQw4w9WgXcQ/default.jpg",
        "duration": 1800
      },
      {
        "videoId": "jNQXAC9IVRw",
        "title": "Variables and Data Types",
        "thumbnailUrl": "https://i.ytimg.com/vi/jNQXAC9IVRw/default.jpg",
        "duration": 2400
      }
    ],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-25T14:30:00Z"
  }
}
```

#### 2. Create New Playlist
**Request:**
```http
POST http://localhost:8000/api/playlists
Cookie: connect.sid=xxx
Content-Type: application/json

{
  "title": "Data Science Fundamentals",
  "description": "Learn data science from scratch",
  "isPublic": true,
  "videos": []
}
```

**Response:**
```json
{
  "status": true,
  "message": "Playlist created successfully",
  "playlist": {
    "_id": "605f7b9876543210abcdef02",
    "title": "Data Science Fundamentals",
    "description": "Learn data science from scratch",
    "createdBy": "507f1f77bcf86cd799439011",
    "isPublic": true,
    "videos": [],
    "createdAt": "2024-01-25T14:50:00Z"
  }
}
```

---

### Transcript Example

#### 1. Get Video Transcript
**Request:**
```http
GET http://localhost:8000/api/videos/dQw4w9WgXcQ/transcript?lang=en
Cookie: connect.sid=xxx
```

**Response:**
```json
{
  "status": true,
  "transcript": [
    {
      "text": "Welcome to machine learning basics.",
      "start": 0,
      "duration": 5
    },
    {
      "text": "In this video, we'll cover the fundamentals of ML.",
      "start": 5,
      "duration": 8
    },
    {
      "text": "Machine learning is a subset of artificial intelligence.",
      "start": 13,
      "duration": 6
    }
  ],
  "videoId": "dQw4w9WgXcQ",
  "availableLanguages": ["en", "es", "fr"]
}
```

---

### Error Response Examples

#### 1. Unauthorized Access
```json
{
  "status": false,
  "message": "User not authenticated",
  "statusCode": 401
}
```

#### 2. Resource Not Found
```json
{
  "status": false,
  "message": "Note not found for this video",
  "statusCode": 404
}
```

#### 3. Validation Error
```json
{
  "status": false,
  "message": "Validation error",
  "errors": {
    "videoId": "Video ID is required",
    "content": "Content cannot be empty"
  },
  "statusCode": 400
}
```

#### 4. File Size Exceeded
```json
{
  "status": false,
  "message": "File size exceeds maximum limit of 5MB",
  "statusCode": 413
}
```

---

### Frontend Integration Examples

#### Using Fetch API

**Save Notes:**
```javascript
const saveNotes = async (videoId, videoTitle, content) => {
  const response = await fetch('http://localhost:8000/api/user/notes', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      videoId,
      videoTitle,
      content
    })
  });
  
  const data = await response.json();
  if (data.status) {
    console.log('Notes saved successfully');
  }
};
```

**Get Dashboard Data:**
```javascript
const fetchDashboard = async () => {
  const response = await fetch('http://localhost:8000/api/user/dashboard', {
    method: 'GET',
    credentials: 'include'
  });
  
  const data = await response.json();
  return data;
};
```

**Upload Profile Image:**
```javascript
const uploadProfileImage = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://localhost:8000/api/user/upload-profile-image', {
    method: 'POST',
    credentials: 'include',
    body: formData
  });
  
  const data = await response.json();
  return data;
};
```

#### Using Axios

**Generate Summary:**
```javascript
import axios from 'axios';

const generateSummary = async (transcript) => {
  try {
    const response = await axios.post(
      'http://localhost:8000/api/ai/summarize',
      { transcript },
      { withCredentials: true }
    );
    return response.data.summary;
  } catch (error) {
    console.error('Error generating summary:', error);
  }
};
```

**Get Notes:**
```javascript
const getNotes = async (videoId) => {
  try {
    const response = await axios.get(
      `http://localhost:8000/api/user/notes/${videoId}`,
      { withCredentials: true }
    );
    return response.data.note;
  } catch (error) {
    if (error.response?.status === 404) {
      return null; // No notes yet
    }
    console.error('Error fetching notes:', error);
  }
};
```

---

## �📚 Features Guide

### 1. **Video Player & Notes**

- Navigate to a video from the dashboard
- Click the **📝 Notes** tab
- Type your notes in the text area
- Notes auto-save every 30 seconds
- Click **Save Notes** for immediate save
- Notes are linked to specific videos

### 2. **Transcript & Summary**

- Click **📖 Transcribe** to extract video transcript
- Click **✨ Summarize** to generate AI summary
- View full transcript or AI-generated summary
- Great for quick content review

### 3. **Quiz Generation**

- Click **🧠 Quiz** to generate quiz questions
- Select difficulty level (easy, medium, hard)
- Answer multiple-choice questions
- Get instant feedback on performance
- Quiz results saved to your profile

### 4. **User Profile**

- Click profile avatar in header
- Click **Profile** to manage account
- Upload custom profile picture (click camera icon)
- Edit name and account type
- View account statistics

### 5. **Learning Dashboard**

- View total watch time and quiz scores
- See activity streaks
- Access **Continue Watching** section
- Get **Smart Review** recommendations for failed quizzes
- Track daily activity

### 6. **Playlists**

- Create custom learning playlists
- Add multiple videos to organize content
- Track progress within playlists
- Share playlists with others

---

## 💾 Database Schema

### User Model

```javascript
{
  _id: ObjectId,
  googleId: String (unique),
  name: String,
  email: String (unique),
  picture: String,            // Google profile picture
  profileImage: String,       // Uploaded custom image
  accountType: String,        // Student, Teacher, Developer, etc.
  stats: {
    totalWatchTime: Number,   // in seconds
    totalQuizzesSolved: Number,
    topicsCleared: [String]
  },
  dailyActivity: [{
    date: String (YYYY-MM-DD),
    watchTime: Number,
    appOpenTime: Number,
    videosWatched: [String],
    loginCount: Number
  }],
  quizHistory: [{
    date: Date,
    videoId: String,
    videoTitle: String,
    score: Number,
    totalQuestions: Number,
    difficulty: String
  }],
  learningProgress: [{       // Continue Watching
    videoId: String,
    title: String,
    thumbnailUrl: String,
    lastWatched: Date,
    playlistId: String
  }],
  notes: [{                  // Video Notes
    videoId: String,
    videoTitle: String,
    content: String,
    createdAt: Date,
    updatedAt: Date
  }],
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Playlist Model

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  createdBy: ObjectId (User),
  videos: [{
    videoId: String,
    title: String,
    thumbnailUrl: String,
    duration: Number
  }],
  isPublic: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---



2. **Create feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Make changes and commit**
   ```bash
   git commit -m "Add AmazingFeature"
   ```

4. **Push to branch**
   ```bash
   git push origin feature/AmazingFeature
   ```

5. **Open Pull Request**

### Code Standards
- Use ESLint for code quality
- Follow existing code style
- Add comments for complex logic
- Test your changes before submitting

---

## 🐛 Troubleshooting

### Common Issues

#### **Port Already in Use**
```bash
# Change port in server/.env
PORT=8001
```

#### **MongoDB Connection Error**
- Check `MONGO_URI` in `.env`
- Ensure MongoDB is running
- Verify network access in MongoDB Atlas

#### **Google OAuth Not Working**
- Verify redirect URIs in Google Cloud Console
- Check `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Ensure frontend URL matches OAuth configuration

#### **Transcript Not Loading**
- Check YouTube video is available
- Ensure video has transcripts available
- Verify `GOOGLE_AI_API_KEY` is set correctly

#### **Notes Not Saving**
- Check browser's local storage is enabled
- Verify MongoDB connection
- Check network tab in developer tools for API errors

#### **Frontend Not Connecting to Backend**
- Verify `VITE_API_URL` in frontend `.env`
- Ensure backend is running on correct port
- Check CORS settings in `server.js`

### Getting Help

- Check existing [GitHub Issues](https://github.com/yourusername/LearnStream/issues)
- Review error logs in browser console and server terminal
- Ask in discussions or create a new issue with:
  - Error message/screenshot
  - Steps to reproduce
  - System information

---

## 📝 Environment Variables Reference

### Backend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| PORT | Server port | 8000 |
| NODE_ENV | Environment | development/production |
| MONGO_URI | MongoDB connection string | mongodb+srv://... |
| SESSION_SECRET | Session encryption key | random-secret-key |
| GOOGLE_CLIENT_ID | Google OAuth ID | xxx.apps.googleusercontent.com |
| GOOGLE_CLIENT_SECRET | Google OAuth secret | xxx |
| CLIENT_URL | Frontend URL | http://localhost:5173 |
| GOOGLE_AI_API_KEY | Google Generative AI key | xxx |

### Frontend (.env)

| Variable | Description | Example |
|----------|-------------|---------|
| VITE_API_URL | Backend API URL | http://localhost:8000 |

---

## 🚀 Deployment

### Deploy to Render

See [DEPLOY.md](DEPLOY.md) for detailed deployment instructions.

Quick start:
```bash
# Push to GitHub
git push origin main

# Connect to Render and deploy
```

### Deploy to Vercel (Frontend)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

---

## � Component Interaction & Data Flow

### Frontend Component Communication

#### Component Hierarchy
```
App.jsx (Root)
├── AuthContext (Global Auth State)
│   ├── useAuth() Hook
│   └── User Object: { id, name, email, picture, profileImage, ... }
│
├── Router
│   ├── Layout Components
│   │   ├── Header.jsx
│   │   │   └── UserDropdown.jsx (uses AuthContext)
│   │   ├── Navbar.jsx
│   │   └── Footer.jsx
│   │
│   └── Pages
│       ├── Home/ (displays playlists)
│       ├── Profile/ (uses AuthContext, uploads images)
│       ├── Dashboard/ (displays stats from API)
│       ├── VideoPlayer/
│       │   ├── Player.jsx (main component)
│       │   ├── VideoFrame.jsx (YouTube iframe)
│       │   ├── VideoControls.jsx (tab navigation)
│       │   └── components/
│       │       ├── NotesBox.jsx (API: POST/GET/DELETE notes)
│       │       ├── TranscriptBox.jsx (API: GET transcript)
│       │       ├── SummaryBox.jsx (API: POST summarize)
│       │       └── QuizBox.jsx (API: POST quiz, POST result)
│       ├── Playlist/
│       ├── Feed/
│       ├── MyLearning/
│       ├── About/
│       └── Contact/
```

#### AuthContext Flow
```
App.jsx loads
    ↓
useEffect calls: GET /auth/login/success
    ↓
Response includes user object with all fields
    ↓
AuthContext.user = { id, name, email, picture, profileImage, ... }
    ↓
All child components access user via: useAuth() hook
    ↓
Any profile update → Fetch new user data → Update context
```

#### VideoPlayer Data Flow
```
Player.jsx mounts with videoId prop
    ↓
VideoFrame.jsx renders YouTube iframe
    ↓
Every 30 seconds: POST /api/user/track (watch time)
    ↓
User clicks "Notes" tab
    ↓
NotesBox.jsx mounts
    ↓
useEffect: GET /api/user/notes/:videoId
    ↓
Textarea displays note content
    ↓
User types → 30s debounce → POST /api/user/notes
    ↓
Database updated, "Saved" message shown
```

### Backend Request Processing Flow

#### Express Middleware Chain
```
Client Request
    ↓
CORS Middleware (allow cross-origin requests)
    ↓
Session Middleware (restore session from cookie)
    ↓
Body Parser Middleware (parse JSON/FormData)
    ↓
Multer Middleware (if file upload route)
    ├── File validation
    ├── File storage
    └── Return file info
    ↓
Route Handler (AuthMiddleware checks session)
    ├── If not authenticated → return 401
    ├── If authenticated → continue
    ↓
Controller/Logic
    ├── Database operations (Mongoose queries)
    ├── External API calls (Google AI, YouTube)
    └── Return response
    ↓
Send JSON Response
```

#### Notes API Flow (Backend)
```
POST /api/user/notes received
    ↓
AuthMiddleware checks: req.user exists?
    ↓
Body validation: videoId, videoTitle, content present?
    ↓
Database query: Find user by req.user._id
    ↓
Search user.notes array for matching videoId
    ├── If found → Update note.content and updatedAt
    └── If not found → Add new note to array
    ↓
user.save() → MongoDB updates document
    ↓
Return note object with success message
```

#### AI Summarize Flow (Backend)
```
POST /api/ai/summarize received
    ↓
Body validation: transcript present?
    ↓
Call Google Generative AI API
    ├── API Key from ENV
    ├── Prompt: "Summarize this: [transcript]"
    └── Model: google-generative-ai
    ↓
AI generates summary (takes 5-15 seconds)
    ↓
Return summary to frontend
```

---

### State Management Patterns

#### AuthContext (Global State)
```javascript
// Pattern: Context + Reducer
const [user, setUser] = useState(null);

// Update when:
// 1. App loads → GET /auth/login/success
// 2. User logs in → Redirect from Google OAuth
// 3. User uploads profile image → Frontend reloads
// 4. User updates profile → PUT /api/user/profile

// Accessed by:
// const user = useAuth(); // in any component
```

#### Component Local State (NotesBox)
```javascript
// Pattern: useState for component-specific data
const [notes, setNotes] = useState('');          // Current notes content
const [hasChanges, setHasChanges] = useState(false); // Unsaved changes
const [lastSaved, setLastSaved] = useState(null);    // Last save timestamp

// Flow:
// 1. Component mounts → fetch notes from API
// 2. User types → setHasChanges(true)
// 3. 30s idle → auto-save → POST API call
// 4. Save response → setLastSaved(new Date())
```

#### Component Props Drilling
```
Player.jsx (has videoId, videoTitle)
    ↓
VideoControls.jsx (receives viewMode as prop)
    ↓
NotesBox.jsx (receives videoId, videoTitle, loading as props)
    ↓
Component uses props to:
    - Fetch data: GET /api/user/notes/:videoId
    - Save data: POST /api/user/notes { videoId, videoTitle, content }
```

---

### Error Handling Patterns

#### Frontend Error Handling
```javascript
// Pattern: Try-catch with user feedback
try {
  const response = await fetch('/api/user/notes', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  if (!response.ok) {
    // 400: Validation error
    // 401: Not authenticated
    // 404: Resource not found
    // 500: Server error
    throw new Error(response.statusText);
  }
  
  const data = await response.json();
  // Success → show toast/message
  showSuccess('Notes saved!');
} catch (error) {
  // Error → show error message
  showError('Failed to save notes');
}
```

#### Backend Error Handling
```javascript
// Pattern: Try-catch with HTTP status codes
router.post('/api/user/notes', authMiddleware, async (req, res) => {
  try {
    // Validate input
    if (!req.body.videoId) {
      return res.status(400).json({
        status: false,
        message: 'Video ID is required'
      });
    }
    
    // Process request
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: 'User not found'
      });
    }
    
    // Update and save
    const noteIndex = user.notes.findIndex(n => n.videoId === req.body.videoId);
    if (noteIndex !== -1) {
      user.notes[noteIndex].content = req.body.content;
    } else {
      user.notes.push(req.body);
    }
    
    await user.save();
    
    // Success response
    return res.status(200).json({
      status: true,
      message: 'Note saved successfully',
      note: user.notes[user.notes.length - 1]
    });
  } catch (error) {
    // Unexpected error
    console.error(error);
    return res.status(500).json({
      status: false,
      message: 'Internal server error'
    });
  }
});
```

---

### External Service Integration

#### Google OAuth Flow
```
Frontend: User clicks "Sign In with Google"
    ↓
Frontend redirects to: /auth/google
    ↓
Backend initiates Google OAuth using Passport.js
    ↓
Browser redirects to Google login page
    ↓
User enters credentials and grants permission
    ↓
Google redirects to: /auth/google/callback with authorization code
    ↓
Backend exchanges code for user info:
    ├── Name, Email
    ├── Profile Picture URL
    └── Google ID (unique identifier)
    ↓
Backend checks MongoDB: Does user with this googleId exist?
    ├── If yes → Update lastLogin, return user
    └── If no → Create new user document
    ↓
Passport creates session cookie
    ↓
Browser redirected to Frontend with cookie
    ↓
Frontend: GET /auth/login/success (includes cookie)
    ↓
Response includes user object
    ↓
Frontend stores in AuthContext
    ↓
User now logged in and can access protected routes
```

#### YouTube Transcript API
```
Frontend: User clicks "Transcribe"
    ↓
Frontend sends: GET /api/videos/:videoId/transcript?lang=en
    ↓
Backend receives request
    ↓
Backend calls: youtube-transcript-api Python library
    ↓
Python script runs: youtube_transcript_api.YouTubeTranscriptApi.get_transcript(videoId, languages=['en'])
    ↓
API returns transcript segments:
    [
      { text: "...", start: 0, duration: 5 },
      { text: "...", start: 5, duration: 8 }
    ]
    ↓
Backend formats and returns to frontend
    ↓
Frontend displays in TranscriptBox component
```

#### Google Generative AI (Gemini)
```
Frontend: User clicks "Summarize"
    ↓
Frontend sends: POST /api/ai/summarize with transcript
    ↓
Backend receives transcript text
    ↓
Backend calls: Google Generative AI API
    ├── Endpoint: generativelanguage.googleapis.com
    ├── Model: gemini-pro
    ├── Prompt: "Summarize this educational content: [transcript]"
    ├── API Key: from GOOGLE_AI_API_KEY in .env
    └── Temperature: 0.7 (for balanced output)
    ↓
AI processes and generates summary (5-15 seconds)
    ↓
Backend receives summary from API
    ↓
Backend returns to frontend
    ↓
Frontend displays summary in SummaryBox
    ↓
User can copy or use for quiz generation
```

---

### Database Query Patterns

#### Finding User by ID
```javascript
// Pattern: Mongoose findById
const user = await User.findById(userId);
// Returns: Full user document with all fields
```

#### Finding and Updating Notes
```javascript
// Pattern: Find user, modify array, save
const user = await User.findById(userId);

// Find index of note for this video
const noteIndex = user.notes.findIndex(n => n.videoId === videoId);

if (noteIndex !== -1) {
  // Update existing note
  user.notes[noteIndex].content = newContent;
  user.notes[noteIndex].updatedAt = new Date();
} else {
  // Create new note
  user.notes.push({
    videoId,
    videoTitle,
    content: newContent,
    createdAt: new Date(),
    updatedAt: new Date()
  });
}

await user.save(); // Persist to MongoDB
```

#### Calculating Daily Stats
```javascript
// Pattern: Aggregate and filter data
const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

const todayActivity = user.dailyActivity.find(a => a.date === today);

const stats = {
  totalWatchTime: user.dailyActivity.reduce((sum, a) => sum + a.watchTime, 0),
  todayWatchTime: todayActivity?.watchTime || 0,
  quizzesAttempted: user.quizHistory.length,
  averageScore: user.quizHistory.length > 0 
    ? user.quizHistory.reduce((sum, q) => sum + q.score, 0) / user.quizHistory.length
    : 0
};
```

---

## �📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Real-time collaboration on notes
- [ ] Video dubbing in multiple languages
- [ ] Live classroom features
- [ ] Certificate generation
- [ ] Integration with LMS platforms
- [ ] Advanced analytics dashboard
- [ ] Social learning features

---
