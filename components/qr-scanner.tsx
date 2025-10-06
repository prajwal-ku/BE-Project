"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QrCode, ScanLine } from "lucide-react"

export function QRScanner() {
  return (
    <Card className="border-border/50 bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">QR Code Scanner</h2>

      <div className="space-y-4">
        {/* QR Placeholder */}
        <div className="relative h-48 bg-background/50 rounded-lg flex items-center justify-center border-2 border-dashed border-border">
          <div className="text-center">
            <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Scan QR Code</p>
          </div>

          {/* Animated scan line */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <ScanLine className="h-full w-full text-primary/20 animate-pulse" />
          </div>
        </div>

        {/* Input and Button */}
        <div className="flex gap-2">
          <Input placeholder="Enter Product ID" className="flex-1 bg-background border-border" />
          <Button className="gradient-emerald-teal text-white hover:opacity-90">Verify</Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <p className="text-2xl font-bold text-foreground">1,247</p>
            <p className="text-xs text-muted-foreground">Scans Today</p>
          </div>
          <div className="text-center p-3 bg-background/50 rounded-lg">
            <p className="text-2xl font-bold text-accent">98.5%</p>
            <p className="text-xs text-muted-foreground">Verification Rate</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
