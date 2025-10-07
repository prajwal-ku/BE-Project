"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  BarChart3, 
  Users, 
  Package, 
  DollarSign, 
  Building,
  Settings,
  LogOut,
  Bell,
  Truck,
  Store,
  UserPlus,
  FileText,
  Shield
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button" // Add this import

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState(3)
  const router = useRouter()
  const supabase = createClient()

  // Check authentication and prevent back navigation after logout
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

    // Prevent back navigation to dashboard after logout
    const handlePopState = (event: PopStateEvent) => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (!user) {
          // If user is logged out and tries to go back to dashboard, redirect to login
          router.replace("/auth/login")
        }
      })
    }

    window.addEventListener('popstate', handlePopState)
    
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [router, supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    // Replace history to prevent back navigation
    router.replace("/auth/login")
  }

  const stats = [
    { label: "Total Farmers", value: "73", change: "+23%", previous: "35", icon: Users },
    { label: "Active Manufacturers", value: "35", change: "+12%", previous: "97", icon: Package },
    { label: "This Month Orders", value: "237", change: "+31%", previous: "187", icon: FileText },
  ]

  const platformStats = [
    { label: "Total Users", value: "1,234", description: "Registered users" },
    { label: "Active Orders", value: "89", description: "In progress" },
    { label: "Products", value: "456", description: "Listed items" },
    { label: "Revenue", value: "₹2.3L", description: "This month" },
  ]

  const recentActivities = [
    { action: "New farmer registration", time: "2 min ago", user: "John Doe" },
    { action: "Order #1234 completed", time: "5 min ago", user: "Fresh Farms" },
    { action: "New product added", time: "10 min ago", user: "Agro Products" },
    { action: "Payment received", time: "15 min ago", user: "Green Distributors" },
  ]

  // Mock functions for different actions
  const handleViewFarmers = () => {
    setActiveTab("farmers")
    // In real app, you would fetch farmers data here
  }

  const handleViewManufacturers = () => {
    setActiveTab("manufacturers")
    // In real app, you would fetch manufacturers data here
  }

  const handleViewOrders = () => {
    // This would navigate to orders page or show orders modal
    alert("Viewing all orders...")
  }

  const handleSettings = () => {
    setActiveTab("settings")
    // In real app, you would show settings modal/page
  }

  const handleNotifications = () => {
    setNotifications(0)
    alert("Showing notifications...")
  }

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
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">KrishiSetu</h1>
              <p className="text-sm text-muted-foreground">Admin Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3, action: () => setActiveTab("dashboard") },
              { id: "farmers", label: "Farmers", icon: Users, action: handleViewFarmers },
              { id: "manufacturers", label: "Manufacturers", icon: Package, action: handleViewManufacturers },
              { id: "distributors", label: "Distributors", icon: Truck, action: () => setActiveTab("distributors") },
              { id: "retailers", label: "Retailers", icon: Store, action: () => setActiveTab("retailers") },
              { id: "billing", label: "Billing System", icon: DollarSign, action: () => setActiveTab("billing") },
              { id: "users", label: "User Management", icon: UserPlus, action: () => setActiveTab("users") },
              { id: "security", label: "Security", icon: Shield, action: () => setActiveTab("security") },
            ].map((item) => (
              <button
                key={item.id}
                onClick={item.action}
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
        {/* Header */}
        <header className="bg-card/50 backdrop-blur border-b border-border">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {activeTab === "dashboard" && "Admin Dashboard"}
                  {activeTab === "farmers" && "Farmers Management"}
                  {activeTab === "manufacturers" && "Manufacturers"}
                  {activeTab === "distributors" && "Distributors"}
                  {activeTab === "retailers" && "Retailers"}
                  {activeTab === "billing" && "Billing System"}
                  {activeTab === "users" && "User Management"}
                  {activeTab === "security" && "Security Settings"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "dashboard" && "Platform Overview & Analytics"}
                  {activeTab !== "dashboard" && `Manage ${activeTab} on the platform`}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={handleNotifications}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors relative"
                >
                  <Bell className="h-5 w-5" />
                  {notifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications}
                    </span>
                  )}
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-medium">
                    {user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={handleSettings}
                      className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                    >
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

        {/* Main Content Area */}
        <main className="flex-1 p-6">
          {activeTab === "dashboard" && (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, index) => (
                  <div 
                    key={index} 
                    className="bg-card/50 backdrop-blur rounded-xl border border-border p-6 hover:shadow-lg transition-all cursor-pointer"
                    onClick={stat.label.includes("Farmers") ? handleViewFarmers : stat.label.includes("Manufacturers") ? handleViewManufacturers : handleViewOrders}
                  >
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
                {/* Recent Activities */}
                <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activities</h3>
                  <div className="space-y-4">
                    {recentActivities.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 hover:bg-accent rounded-lg transition-colors">
                        <div>
                          <p className="text-sm font-medium text-foreground">{activity.action}</p>
                          <p className="text-xs text-muted-foreground">by {activity.user}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total Revenue */}
                <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Total Revenue</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-foreground">₹35k</p>
                      <p className="text-sm text-muted-foreground mt-1">this week</p>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Farmers:</span>
                          <span className="text-foreground font-medium">₹12,500</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Manufacturers:</span>
                          <span className="text-foreground font-medium">₹15,200</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Retailers:</span>
                          <span className="text-foreground font-medium">₹7,300</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                      ₹35k
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Stats */}
              <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
                <h3 className="text-lg font-semibold text-foreground mb-6">Platform Overview</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {platformStats.map((stat, index) => (
                    <div key={index} className="text-center group cursor-pointer p-4 hover:bg-accent rounded-lg transition-colors">
                      <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold text-sm">{stat.value}</span>
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Other Tabs Content */}
          {activeTab !== "dashboard" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
                </h3>
                <p className="text-muted-foreground mb-6">
                  {activeTab === "farmers" && "Manage farmers, view their products, and track orders."}
                  {activeTab === "manufacturers" && "Monitor manufacturers and their production activities."}
                  {activeTab === "distributors" && "Oversee distribution network and logistics."}
                  {activeTab === "retailers" && "Manage retail partners and their inventory."}
                  {activeTab === "billing" && "Handle billing, invoices, and payment processing."}
                  {activeTab === "users" && "Manage user accounts, roles, and permissions."}
                  {activeTab === "security" && "Configure security settings and access controls."}
                </p>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  Manage {activeTab}
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}