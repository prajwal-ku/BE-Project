"use client"

import { Card } from "@/components/ui/card"
import { Sprout, Truck, Warehouse, Store, User } from "lucide-react"

const stages = [
  { icon: Sprout, label: "Farm", active: false },
  { icon: Truck, label: "Transport", active: false },
  { icon: Warehouse, label: "Warehouse", active: true },
  { icon: Store, label: "Retail", active: false },
  { icon: User, label: "Consumer", active: false },
]

export function WorkflowVisualizer() {
  return (
    <Card className="border-border/50 bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground mb-6">Workflow Visualizer</h2>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute top-8 left-0 right-0 h-0.5 bg-border" />
        <div className="absolute top-8 left-0 w-1/2 h-0.5 bg-primary" />

        {/* Stages */}
        <div className="relative flex justify-between">
          {stages.map((stage, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <div
                className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all ${
                  stage.active
                    ? "border-primary bg-primary text-white shadow-lg shadow-primary/50"
                    : "border-border bg-card text-muted-foreground"
                }`}
              >
                <stage.icon className="h-6 w-6" />
              </div>
              <span className={`text-xs font-medium ${stage.active ? "text-foreground" : "text-muted-foreground"}`}>
                {stage.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
