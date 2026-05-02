import { TopAppBar } from "@/components/top-app-bar";
import { Icon } from "@/components/icon";

const items = [
  {
    icon: "lock",
    title: "Password",
    body: "Change via your email — request a reset from the sign-in page.",
  },
  {
    icon: "key",
    title: "Active sessions",
    body: "All sessions sign out when you tap Log Out on the Settings screen.",
  },
  {
    icon: "shield_person",
    title: "Two-factor",
    body: "Coming soon — TOTP support is on the roadmap.",
  },
];

export default function SecurityPage() {
  return (
    <>
      <TopAppBar title="Security" back="/settings" />
      <main className="max-w-screen-sm mx-auto px-margin-mobile pt-lg pb-xxl space-y-md">
        <div className="bg-white rounded-xl p-md shadow-soft-purple-md divide-y divide-outline-variant/30">
          {items.map((item) => (
            <div key={item.title} className="flex items-start gap-md py-md first:pt-0 last:pb-0">
              <div className="p-sm bg-primary/10 rounded-lg text-primary flex-shrink-0">
                <Icon name={item.icon} />
              </div>
              <div>
                <p className="text-label-lg">{item.title}</p>
                <p className="text-label-sm text-outline">{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
