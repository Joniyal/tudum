import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center max-w-3xl">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          Tudum
        </h1>
        <p className="text-2xl text-gray-700 dark:text-gray-300 mb-4">
          Collaborative Habit Tracker
        </p>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
          Build better habits together. Track your daily, weekly, and monthly goals
          with accountability partners who keep you motivated and on track.
        </p>

        <div className="flex gap-4 justify-center mb-16">
          <Link
            href="/register"
            className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-lg transition shadow-lg hover:shadow-xl"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-semibold rounded-lg text-lg transition shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700"
          >
            Sign In
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Track Your Habits
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create daily, weekly, or monthly habits and mark them complete as you go
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Connect with Partners
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Add accountability partners and see each other&apos;s progress in real-time
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md">
            <div className="text-4xl mb-4">🔥</div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Build Streaks
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Stay consistent and watch your streak grow day by day
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
