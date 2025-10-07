"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  BarChart3, 
  Package, 
  DollarSign, 
  Truck,
  Settings,
  LogOut,
  Bell,
  Warehouse,
  Users,
  MapPin,
  TrendingUp,
  ClipboardList
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function DistributorDashboard() {
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

  // Distributor-specific stats
  const distributionStats = [
    { label: "Active Deliveries", value: "23", change: "+5", previous: "18", icon: Truck },
    { label: "Warehouse Stock", value: "4.5T", change: "-12%", previous: "5.1T", icon: Warehouse },
    { label: "Monthly Revenue", value: "₹2.1L", change: "+15%", previous: "₹1.8L", icon: TrendingUp },
  ]

  const deliverySchedule = [
    { route: "City Center", vehicle: "Truck #D-102", status: "In Transit", eta: "2 hours" },
    { route: "Industrial Area", vehicle: "Van #D-205", status: "Loading", eta: "1 hour" },
    { route: "Suburban", vehicle: "Truck #D-108", status: "Delivered", eta: "Completed" },
  ]

  const inventoryLevels = [
    { product: "Wheat Flour", current: "800 bags", threshold: "200 bags", status: "Good" },
    { product: "Rice Packages", current: "450 units", threshold: "100 units", status: "Good" },
    { product: "Cooking Oil", current: "120 units", threshold: "50 units", status: "Low" },
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
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">KrishiSetu</h1>
              <p className="text-sm text-muted-foreground">Distributor Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            {[
              { id: "dashboard", label: "Distribution Dashboard", icon: BarChart3 },
              { id: "deliveries", label: "Deliveries", icon: Truck },
              { id: "inventory", label: "Inventory", icon: Warehouse },
              { id: "routes", label: "Delivery Routes", icon: MapPin },
              { id: "retailers", label: "Retailers", icon: Users },
              { id: "orders", label: "Purchase Orders", icon: ClipboardList },
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
                  {activeTab === "dashboard" && "Distribution Dashboard"}
                  {activeTab === "deliveries" && "Delivery Management"}
                  {activeTab === "inventory" && "Inventory Management"}
                  {activeTab === "routes" && "Delivery Routes"}
                  {activeTab === "retailers" && "Retailer Network"}
                  {activeTab === "orders" && "Purchase Orders"}
                  {activeTab === "revenue" && "Revenue Analytics"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "dashboard" && "Monitor distribution operations and logistics"}
                  {activeTab === "deliveries" && "Manage and track product deliveries"}
                  {activeTab === "inventory" && "Track warehouse stock and inventory levels"}
                  {activeTab === "routes" && "Optimize delivery routes and schedules"}
                  {activeTab === "retailers" && "Manage retailer relationships and orders"}
                  {activeTab === "orders" && "Process purchase orders from retailers"}
                  {activeTab === "revenue" && "Analyze distribution revenue and performance"}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Bell className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-medium">
                    D
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
              {/* Distribution Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {distributionStats.map((stat, index) => (
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
                {/* Delivery Schedule */}
                <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Today's Deliveries</h3>
                  <div className="space-y-3">
                    {deliverySchedule.map((delivery, index) => (
                      <div key={index} className="flex justify-between items-center p-3 hover:bg-accent rounded-lg transition-colors">
                        <div>
                          <p className="font-medium text-foreground">{delivery.route}</p>
                          <p className="text-sm text-muted-foreground">{delivery.vehicle}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            delivery.status === 'Delivered' ? 'bg-green-500/20 text-green-600' :
                            delivery.status === 'In Transit' ? 'bg-yellow-500/20 text-yellow-600' :
                            'bg-blue-500/20 text-blue-600'
                          }`}>
                            {delivery.status}
                          </span>
                          <p className="text-sm text-muted-foreground mt-1">{delivery.eta}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Inventory Levels */}
                <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Inventory Levels</h3>
                  <div className="space-y-3">
                    {inventoryLevels.map((item, index) => (
                      <div key={index} className="p-3 hover:bg-accent rounded-lg transition-colors border-l-4 border-emerald-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-foreground">{item.product}</p>
                            <p className="text-sm text-muted-foreground">Current: {item.current}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            item.status === 'Good' ? 'bg-green-500/20 text-green-600' : 'bg-red-500/20 text-red-600'
                          }`}>
                            {item.status} Stock
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
                    { label: "Schedule Delivery", icon: Truck, action: () => handleTabChange("deliveries") },
                    { label: "Check Inventory", icon: Warehouse, action: () => handleTabChange("inventory") },
                    { label: "View Routes", icon: MapPin, action: () => handleTabChange("routes") },
                    { label: "Retailer Orders", icon: ClipboardList, action: () => handleTabChange("orders") },
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

          {activeTab === "deliveries" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <Truck className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Delivery Management</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Schedule and track product deliveries, manage delivery vehicles, 
                  coordinate with drivers, and ensure timely distribution to retailers.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">23</p>
                    <p className="text-sm text-muted-foreground">Active Deliveries</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">8</p>
                    <p className="text-sm text-muted-foreground">Vehicles Active</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">45</p>
                    <p className="text-sm text-muted-foreground">Completed Today</p>
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
                  Monitor warehouse stock levels, track inventory movement, 
                  manage product storage, and optimize inventory distribution.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="p-6 bg-accent rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Total Stock</h3>
                    <p className="text-3xl font-bold text-emerald-500">4.5T</p>
                    <p className="text-sm text-muted-foreground">Across all products</p>
                  </div>
                  <div className="p-6 bg-accent rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Warehouse Capacity</h3>
                    <p className="text-3xl font-bold text-emerald-500">68%</p>
                    <p className="text-sm text-muted-foreground">Space utilized</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "routes" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <MapPin className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Delivery Routes</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Optimize delivery routes, plan efficient distribution paths, 
                  track route performance, and reduce delivery times and costs.
                </p>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  Optimize Routes
                </Button>
              </div>
            </div>
          )}

          {activeTab === "retailers" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Retailer Network</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Manage your retailer relationships, track order history, 
                  monitor performance, and expand your distribution network.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">45</p>
                    <p className="text-sm text-muted-foreground">Active Retailers</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">12</p>
                    <p className="text-sm text-muted-foreground">New This Month</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">98%</p>
                    <p className="text-sm text-muted-foreground">Satisfaction Rate</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <ClipboardList className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Purchase Orders</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Process purchase orders from retailers, track order fulfillment, 
                  manage order status, and ensure accurate order processing.
                </p>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  View All Orders
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
                  Analyze your distribution revenue, track profit margins, 
                  monitor operational costs, and optimize financial performance.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="p-6 bg-accent rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-2">This Month</h3>
                    <p className="text-3xl font-bold text-emerald-500">₹2.1L</p>
                    <p className="text-sm text-muted-foreground">+15% from last month</p>
                  </div>
                  <div className="p-6 bg-accent rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Total Revenue</h3>
                    <p className="text-3xl font-bold text-emerald-500">₹15.2L</p>
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