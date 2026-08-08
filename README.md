# JobGraph - AI-Powered Job Matching Platform

A modern MERN stack application that uses AI embeddings to intelligently match candidates with job opportunities.

## Features

- **AI-Powered Matching**: Uses Groq AI (LLaMA 3.3) for fast semantic job matching
- **Resume Parsing**: Automatically extracts skills and experience from resumes
- **File Upload Support**: Upload PDF, DOC, DOCX, TXT files or paste text
- **Smart Search**: Semantic search based on candidate skills
- **Match Scoring**: AI-calculated compatibility scores between candidates and jobs
- **Premium UI**: Modern glassmorphism design with dark theme
- **Real-time Updates**: Live application tracking for recruiters

## Tech Stack

### Backend
- Node.js + Express
- MongoDB with Mongoose
- Groq AI API (LLaMA 3.3)
- Multer for file uploads
- Cosine Similarity for vector matching

### Frontend
- React 18 with Vite
- React Router DOM
- Axios for API calls
- Lucide React for icons
- Vanilla CSS with glassmorphism

## Project Structure

```
job/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── jobController.js
│   │   ├── profileController.js
│   │   └── applicationController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Job.js
│   │   └── Application.js
│   ├── routes/
│   │   ├── jobRoutes.js
│   │   ├── profileRoutes.js
│   │   └── applicationRoutes.js
│   ├── services/
│   │   ├── groqService.js
│   │   └── matchingService.js
│   ├── utils/
│   │   ├── cosineSimilarity.js
│   │   └── formatters.js
│   ├── middleware/
│   │   └── errorMiddleware.js
│   ├── .env
│   ├── server.js
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── JobCard.jsx
    │   │   ├── ApplicationCard.jsx
    │   │   ├── SearchBar.jsx
    │   │   └── Loader.jsx
    │   ├── pages/
    │   │   ├── CandidateDashboard.jsx
    │   │   ├── RecruiterDashboard.jsx
    │   │   ├── JobDetails.jsx
    │   │   └── Profile.jsx
    │   ├── services/
    │   │   ├── api.js
    │   │   ├── jobService.js
    │   │   ├── profileService.js
    │   │   └── applicationService.js
    │   ├── hooks/
    │   │   ├── useJobs.js
    │   │   └── useApplications.js
    │   ├── utils/
    │   │   └── helpers.js
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally or MongoDB Atlas)
- Groq API Key

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
# Edit .env file and add:
# - Your MongoDB URI
# - Your Groq API Key

# Start the backend server
npm run dev
```

The backend will run on `http://localhost:5000`

You can also explicitly initialize the required database, collections, and indexes:

```bash
cd backend
npm run db:init
```

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 3. Environment Variables

Create/edit `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/jobgraph
GROQ_API_KEY=your_groq_api_key_here
```

`MONGODB_URI` is optional in local development. If omitted, backend falls back to:

```env
mongodb://127.0.0.1:27017/jobgraph
```

**Get your Groq API Key:**
1. Go to https://console.groq.com/keys
2. Sign up (free!)
3. Create a new API key
4. Copy and paste it in your .env file

## Usage Guide

### For Candidates

1. **Setup Profile**
   - Navigate to Profile page
   - Upload resume file (PDF, DOC, DOCX, TXT) OR paste text
   - Click "Parse Resume with Groq AI"
   - Your skills will be extracted automatically

2. **Search Jobs**
   - Go to "Find Jobs" page
   - Browse AI-matched jobs (sorted by match score)
   - Use search bar for specific queries
   - Click on a job to view details

3. **Apply**
   - Click "Apply Now" on job details page
   - Your profile will be submitted automatically

### For Recruiters

1. **Post a Job**
   - Navigate to "Post Job" page
   - Fill in job details
   - Add required skills (comma-separated)
   - Click "Post Job"

2. **View Applications**
   - After posting, click "Load Applications"
   - View candidates sorted by AI match score
   - See matched skills and contact information

## API Endpoints

### Jobs
- `POST /api/jobs/create` - Create a new job
- `POST /api/jobs/search` - Search jobs with semantic matching
- `GET /api/jobs/all` - Get all active jobs
- `GET /api/jobs/:id` - Get job by ID

### Profile
- `POST /api/profile/parse-resume` - Parse resume with AI

### Applications
- `POST /api/applications/apply` - Submit job application
- `GET /api/applications/job/:jobId` - Get applications for a job
- `PATCH /api/applications/:id/status` - Update application status

## Key Features Explained

### AI Matching Algorithm
1. Resume/Job files or text are processed
2. Groq AI (LLaMA 3.1) extracts keywords and generates embeddings
3. Cosine similarity calculates match percentage
4. Results are sorted by match score

### Glassmorphism UI
- Semi-transparent cards with backdrop blur
- Gradient accents (violet/cyan)
- Smooth hover animations
- Dark theme base (#0f111a)

### Responsive Design
- Mobile-first approach
- Breakpoints at 768px and 968px
- Flexible grid layouts

## Development

### Backend Scripts
- `npm start` - Run production server
- `npm run dev` - Run development server with nodemon
- `npm run smoke:test` - Run end-to-end backend smoke tests (requires backend running)

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Readiness Check

Run these commands before deployment:

```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev

# Terminal 3
cd backend
npm run smoke:test
```

Optional override if your backend is on a non-default port:

```bash
API_BASE_URL=http://localhost:5050/api npm run smoke:test
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running locally
- Or use MongoDB Atlas connection string

### API Key Error
- Verify your Gemini API key is correct
- Check API quota limits

### CORS Issues
- Backend is configured for `http://localhost:3000`
- Update CORS settings if using different port

## Future Enhancements

- [ ] User authentication with JWT
- [ ] Real-time notifications
- [ ] Advanced filters (salary, location, experience)
- [ ] Candidate profiles with portfolios
- [ ] Video interview integration
- [ ] Analytics dashboard for recruiters

## License

MIT License - Feel free to use this project for learning or personal use.

## Support

For issues or questions, please create an issue in the repository.
