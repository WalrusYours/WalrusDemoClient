interface AvatarProps {
  name: string
  color: string
  size?: 'sm' | 'md'
}

export function Avatar({ name, color, size = 'md' }: AvatarProps) {
  const initial = name.charAt(0).toUpperCase()
  const sizeClasses = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm'

  return (
    <div
      className={`flex ${sizeClasses} shrink-0 items-center justify-center rounded-full ${color} font-semibold text-white`}
    >
      {initial}
    </div>
  )
}
