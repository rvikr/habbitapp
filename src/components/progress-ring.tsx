import { Icon } from "./icon";

type Props = {
  progress: number;
  size?: number;
  stroke?: number;
  icon?: string;
};

export function ProgressRing({
  progress,
  size = 112,
  stroke = 10,
  icon = "auto_awesome",
}: Props) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(progress, 0), 1));

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg className="-rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-surface-container-highest"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#5D3FD3"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 600ms ease-out" }}
        />
      </svg>
      <Icon name={icon} filled className="absolute text-primary text-3xl" />
    </div>
  );
}
