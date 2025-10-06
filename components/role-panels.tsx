import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sprout, Truck, Store, User } from "lucide-react"

const roles = [
  {
    title: "Farmer",
    icon: Sprout,
    actions: ["Register Produce", "Upload Certificates", "View Products"],
    gradient: "gradient-emerald-teal",
  },
  {
    title: "Distributor",
    icon: Truck,
    actions: ["Record Shipment", "Update Conditions", "Transfer Ownership"],
    gradient: "gradient-indigo-purple",
  },
  {
    title: "Retailer",
    icon: Store,
    actions: ["Update Pricing", "Record Sales", "Inventory Management"],
    gradient: "gradient-emerald-teal",
  },
  {
    title: "Consumer",
    icon: User,
    actions: ["Scan QR", "Verify Product", "View History"],
    gradient: "gradient-indigo-purple",
  },
]

export function RolePanels() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Role-Specific Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => (
          <Card key={role.title} className="border-border/50 bg-card p-6 hover:border-primary/50 transition-all">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${role.gradient} mb-4`}>
              <role.icon className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-4">{role.title}</h3>
            <div className="space-y-2">
              {role.actions.map((action) => (
                <Button
                  key={action}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-sm bg-transparent"
                >
                  {action}
                </Button>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
