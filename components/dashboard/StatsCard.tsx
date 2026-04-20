interface StatsCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext?: string
}

export function StatsCard({ icon, label, value, subtext }: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-colors hover:bg-white/[0.07]">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-sm font-medium text-white/60">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-white">{value}</p>
      {subtext && <p className="mt-2 text-sm text-white/50">{subtext}</p>}
    </div>
  )
}
