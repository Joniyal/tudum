# Tudum - Collaborative Habit Tracker

A web application for shared accountability and habit tracking where users can track daily, weekly, or monthly tasks and see their partners' progress in real-time.

## Features

- 👥 **Multiple Accountability Partners** - Connect with multiple people to track habits together
- ✅ **Habit Tracking** - Create and track daily, weekly, or monthly habits
- 📊 **Real-time Updates** - See when your partners complete their tasks
- 🔐 **Secure Authentication** - User registration and login with NextAuth.js
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile devices

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js
- **Password Hashing:** bcryptjs

## Getting Started

### Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or remote)
- npm or yarn package manager

### Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   - Copy `.env.example` to `.env`:
     ```bash
     copy .env.example .env    # Windows
     cp .env.example .env      # Mac/Linux
     ```
   - Update the `.env` file with your database credentials:
     ```
     DATABASE_URL="postgresql://user:password@localhost:5432/tudum?schema=public"
     NEXTAUTH_SECRET="your-secure-random-secret"
     NEXTAUTH_URL="http://localhost:3000"
     ```

   **Option A: Using PostgreSQL locally**
   - Install PostgreSQL from https://www.postgresql.org/download/
   - Create a database: `createdb tudum`
   - Update DATABASE_URL with your credentials

   **Option B: Using a cloud database (Recommended for quick start)**
   - Create a free database at [Supabase](https://supabase.com) or [Railway](https://railway.app)
   - Copy the connection string to DATABASE_URL

3. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

### First Steps

1. Click "Get Started" to create an account
2. Create your first habit on the dashboard
3. Go to "Connections" tab to add accountability partners
4. Share your email with partners so they can connect with you
5. View your partners' progress in the "Partners" tab

## Project Structure

```
tudum/
├── prisma/
│   └── schema.prisma       # Database schema
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Home page
│   ├── components/        # React components
│   ├── lib/
│   │   ├── auth.ts        # NextAuth configuration
│   │   └── prisma.ts      # Prisma client
│   └── types/            # TypeScript type definitions
├── .env.example          # Environment variables template
└── package.json
```

## Database Schema

The app uses 4 main models:

- **User** - User accounts with authentication
- **Habit** - Tasks/habits to track (daily/weekly/monthly)
- **Completion** - Records of completed habits
- **Connection** - Relationships between users (pending/accepted/rejected)

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Features Implemented

✅ **Authentication**
- User registration and login
- Secure password hashing with bcryptjs
- Protected routes with NextAuth.js

✅ **Habit Management**
- Create, edit, and delete habits
- Daily, weekly, and monthly frequencies
- Mark habits as complete
- Track completion streaks
- View completion history

✅ **Accountability Partners**
- Send connection requests by email
- Accept/reject incoming requests
- Manage multiple partners
- Remove connections

✅ **Partner Dashboard**
- View all partners' habits in real-time
- See completion status (completed today indicator)
- Track partners' streaks
- Auto-refresh every 30 seconds

✅ **User Interface**
- Responsive design (mobile, tablet, desktop)
- Dark mode support
- Clean, modern UI with Tailwind CSS
- Intuitive navigation

## Future Enhancements

- 📧 Email notifications for partner completions
- 📊 Advanced analytics and charts
- 📅 Calendar view of completions
- 💬 Comments and encouragement messages
- 🏆 Achievements and badges
- 📱 Progressive Web App (PWA) support
- 🔔 Push notifications
- 🌐 i18n support for multiple languages

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
