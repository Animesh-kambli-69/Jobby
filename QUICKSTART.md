# JobGraph - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Install Dependencies

Open two terminal windows.

**Terminal 1 - Backend:**
```bash
cd backend
npm install
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
```

### Step 2: Get Groq API Key

1. Visit: https://console.groq.com/keys
2. Sign up (free!)
3. Click "Create API Key"
4. Copy your API key

### Step 3: Configure Environment

Edit `backend/.env` and add your API key:
```env
GROQ_API_KEY=your_actual_api_key_here
```

### Step 4: Start MongoDB

**Option A - Local MongoDB:**
```bash
mongod
```

**Option B - MongoDB Atlas:**
Update `MONGODB_URI` in `backend/.env` with your Atlas connection string.

### Step 5: Run the Application

**Terminal 1 - Start Backend:**
```bash
cd backend
npm run dev
```
Backend runs on: http://localhost:5000

**Terminal 2 - Start Frontend:**
```bash
cd frontend
npm run dev
```
Frontend runs on: http://localhost:3000

---

## 📱 How to Use

### As a Candidate:

1. **Create Your Profile**
   - Click "Profile" in navbar
   - **Upload your resume file** (PDF, DOC, DOCX, TXT) OR paste text
   - Click "Parse Resume with Groq AI"
   - AI will extract your skills automatically

2. **Find Jobs**
   - Click "Find Jobs"
   - See jobs ranked by AI match score
   - Higher percentage = better match
   - Use search to filter

3. **Apply**
   - Click any job card
   - View full details
   - Click "Apply Now"
   - Done!

### As a Recruiter:

1. **Post a Job**
   - Click "Post Job" in navbar
   - Fill in:
     - Job title
     - Description
     - Required skills (comma-separated)
     - Company, location, salary (optional)
   - Click "Post Job"

2. **View Applications**
   - After posting, click "Load Applications"
   - See all candidates
   - Sorted by AI match score (highest first)
   - View their skills and contact info

---

## 🎨 UI Features

- **Glassmorphism Design**: Premium frosted glass effect
- **Dark Theme**: Easy on eyes, modern aesthetic
- **Smooth Animations**: Hover effects, transitions
- **Responsive**: Works on mobile, tablet, desktop
- **Match Scores**:
  - 🟢 Green: 70%+ (Excellent match)
  - 🟡 Orange: 40-69% (Good match)
  - ⚫ Gray: <40% (Basic match)

---

## 🔧 Troubleshooting

### "Cannot connect to MongoDB"
- Start MongoDB: `mongod`
- Or use MongoDB Atlas

### "Invalid API key"
- Verify key in `backend/.env`
- Check for extra spaces
- Get new key if needed

### "Module not found"
- Run `npm install` in both backend/frontend
- Clear cache: `npm cache clean --force`

### Frontend not loading
- Check backend is running on port 5000
- Check CORS settings in `backend/server.js`

---

## 💡 Pro Tips

1. **Better Matches**: Add more skills to your profile
2. **Skills Format**: Use comma-separated (React, Node.js, Python)
3. **Resume Quality**: More detailed resume = better parsing
4. **Search**: Leave empty to see all jobs with your match scores

---

## 📊 Tech Stack

**Backend:**
- Express.js (API)
- MongoDB (Database)
- **Groq AI (LLaMA 3.1)** - Fast embeddings
- Multer (File uploads)
- Cosine Similarity (Matching)

**Frontend:**
- React 18 (UI)
- React Router (Navigation)
- Axios (API calls)
- Lucide Icons
- Vanilla CSS (Styling)

---

## 🎯 Key Features

✅ AI-powered matching using embeddings
✅ **File upload support (PDF, DOC, DOCX, TXT)**
✅ Automatic resume parsing with Groq AI
✅ Semantic job search
✅ Real-time match scores
✅ Premium glassmorphism UI
✅ Responsive design
✅ No authentication required (MVP)

---

## 🔮 What Makes This Special?

### Traditional Job Portals:
- Keyword matching (exact match only)
- Manual skill tagging
- No intelligence

### JobGraph (This App):
- **Semantic Understanding**: "JavaScript" matches "JS", "React", "Frontend"
- **Vector Embeddings**: AI understands skill relationships
- **Smart Ranking**: Best matches first, automatically
- **Context Aware**: Understands experience levels, related skills

---

## 📈 Next Steps (Optional)

Want to enhance? Add:
- User authentication (JWT)
- Save favorite jobs
- Application status tracking
- Email notifications
- Video interviews
- Analytics dashboard

---

## 🆘 Need Help?

1. Check console for errors (F12)
2. Verify all services running
3. Check API endpoints: http://localhost:5000/api/health
4. Review logs in terminal

---

**Enjoy building with JobGraph! 🚀**
