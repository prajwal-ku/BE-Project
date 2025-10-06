import { Sprout, LayoutDashboard, ScanLine, ShieldCheck, Database, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

export function Navigation() {
  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-emerald-teal">
              <Sprout className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">KrishiSetu</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <ScanLine className="h-4 w-4" />
              Track Product
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Verify
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Database className="h-4 w-4" />
              Blockchain Explorer
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Admin
            </Button>
          </div>

          {/* Login Button */}
          <Button className="gradient-indigo-purple text-white hover:opacity-90 transition-opacity">
            Login / Register
          </Button>
        </div>
      </div>
    </nav>
  )
}
