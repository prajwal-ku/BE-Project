import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Copy, Database, HardDrive } from "lucide-react"

export function BlockchainWidgets() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Blockchain Integration</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Smart Contract Status */}
        <Card className="border-border/50 bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Smart Contract</span>
            <CheckCircle2 className="h-5 w-5 text-[#16a34a]" />
          </div>
          <Badge className="bg-[#16a34a] text-white">Operational</Badge>
        </Card>

        {/* Latest Block */}
        <Card className="border-border/50 bg-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">Latest Block</span>
          </div>
          <p className="text-2xl font-bold text-foreground">#18,452</p>
        </Card>

        {/* Recent Transaction */}
        <Card className="border-border/50 bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Recent Tx Hash</span>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs font-mono text-primary truncate">0x7a9f...3c2d</p>
        </Card>

        {/* IPFS Status */}
        <Card className="border-border/50 bg-card p-6">
          <div className="flex items-center gap-2 mb-2">
            <HardDrive className="h-5 w-5 text-secondary" />
            <span className="text-sm text-muted-foreground">IPFS Status</span>
          </div>
          <Badge className="bg-[#16a34a] text-white">Connected</Badge>
        </Card>
      </div>
    </div>
  )
}
