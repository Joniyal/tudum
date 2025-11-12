"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Invalid email or password");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4 font-mono">
      <div className="max-w-md w-full bg-black border-4 border-white p-8" style={{boxShadow: '8px 8px 0px rgba(255,255,255,0.3)'}}>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-wider">
            WELCOME BACK
          </h1>
          <p className="text-white font-bold uppercase tracking-wide opacity-80">
            SIGN IN TO CONTINUE
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-black border-2 border-white text-white px-4 py-3 font-bold">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-black text-white mb-2 uppercase tracking-wide"
            >
              EMAIL
            </label>
            <input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full px-4 py-2 border-2 border-white bg-black text-white font-bold placeholder-gray-500 focus:outline-none uppercase"
              placeholder="YOU@EXAMPLE.COM"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-black text-white mb-2 uppercase tracking-wide"
            >
              PASSWORD
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full px-4 py-2 pr-12 border-2 border-white bg-black text-white font-bold placeholder-gray-500 focus:outline-none uppercase"
                placeholder="YOUR PASSWORD"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 font-black text-lg"
              >
                {showPassword ? "👁️" : "🔒"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-black py-3 px-4 uppercase tracking-wider border-2 border-white hover:bg-black hover:text-white transition-all duration-200 disabled:opacity-50"
          >
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white font-bold">
          DON&apos;T HAVE AN ACCOUNT?{" "}
          <Link
            href="/register"
            className="text-white underline font-black hover:opacity-80 transition-opacity"
          >
            CREATE ONE
          </Link>
        </p>
      </div>
    </div>
  );
}
