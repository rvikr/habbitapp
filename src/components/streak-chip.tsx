import { Icon } from "./icon";

type Tone = "secondary" | "tertiary";

const toneClasses: Record<Tone, { wrapper: string; icon: string; text: string }> = {
  secondary: {
    wrapper: "bg-secondary-fixed/30",
    icon: "text-secondary",
    text: "text-on-secondary-container",
  },
  tertiary: {
    wrapper: "bg-tertiary-fixed/30",
    icon: "text-tertiary",
    text: "text-on-tertiary-fixed-variant",
  },
};

export function StreakChip({
  icon,
  label,
  tone = "secondary",
  filled = true,
}: {
  icon: string;
  label: string;
  tone?: Tone;
  filled?: boolean;
}) {
  const t = toneClasses[tone];
  return (
    <div
      className={`flex-shrink-0 ${t.wrapper} px-4 py-2 rounded-xl flex items-center gap-2`}
    >
      <Icon name={icon} filled={filled} className={`${t.icon} text-sm`} />
      <span className={`text-label-lg ${t.text}`}>{label}</span>
    </div>
  );
}
