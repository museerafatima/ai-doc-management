// frontend/app/components/ui.tsx
// A tiny shared kit so login / dashboard / workspace pages look consistent
// instead of each page hand-rolling its own buttons and badges.

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  const base = 'text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const styles = {
    primary: 'bg-brand hover:bg-brand-dark text-white',
    ghost: 'bg-transparent hover:bg-foreground/5 text-foreground border border-line',
    danger: 'bg-danger hover:bg-danger/90 text-white',
  }
  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}

const ROLE_STYLES: Record<string, string> = {
  admin: 'bg-accent/15 text-accent',
  editor: 'bg-brand/10 text-brand',
  viewer: 'bg-foreground/5 text-muted',
}

export function RoleBadge({ role }: { role: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${ROLE_STYLES[role] ?? ROLE_STYLES.viewer}`}>
      {role}
    </span>
  )
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-brand text-white text-xs font-semibold flex items-center justify-center flex-shrink-0">
      {initials || '?'}
    </div>
  )
}

export function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="text-center py-14 px-6">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="text-xs text-muted mt-1">{subtitle}</p>
    </div>
  )
}