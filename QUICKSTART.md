# Quick Start Guide

## ⚡ Get Running in 5 Minutes

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database

**Option A: Free Cloud Database (Easiest)**
1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to Settings → Database → Connection String
4. Copy the connection string

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL, then:
createdb tudum
# Use: postgresql://user:password@localhost:5432/tudum
```

### 3. Configure Environment
```bash
# Copy the example env file
copy .env.example .env

# Edit .env and update:
DATABASE_URL="your-database-connection-string-here"
NEXTAUTH_SECRET="any-random-string-here"
```

### 4. Initialize Database
```bash
npx prisma generate
npx prisma db push
```

### 5. Run the App
```bash
npm run dev
```

Visit http://localhost:3000 🎉

---

## 📖 How to Use

1. **Create Account**: Click "Get Started" on the homepage
2. **Create Habits**: Add your daily/weekly/monthly habits
3. **Mark Complete**: Click "Mark Complete" when you do a habit
4. **Add Partners**: Go to Connections → Enter partner's email
5. **View Progress**: See your partners' habits in the Partners tab

---

## 🔧 Troubleshooting

**Build errors?**
- Make sure Node.js 18+ is installed
- Delete `node_modules` and `.next` folders, then run `npm install` again

**Database connection issues?**
- Verify your DATABASE_URL is correct
- Check that your database is running
- For Supabase, make sure to use the "connection string" not the "API URL"

**"User not found" on login?**
- Make sure you created an account first
- Check that `npx prisma db push` completed successfully

---

## 🚀 Deploy to Production

### Vercel (Recommended)
1. Push your code to GitHub
2. Go to https://vercel.com
3. Import your repository
4. Add environment variables
5. Deploy!

### Environment Variables for Production
```
DATABASE_URL=your-production-database-url
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://your-domain.com
```

---

## 📝 Notes

- The app auto-saves everything to the database
- Partners tab auto-refreshes every 30 seconds
- All passwords are securely hashed with bcrypt
- Dark mode works automatically based on system preferences
