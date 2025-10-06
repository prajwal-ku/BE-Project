import { Tractor, Users, Link2, QrCode } from "lucide-react"
import { Card } from "@/components/ui/card"

const stats = [
  {
    title: "Total Produce Tracked",
    value: "15,842",
    icon: Tractor,
    gradient: "gradient-emerald-teal",
  },
  {
    title: "Active Supply Partners",
    value: "428",
    icon: Users,
    gradient: "gradient-indigo-purple",
  },
  {
    title: "Blockchain Transactions",
    value: "89,156",
    icon: Link2,
    gradient: "gradient-emerald-teal",
  },
  {
    title: "QR Codes Generated",
    value: "12,907",
    icon: QrCode,
    gradient: "gradient-indigo-purple",
  },
]

export function OverviewCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card
          key={stat.title}
          className="relative overflow-hidden border-border/50 bg-card hover:border-primary/50 transition-all duration-300 card-glow"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${stat.gradient}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{stat.title}</p>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
