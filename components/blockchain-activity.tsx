import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const activities = [
  { id: "PRD-8421", action: "Harvested", actor: "Farm #142", time: "2 min ago", status: "verified" },
  { id: "PRD-8420", action: "In Transit", actor: "Truck #89", time: "15 min ago", status: "in-transit" },
  { id: "PRD-8419", action: "Quality Check", actor: "Warehouse #5", time: "32 min ago", status: "pending" },
  { id: "PRD-8418", action: "Delivered", actor: "Store #234", time: "1 hr ago", status: "verified" },
  { id: "PRD-8417", action: "Packaged", actor: "Farm #98", time: "2 hr ago", status: "verified" },
  { id: "PRD-8416", action: "In Transit", actor: "Truck #45", time: "3 hr ago", status: "in-transit" },
]

const statusConfig = {
  verified: { label: "Verified", color: "bg-[#16a34a] text-white" },
  "in-transit": { label: "In Transit", color: "bg-[#f59e0b] text-white" },
  pending: { label: "Pending", color: "bg-[#f97316] text-white" },
}

export function BlockchainActivity() {
  return (
    <Card className="border-border/50 bg-card p-6 h-full">
      <h2 className="text-lg font-semibold text-foreground mb-4">Recent Blockchain Activity</h2>
      <div className="space-y-3">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className="flex items-start justify-between p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-mono text-primary">{activity.id}</span>
                <Badge className={statusConfig[activity.status as keyof typeof statusConfig].color}>
                  {statusConfig[activity.status as keyof typeof statusConfig].label}
                </Badge>
              </div>
              <p className="text-sm text-foreground font-medium">{activity.action}</p>
              <p className="text-xs text-muted-foreground">{activity.actor}</p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}
