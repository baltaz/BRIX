interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: number;
}

export function UserAvatar({ name, avatarUrl, size = 44 }: UserAvatarProps) {
  const initials = getInitials(name);

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="shrink-0 rounded-full border border-white/10 object-cover"
      />
    );
  }

  return (
    <div
      className="shrink-0 rounded-full border border-white/10 bg-white/10 text-sm font-bold text-white/80 flex items-center justify-center"
      style={{ width: size, height: size }}
      aria-label={name}
    >
      {initials}
    </div>
  );
}

function getInitials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "J";
  const parts = trimmed.split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "J";
}
