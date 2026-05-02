type Props = {
  name: string;
  filled?: boolean;
  className?: string;
};

export function Icon({ name, filled, className }: Props) {
  return (
    <span
      className={`material-symbols-outlined ${filled ? "icon-fill" : ""} ${className ?? ""}`}
      aria-hidden
    >
      {name}
    </span>
  );
}
