"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  BarChart3, 
  Package, 
  DollarSign, 
  Factory,
  Settings,
  LogOut,
  Bell,
  Warehouse,
  Users,
  Truck,
  TrendingUp,
  Cog
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function ManufacturerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  // Prevent browser navigation from affecting tabs
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      event.preventDefault()
      window.history.pushState(null, '', window.location.href)
    }

    window.history.replaceState({ tab: activeTab }, '', window.location.href)
    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [activeTab])

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/auth/login")
        return
      }
      setUser(user)
    }
    checkAuth()
  }, [router, supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/auth/login")
  }

  const handleTabChange = (tabId: string) => {
    window.history.pushState({ tab: tabId }, '', window.location.href)
    setActiveTab(tabId)
  }

  // Manufacturer-specific stats
  const productionStats = [
    { label: "Products Made", value: "245", change: "+15%", previous: "198", icon: Package },
    { label: "Raw Material Stock", value: "1.2T", change: "-8%", previous: "1.3T", icon: Warehouse },
    { label: "Monthly Revenue", value: "₹1.2L", change: "+22%", previous: "₹89k", icon: TrendingUp },
  ]

  const productionQueue = [
    { product: "Wheat Flour", quantity: "500 bags", status: "In Progress", deadline: "2 days" },
    { product: "Rice Packages", quantity: "300 units", status: "Pending", deadline: "5 days" },
    { product: "Oil Bottles", quantity: "200 units", status: "Completed", deadline: "Completed" },
  ]

  const supplierOrders = [
    { supplier: "Green Farms", material: "Wheat", quantity: "2T", status: "Delivered" },
    { supplier: "Fresh Crops", material: "Rice", quantity: "1.5T", status: "In Transit" },
    { supplier: "Organic Valley", material: "Oil Seeds", quantity: "800 kg", status: "Processing" },
  ]

  if (!user) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background dark flex">
      <aside className="w-64 bg-card/50 backdrop-blur border-r border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Factory className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">KrishiSetu</h1>
              <p className="text-sm text-muted-foreground">Manufacturer Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            {[
              { id: "dashboard", label: "Production Dashboard", icon: BarChart3 },
              { id: "production", label: "Production Line", icon: Cog },
              { id: "inventory", label: "Inventory", icon: Warehouse },
              { id: "suppliers", label: "Suppliers", icon: Users },
              { id: "orders", label: "Customer Orders", icon: Package },
              { id: "shipping", label: "Shipping", icon: Truck },
              { id: "revenue", label: "Revenue", icon: DollarSign },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-card/50 backdrop-blur border-b border-border">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {activeTab === "dashboard" && "Production Dashboard"}
                  {activeTab === "production" && "Production Line"}
                  {activeTab === "inventory" && "Inventory Management"}
                  {activeTab === "suppliers" && "Suppliers"}
                  {activeTab === "orders" && "Customer Orders"}
                  {activeTab === "shipping" && "Shipping & Logistics"}
                  {activeTab === "revenue" && "Revenue Analytics"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "dashboard" && "Monitor manufacturing and production metrics"}
                  {activeTab === "production" && "Manage production lines and schedules"}
                  {activeTab === "inventory" && "Track raw materials and finished goods"}
                  {activeTab === "suppliers" && "Manage supplier relationships and orders"}
                  {activeTab === "orders" && "Process and fulfill customer orders"}
                  {activeTab === "shipping" && "Manage logistics and deliveries"}
                  {activeTab === "revenue" && "Analyze sales and revenue performance"}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Bell className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-medium">
                    M
                  </div>
                  <div className="flex gap-1">
                    <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                      <Settings className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={handleLogout}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          {activeTab === "dashboard" && (
            <>
              {/* Production Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {productionStats.map((stat, index) => (
                  <div key={index} className="bg-card/50 backdrop-blur rounded-xl border border-border p-6 hover:shadow-lg transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                        <stat.icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <span className="text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                        {stat.change}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">Previous: {stat.previous}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Production Queue */}
                <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Production Queue</h3>
                  <div className="space-y-3">
                    {productionQueue.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 hover:bg-accent rounded-lg transition-colors">
                        <div>
                          <p className="font-medium text-foreground">{item.product}</p>
                          <p className="text-sm text-muted-foreground">{item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.status === 'Completed' ? 'bg-green-500/20 text-green-600' :
                            item.status === 'In Progress' ? 'bg-yellow-500/20 text-yellow-600' :
                            'bg-blue-500/20 text-blue-600'
                          }`}>
                            {item.status}
                          </span>
                          <p className="text-sm text-muted-foreground mt-1">{item.deadline}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supplier Orders */}
                <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Supplier Orders</h3>
                  <div className="space-y-3">
                    {supplierOrders.map((order, index) => (
                      <div key={index} className="p-3 hover:bg-accent rounded-lg transition-colors border-l-4 border-emerald-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-foreground">{order.supplier}</p>
                            <p className="text-sm text-muted-foreground">{order.material} • {order.quantity}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'Delivered' ? 'bg-green-500/20 text-green-600' :
                            order.status === 'In Transit' ? 'bg-yellow-500/20 text-yellow-600' :
                            'bg-blue-500/20 text-blue-600'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Start Production", icon: Cog, action: () => handleTabChange("production") },
                    { label: "Check Inventory", icon: Warehouse, action: () => handleTabChange("inventory") },
                    { label: "View Orders", icon: Package, action: () => handleTabChange("orders") },
                    { label: "Shipping", icon: Truck, action: () => handleTabChange("shipping") },
                  ].map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className="p-4 bg-accent hover:bg-accent/80 rounded-lg transition-colors text-center"
                    >
                      <action.icon className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">{action.label}</p>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === "production" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <Cog className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Production Line Management</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Manage your production lines, monitor manufacturing processes, 
                  schedule production runs, and optimize manufacturing efficiency.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">3</p>
                    <p className="text-sm text-muted-foreground">Active Lines</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">85%</p>
                    <p className="text-sm text-muted-foreground">Efficiency</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">245</p>
                    <p className="text-sm text-muted-foreground">Today's Output</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <Warehouse className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Inventory Management</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Track raw materials, monitor finished goods inventory, 
                  manage stock levels, and optimize inventory turnover.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="p-6 bg-accent rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Raw Materials</h3>
                    <p className="text-3xl font-bold text-emerald-500">1.2T</p>
                    <p className="text-sm text-muted-foreground">In stock</p>
                  </div>
                  <div className="p-6 bg-accent rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Finished Goods</h3>
                    <p className="text-3xl font-bold text-emerald-500">890</p>
                    <p className="text-sm text-muted-foreground">Units ready</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "suppliers" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Supplier Management</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Manage your supplier relationships, track material orders, 
                  monitor delivery schedules, and maintain supply chain efficiency.
                </p>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  View All Suppliers
                </Button>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <Package className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Customer Orders</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Process customer orders, track order fulfillment, 
                  manage order status, and ensure timely delivery to clients.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">45</p>
                    <p className="text-sm text-muted-foreground">Pending Orders</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">28</p>
                    <p className="text-sm text-muted-foreground">In Production</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">67</p>
                    <p className="text-sm text-muted-foreground">Completed Today</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <Truck className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Shipping & Logistics</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Manage product shipping, track deliveries, coordinate logistics, 
                  and ensure efficient distribution to customers and retailers.
                </p>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  Track Shipments
                </Button>
              </div>
            </div>
          )}

          {activeTab === "revenue" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <DollarSign className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Revenue Analytics</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Analyze your sales performance, track revenue streams, 
                  monitor profit margins, and make data-driven business decisions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="p-6 bg-accent rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-2">This Month</h3>
                    <p className="text-3xl font-bold text-emerald-500">₹1.2L</p>
                    <p className="text-sm text-muted-foreground">+22% from last month</p>
                  </div>
                  <div className="p-6 bg-accent rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Total Revenue</h3>
                    <p className="text-3xl font-bold text-emerald-500">₹8.7L</p>
                    <p className="text-sm text-muted-foreground">Year to date</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}