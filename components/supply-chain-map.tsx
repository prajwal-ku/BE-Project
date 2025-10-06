"use client"

import { Card } from "@/components/ui/card"
import { useEffect, useRef } from "react"

export function SupplyChainMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Node positions
    const nodes = [
      { x: 100, y: 150, label: "Farmer", color: "#16a34a" },
      { x: 250, y: 100, label: "Distributor", color: "#3b82f6" },
      { x: 400, y: 150, label: "Warehouse", color: "#f59e0b" },
      { x: 550, y: 100, label: "Retailer", color: "#f97316" },
      { x: 700, y: 150, label: "Consumer", color: "#8b5cf6" },
    ]

    let animationFrame = 0

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw connections
      ctx.strokeStyle = "#334155"
      ctx.lineWidth = 2
      for (let i = 0; i < nodes.length - 1; i++) {
        ctx.beginPath()
        ctx.moveTo(nodes[i].x, nodes[i].y)
        ctx.lineTo(nodes[i + 1].x, nodes[i + 1].y)
        ctx.stroke()
      }

      // Draw animated pulse
      const pulseNode = Math.floor(animationFrame / 60) % nodes.length
      const pulseProgress = (animationFrame % 60) / 60

      if (pulseNode < nodes.length - 1) {
        const startNode = nodes[pulseNode]
        const endNode = nodes[pulseNode + 1]
        const x = startNode.x + (endNode.x - startNode.x) * pulseProgress
        const y = startNode.y + (endNode.y - startNode.y) * pulseProgress

        ctx.beginPath()
        ctx.arc(x, y, 6, 0, Math.PI * 2)
        ctx.fillStyle = "#0d9488"
        ctx.fill()
      }

      // Draw nodes
      nodes.forEach((node) => {
        ctx.beginPath()
        ctx.arc(node.x, node.y, 20, 0, Math.PI * 2)
        ctx.fillStyle = node.color
        ctx.fill()

        ctx.fillStyle = "#f8fafc"
        ctx.font = "12px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(node.label, node.x, node.y + 40)
      })

      animationFrame++
      requestAnimationFrame(animate)
    }

    animate()
  }, [])

  return (
    <Card className="border-border/50 bg-card p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Live Supply Chain Map</h2>
      <div className="relative h-[300px] bg-background/50 rounded-lg overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    </Card>
  )
}
