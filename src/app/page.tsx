import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-3xl">
        <h1 className="text-6xl font-black mb-6 uppercase tracking-widest" style={{textShadow: '4px 4px 0px rgba(255,255,255,0.3)'}}>
          TUDUM
        </h1>
        <p className="text-2xl font-bold mb-4 uppercase tracking-wider">
          COLLABORATIVE HABIT TRACKER
        </p>
        <p className="text-lg font-bold mb-12 max-w-2xl mx-auto uppercase opacity-80">
          BUILD BETTER HABITS TOGETHER. TRACK YOUR DAILY, WEEKLY, AND MONTHLY GOALS WITH ACCOUNTABILITY PARTNERS WHO KEEP YOU MOTIVATED AND ON TRACK.
        </p>

        <div className="flex gap-4 justify-center mb-16 animate-fade-in">
          <Link
            href="/register"
            className="px-8 py-4 bg-white text-black font-black border-2 border-white uppercase tracking-wider text-lg hover:bg-black hover:text-white transition-all duration-200"
          >
            GET STARTED
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-black text-white font-black border-2 border-white uppercase tracking-wider text-lg hover:bg-white hover:text-black transition-all duration-200"
          >
            SIGN IN
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="bg-black border-4 border-white p-6" style={{boxShadow: '4px 4px 0px rgba(255,255,255,0.2)'}}>
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-xl font-black mb-2 text-white uppercase tracking-wider">
              TRACK YOUR HABITS
            </h3>
            <p className="text-white font-bold uppercase opacity-80">
              CREATE DAILY, WEEKLY, OR MONTHLY HABITS AND MARK THEM COMPLETE AS YOU GO
            </p>
          </div>

          <div className="bg-black border-4 border-white p-6" style={{boxShadow: '4px 4px 0px rgba(255,255,255,0.2)'}}>
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-black mb-2 text-white uppercase tracking-wider">
              CONNECT WITH PARTNERS
            </h3>
            <p className="text-white font-bold uppercase opacity-80">
              ADD ACCOUNTABILITY PARTNERS AND SEE EACH OTHER&apos;S PROGRESS IN REAL-TIME
            </p>
          </div>

          <div className="bg-black border-4 border-white p-6" style={{boxShadow: '4px 4px 0px rgba(255,255,255,0.2)'}}>
            <div className="text-4xl mb-4">🔥</div>
            <h3 className="text-xl font-black mb-2 text-white uppercase tracking-wider">
              BUILD STREAKS
            </h3>
            <p className="text-white font-bold uppercase opacity-80">
              STAY CONSISTENT AND WATCH YOUR STREAK GROW DAY BY DAY
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
