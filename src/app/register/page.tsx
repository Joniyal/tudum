"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
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
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Auto login after registration
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error("Registration successful but login failed");
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
            JOIN TUDUM
          </h1>
          <p className="text-white font-bold uppercase tracking-wide opacity-80">
            START TRACKING TODAY
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
              htmlFor="name"
              className="block text-sm font-black text-white mb-2 uppercase tracking-wide"
            >
              NAME
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-4 py-2 border-2 border-white bg-black text-white font-bold placeholder-gray-500 focus:outline-none uppercase"
              placeholder="YOUR NAME"
            />
          </div>

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
                placeholder="CREATE PASSWORD"
                minLength={6}
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
            {loading ? "CREATING ACCOUNT..." : "CREATE ACCOUNT"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white font-bold">
          ALREADY HAVE AN ACCOUNT?{" "}
          <Link
            href="/login"
            className="text-white underline font-black hover:opacity-80 transition-opacity"
          >
            SIGN IN
          </Link>
        </p>
      </div>
    </div>
  );
}
