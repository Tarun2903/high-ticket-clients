import { Icon } from "@/components/Icon";

/** Clearly marked slot for assets the team must supply. Never ship fabricated media in its place. */
export function Placeholder({
  label,
  icon = "image",
  ratio = "4 / 3",
  className = "",
}: {
  label: string;
  icon?: string;
  ratio?: string;
  className?: string;
}) {
  return (
    <div className={`placeholder ${className}`} style={{ aspectRatio: ratio }} role="note">
      <Icon name={icon} size={28} />
      <span>{label}</span>
    </div>
  );
}
