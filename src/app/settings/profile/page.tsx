import { TopAppBar } from "@/components/top-app-bar";
import { Icon } from "@/components/icon";
import { AvatarPicker } from "@/components/avatar-picker";
import { createClient } from "@/lib/supabase/server";
import { type AvatarStyle, avatarFromUser } from "@/lib/avatar";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const email = user?.email ?? "";
  const createdAt = user?.created_at ?? null;
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const initialStyle = (meta.avatar_style as AvatarStyle) ?? "avataaars";
  const initialSeed =
    (meta.avatar_seed as string) || email.split("@")[0] || "Aspen";

  const fields: { label: string; value: string }[] = [
    { label: "Email", value: email },
    {
      label: "Member since",
      value: createdAt
        ? new Date(createdAt).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "—",
    },
  ];

  return (
    <>
      <TopAppBar
        title="Personal Info"
        back="/settings"
        avatarSrc={user ? avatarFromUser(user) : undefined}
      />
      <main className="max-w-screen-sm mx-auto px-margin-mobile pt-lg pb-xxl space-y-lg">
        <section className="bg-white rounded-xl p-lg shadow-soft-purple-md space-y-md">
          <h2 className="text-headline-md flex items-center gap-sm">
            <Icon name="badge" className="text-primary" />
            Profile
          </h2>
          <div className="space-y-3 pt-md border-t border-outline-variant/30">
            {fields.map((f) => (
              <div key={f.label} className="flex justify-between gap-md">
                <span className="text-label-sm text-outline">{f.label}</span>
                <span className="text-label-lg text-right truncate">
                  {f.value || "—"}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-xl p-lg shadow-soft-purple-md space-y-md">
          <h2 className="text-headline-md flex items-center gap-sm">
            <Icon name="face" className="text-primary" />
            Avatar
          </h2>
          <p className="text-label-sm text-outline">
            Pick a style and a seed — your avatar updates everywhere.
          </p>
          <AvatarPicker initialStyle={initialStyle} initialSeed={initialSeed} />
        </section>
      </main>
    </>
  );
}
