"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function Icon({
  name,
  className = "",
  fill = false,
}: {
  name: string;
  className?: string;
  fill?: boolean;
}) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={fill ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const supabase = createClient();

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setError(error.message);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Check your email for a confirmation link!");
      }
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <div className="w-full max-w-md space-y-8">
      {/* Heading */}
      <div className="space-y-1.5">
        <h1
          className="font-extrabold text-on-background"
          style={{ fontSize: "32px", letterSpacing: "-0.02em" }}
        >
          {mode === "signin" ? "Welcome back." : "Create account."}
        </h1>
        <p className="text-on-surface-variant text-base">
          {mode === "signin"
            ? "Let's continue growing."
            : "Start your journey today."}
        </p>
      </div>

      {/* Error / success */}
      {error && (
        <div className="bg-error-container text-on-error-container px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-secondary-container/50 text-on-secondary-container px-4 py-3 rounded-xl text-sm font-medium">
          {message}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleEmailAuth} className="space-y-5">
        <div className="space-y-1.5">
          <label
            className="text-sm font-bold text-on-background block"
            htmlFor="email"
          >
            Email Address
          </label>
          <div className="relative">
            <Icon
              name="mail"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]"
            />
            <input
              type="email"
              id="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full pl-11 pr-4 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-on-background placeholder:text-outline text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              className="text-sm font-bold text-on-background"
              htmlFor="password"
            >
              Password
            </label>
            {mode === "signin" && (
              <button
                type="button"
                className="text-sm font-bold text-primary hover:opacity-70 transition-opacity"
              >
                Forgot password?
              </button>
            )}
          </div>
          <div className="relative">
            <Icon
              name="lock"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline text-[18px]"
            />
            <input
              type="password"
              id="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3.5 bg-surface-container-low border border-outline-variant rounded-xl text-on-background placeholder:text-outline text-sm font-medium focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-4 rounded-xl font-extrabold text-base hover:bg-primary-container transition-all shadow-[0_4px_20px_rgba(93,63,211,0.32)] hover:shadow-[0_8px_32px_rgba(93,63,211,0.42)] active:scale-[0.98] duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading
            ? "Please wait…"
            : mode === "signin"
            ? "Log In"
            : "Create Account"}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex items-center gap-4">
        <div className="flex-1 h-px bg-outline-variant" />
        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest whitespace-nowrap">
          Or continue with
        </span>
        <div className="flex-1 h-px bg-outline-variant" />
      </div>

      {/* Google */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 border border-outline-variant bg-white rounded-xl py-3.5 font-bold text-sm text-on-background hover:border-primary hover:bg-primary-fixed/20 transition-all active:scale-[0.98] shadow-[0_2px_8px_rgba(0,0,0,0.04)] disabled:opacity-60"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Continue with Google
      </button>

      {/* Toggle mode */}
      <p className="text-center text-sm text-on-surface-variant">
        {mode === "signin"
          ? "Don't have an account?"
          : "Already have an account?"}{" "}
        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError("");
            setMessage("");
          }}
          className="text-primary font-bold hover:opacity-70 transition-opacity"
        >
          {mode === "signin" ? "Sign up for free" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
