interface StatsCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtext?: string
}

export function StatsCard({ icon, label, value, subtext }: StatsCardProps) {
  return (
    <div className="group relative p-6 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="relative">
        <div className="flex items-start justify-between mb-3">
          <div className="p-3 rounded-xl bg-primary/10 text-primary border border-primary/20 group-hover:scale-110 transition-transform">
            {icon}
          </div>
        </div>
        <div>
          <p className="text-sm font-medium text-white/70 mb-2">{label}</p>
          <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
          {subtext && (
            <p className="text-sm text-white/60 mt-2">{subtext}</p>
          )}
        </div>
      </div>
    </div>
  )
}