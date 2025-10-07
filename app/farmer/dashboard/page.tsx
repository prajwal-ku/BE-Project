"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  BarChart3, 
  Package, 
  Truck, 
  DollarSign, 
  Sprout,
  Settings,
  LogOut,
  Bell,
  Calendar,
  TrendingUp,
  Crop
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function FarmerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  // Prevent browser navigation from affecting tabs
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // When user clicks browser back/forward, prevent it from changing tabs
      // and maintain the current active tab
      event.preventDefault()
      window.history.pushState(null, '', window.location.href)
    }

    // Add to browser history when tab changes
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
    // Clear history and redirect to login
    router.replace("/auth/login")
  }

  const handleTabChange = (tabId: string) => {
    // Add to browser history when changing tabs
    window.history.pushState({ tab: tabId }, '', window.location.href)
    setActiveTab(tabId)
  }

  // Farmer-specific stats
  const farmStats = [
    { label: "Active Crops", value: "8", change: "+2", previous: "6", icon: Crop },
    { label: "Pending Orders", value: "12", change: "+5", previous: "7", icon: Package },
    { label: "Monthly Revenue", value: "₹85k", change: "+18%", previous: "₹72k", icon: TrendingUp },
  ]

  const cropInventory = [
    { crop: "Wheat", quantity: "500 kg", price: "₹25/kg", status: "Ready" },
    { crop: "Rice", quantity: "300 kg", price: "₹35/kg", status: "Ready" },
    { crop: "Tomatoes", quantity: "150 kg", price: "₹40/kg", status: "Harvesting" },
    { crop: "Potatoes", quantity: "200 kg", price: "₹20/kg", status: "Stored" },
  ]

  const upcomingTasks = [
    { task: "Harvest Wheat", date: "Tomorrow", priority: "High" },
    { task: "Fertilize Rice Field", date: "In 3 days", priority: "Medium" },
    { task: "Market Delivery", date: "Next Week", priority: "High" },
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
      {/* Sidebar */}
      <aside className="w-64 bg-card/50 backdrop-blur border-r border-border">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Sprout className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">KrishiSetu</h1>
              <p className="text-sm text-muted-foreground">Farmer Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            {[
              { id: "dashboard", label: "Farm Dashboard", icon: BarChart3 },
              { id: "crops", label: "My Crops", icon: Crop },
              { id: "orders", label: "Orders", icon: Package },
              { id: "schedule", label: "Farming Schedule", icon: Calendar },
              { id: "revenue", label: "Revenue & Sales", icon: DollarSign },
              { id: "delivery", label: "Delivery Tracking", icon: Truck },
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-card/50 backdrop-blur border-b border-border">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {activeTab === "dashboard" && "Farm Dashboard"}
                  {activeTab === "crops" && "My Crops"}
                  {activeTab === "orders" && "Orders"}
                  {activeTab === "schedule" && "Farming Schedule"}
                  {activeTab === "revenue" && "Revenue & Sales"}
                  {activeTab === "delivery" && "Delivery Tracking"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "dashboard" && "Manage your crops and track sales"}
                  {activeTab === "crops" && "Manage your crop inventory and growth"}
                  {activeTab === "orders" && "View and manage your orders"}
                  {activeTab === "schedule" && "Plan your farming activities"}
                  {activeTab === "revenue" && "Track your sales and revenue"}
                  {activeTab === "delivery" && "Monitor product delivery"}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Bell className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-medium">
                    F
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
              {/* Farm Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {farmStats.map((stat, index) => (
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
                {/* Crop Inventory */}
                <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Crop Inventory</h3>
                  <div className="space-y-3">
                    {cropInventory.map((crop, index) => (
                      <div key={index} className="flex justify-between items-center p-3 hover:bg-accent rounded-lg transition-colors">
                        <div>
                          <p className="font-medium text-foreground">{crop.crop}</p>
                          <p className="text-sm text-muted-foreground">{crop.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">{crop.price}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            crop.status === 'Ready' ? 'bg-green-500/20 text-green-600' :
                            crop.status === 'Harvesting' ? 'bg-yellow-500/20 text-yellow-600' :
                            'bg-blue-500/20 text-blue-600'
                          }`}>
                            {crop.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Tasks */}
                <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Upcoming Tasks</h3>
                  <div className="space-y-3">
                    {upcomingTasks.map((task, index) => (
                      <div key={index} className="p-3 hover:bg-accent rounded-lg transition-colors border-l-4 border-emerald-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-foreground">{task.task}</p>
                            <p className="text-sm text-muted-foreground">Due: {task.date}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            task.priority === 'High' ? 'bg-red-500/20 text-red-600' : 'bg-yellow-500/20 text-yellow-600'
                          }`}>
                            {task.priority}
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
                    { label: "Add New Crop", icon: Crop, action: () => handleTabChange("crops") },
                    { label: "View Orders", icon: Package, action: () => handleTabChange("orders") },
                    { label: "Schedule", icon: Calendar, action: () => handleTabChange("schedule") },
                    { label: "Sales Report", icon: DollarSign, action: () => handleTabChange("revenue") },
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

          {activeTab === "crops" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <Crop className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">My Crops Management</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Manage your crop inventory, track growth progress, update quantities, 
                  and monitor the status of all your agricultural products.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">8</p>
                    <p className="text-sm text-muted-foreground">Active Crops</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">1.15T</p>
                    <p className="text-sm text-muted-foreground">Total Quantity</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">4</p>
                    <p className="text-sm text-muted-foreground">Ready for Sale</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <Package className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Orders Management</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  View and manage all your product orders, track order status, 
                  process new orders, and communicate with buyers.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">12</p>
                    <p className="text-sm text-muted-foreground">Pending Orders</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">8</p>
                    <p className="text-sm text-muted-foreground">Completed Today</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">₹45K</p>
                    <p className="text-sm text-muted-foreground">Today's Revenue</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "schedule" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Farming Schedule</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Plan your farming activities, set reminders for important tasks, 
                  and optimize your agricultural operations with smart scheduling.
                </p>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  View Full Calendar
                </Button>
              </div>
            </div>
          )}

          {activeTab === "revenue" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <DollarSign className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Revenue & Sales</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Track your sales performance, analyze revenue patterns, 
                  generate financial reports, and monitor your business growth.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="p-6 bg-accent rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-2">This Month</h3>
                    <p className="text-3xl font-bold text-emerald-500">₹85,000</p>
                    <p className="text-sm text-muted-foreground">+18% from last month</p>
                  </div>
                  <div className="p-6 bg-accent rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Total Revenue</h3>
                    <p className="text-3xl font-bold text-emerald-500">₹4.2L</p>
                    <p className="text-sm text-muted-foreground">Year to date</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "delivery" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <Truck className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Delivery Tracking</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Monitor your product deliveries in real-time, track shipment status, 
                  manage logistics, and ensure timely delivery to your customers.
                </p>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  Track All Deliveries
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}