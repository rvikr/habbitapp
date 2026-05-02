import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./icon";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { avatarFromUser } from "@/lib/avatar";

type Props = {
  title: string;
  back?: string;
  trailing?: ReactNode;
  avatarSrc?: string;
};

async function defaultAvatar(): Promise<string | undefined> {
  if (!isSupabaseConfigured()) return undefined;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return undefined;
    return avatarFromUser(user);
  } catch {
    return undefined;
  }
}

export async function TopAppBar({ title, back, trailing, avatarSrc }: Props) {
  const src = avatarSrc ?? (await defaultAvatar());
  return (
    <header className="top-app-bar">
      <div className="flex justify-between items-center w-full px-6 py-4">
        <div className="flex items-center gap-3">
          {back ? (
            <Link
              href={back}
              className="active:scale-95 transition-transform duration-200 hover:opacity-80"
              aria-label="Back"
            >
              <Icon name="arrow_back" className="text-primary" />
            </Link>
          ) : (
            <Link
              href="/settings/profile"
              className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 active:scale-95 transition-transform"
              aria-label="Open profile"
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt="Profile"
                  className="w-full h-full object-cover bg-primary-fixed"
                />
              ) : (
                <div className="w-full h-full bg-primary-fixed flex items-center justify-center text-primary text-label-lg font-bold">
                  ?
                </div>
              )}
            </Link>
          )}
          <h1 className="font-semibold text-lg text-primary">{title}</h1>
        </div>
        <div className="flex items-center gap-3">{trailing}</div>
      </div>
    </header>
  );
}
