import Link from "next/link";
import { redirect } from "next/navigation";
import { Icon } from "@/components/icon";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

async function signIn(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";
  if (!email || !password) return;
  if (!isSupabaseConfigured()) {
    redirect("/login?error=Supabase+is+not+configured");
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  redirect(next);
}

async function signUp(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return;
  if (!isSupabaseConfigured()) {
    redirect("/login?mode=signup&error=Supabase+is+not+configured");
  }
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    redirect(`/login?mode=signup&error=${encodeURIComponent(error.message)}`);
  }
  if (!data.session) {
    redirect("/login?info=Check+your+email+to+confirm+your+account");
  }
  redirect("/");
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    error?: string;
    info?: string;
    mode?: string;
    next?: string;
  }>;
}) {
  const params = await searchParams;
  const mode = params.mode === "signup" ? "signup" : "signin";
  const action = mode === "signup" ? signUp : signIn;
  const configured = isSupabaseConfigured();
  const next = params.next ?? "/";

  return (
    <main className="min-h-[100dvh] flex items-center justify-center px-margin-mobile py-lg">
      <div className="w-full max-w-md space-y-lg">
        <section className="bg-gradient-to-br from-primary-container to-primary text-white rounded-3xl p-lg shadow-soft-purple-lg relative overflow-hidden">
          <Icon
            name="auto_awesome"
            filled
            className="text-3xl mb-md text-white/90"
          />
          <h1 className="text-headline-lg">
            {mode === "signup"
              ? "Start a quiet routine."
              : "Welcome back."}
          </h1>
          <p className="text-body-md opacity-90 mt-2">
            {mode === "signup"
              ? "Build small habits that compound into something meaningful."
              : "Your habits and streaks are waiting."}
          </p>
        </section>

        {!configured ? (
          <div className="bg-error-container text-on-error-container rounded-xl p-md text-label-sm space-y-2">
            <p className="font-bold flex items-center gap-2">
              <Icon name="warning" filled />
              Setup required
            </p>
            <p>
              Supabase isn&apos;t configured. Copy{" "}
              <code className="font-mono text-[12px] bg-white/60 px-1 rounded">
                .env.local.example
              </code>{" "}
              to{" "}
              <code className="font-mono text-[12px] bg-white/60 px-1 rounded">
                .env.local
              </code>
              , add your project URL and anon key, run{" "}
              <code className="font-mono text-[12px] bg-white/60 px-1 rounded">
                supabase/schema.sql
              </code>
              , then restart{" "}
              <code className="font-mono text-[12px] bg-white/60 px-1 rounded">
                npm run dev
              </code>
              .
            </p>
          </div>
        ) : null}

        {params.error ? (
          <div className="bg-error-container text-on-error-container rounded-xl p-md text-label-sm">
            {params.error}
          </div>
        ) : null}

        {params.info ? (
          <div className="bg-secondary-container text-on-secondary-container rounded-xl p-md text-label-sm">
            {params.info}
          </div>
        ) : null}

        <form
          action={action}
          className="bg-white rounded-xl p-lg shadow-soft-purple-md space-y-md"
        >
          <input type="hidden" name="next" value={next} />
          <label className="block">
            <span className="text-label-lg text-on-surface-variant">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@email.com"
              className="mt-2 w-full bg-surface-container-low text-on-background rounded-lg px-md py-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <label className="block">
            <span className="text-label-lg text-on-surface-variant">
              Password
            </span>
            <input
              name="password"
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              placeholder="••••••••"
              className="mt-2 w-full bg-surface-container-low text-on-background rounded-lg px-md py-3 focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </label>
          <button
            type="submit"
            disabled={!configured}
            className="w-full py-md rounded-full bg-gradient-to-r from-primary to-primary-container text-white text-label-lg shadow-soft-purple-lg active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {mode === "signup" ? "Create account" : "Sign in"}
          </button>
          <p className="text-center text-label-sm text-on-surface-variant">
            {mode === "signup" ? (
              <>
                Have an account?{" "}
                <Link href="/login" className="text-primary font-semibold">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New here?{" "}
                <Link
                  href="/login?mode=signup"
                  className="text-primary font-semibold"
                >
                  Create account
                </Link>
              </>
            )}
          </p>
        </form>
      </div>
    </main>
  );
}
