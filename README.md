# Classroom Score 🏆

A classroom behavior points and rewards system built for teachers. Students earn points for good behavior and spend them in a rewards shop on small prizes.

## Overview

**Purpose:** Help teachers track student behavior with a tap-based points system, projector-friendly leaderboard, and a rewards shop where students spend their earned points.

**Built for:** Shawna's Grade 3 class — but designed to work for any classroom.

**Hosted on:** Netlify (free tier) with Supabase backend — publicly accessible from any device.

## Features

### V1 (Current)
- 🔐 Email/password authentication (admin + teacher roles)
- 👩‍🎓 Student roster management (add/remove)
- ✅ Tap-to-award points (+1, +5) and deductions (-1)
- 📋 Point categories (Listening, Participation, Kindness, Homework, etc.)
- 🏅 Sorted leaderboard with color coding and progress bars
- 🎁 **Rewards Shop** — students redeem earned points for prizes
- 📽️ Projector mode — clean leaderboard for classroom display
- ⚙️ Admin console — manage users, view stats, export data
- 📱 Mobile-first responsive design
- ☁️ Cloud database (Supabase PostgreSQL)

### V2 (Planned)
- Sound effects for big rewards
- Weekly behavior reports / CSV export improvements
- Parent view (read-only shareable link)
- "Student of the Week" highlight
- Behavior trend graphs
- Undo button for misclicks

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Vite + Vanilla JS |
| Backend | Netlify Functions (serverless) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Hosting | Netlify (free tier) |

## Getting Started

### Prerequisites
- Node.js 18+
- npm
- A free [Supabase](https://supabase.com) project
- A free [Netlify](https://netlify.com) account

### Setup

1. **Clone the repo:**
```bash
git clone https://github.com/YOUR_USERNAME/Classroom_Score.git
cd Classroom_Score
npm install
```

2. **Configure environment:**
```bash
cp .env.example .env
# Edit .env with your Supabase project URL and anon key
```

3. **Set up Supabase:**
   - Create a project at [supabase.com](https://supabase.com)
   - Run the SQL schema in the Supabase SQL Editor (see `supabase-schema.sql`)
   - Create your admin user in the Auth dashboard

4. **Run locally:**
```bash
npm run dev
# Opens at http://localhost:3032
```

### Deploy to Netlify

1. Push to GitHub
2. Connect your repo in Netlify dashboard
3. Set environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Netlify auto-deploys on every push

## Project Structure

```
Classroom_Score/
├── index.html               # Root HTML (all screens)
├── src/
│   ├── main.js              # App controller
│   ├── supabase.js          # Supabase client
│   ├── auth.js              # Authentication
│   ├── students.js          # Student CRUD
│   ├── points.js            # Points & leaderboard
│   ├── shop.js              # Rewards shop
│   ├── admin.js             # Admin console
│   └── style.css            # Design system
├── netlify/
│   └── functions/
│       └── admin.js         # Serverless admin API
├── package.json
├── vite.config.js
├── netlify.toml
├── .env.example
├── supabase-schema.sql      # Database setup script
└── README.md
```

---

*Built with ❤️ for teachers who deal with tiny humans all day*
