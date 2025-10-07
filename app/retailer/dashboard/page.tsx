"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  BarChart3, 
  Package, 
  DollarSign, 
  Store,
  Settings,
  LogOut,
  Bell,
  Users,
  TrendingUp,
  ShoppingCart,
  CreditCard,
  BarChart
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function RetailerDashboard() {
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

  // Retailer-specific stats
  const retailStats = [
    { label: "Daily Sales", value: "₹45k", change: "+12%", previous: "₹40k", icon: DollarSign },
    { label: "Inventory Items", value: "156", change: "+8", previous: "148", icon: Package },
    { label: "Customer Visits", value: "234", change: "+18%", previous: "198", icon: Users },
  ]

  const topProducts = [
    { product: "Wheat Flour", sales: "₹8,500", units: "85 bags", trend: "up" },
    { product: "Basmati Rice", sales: "₹7,200", units: "60 units", trend: "up" },
    { product: "Cooking Oil", sales: "₹6,800", units: "68 bottles", trend: "stable" },
  ]

  const recentTransactions = [
    { customer: "Regular Customer", amount: "₹1,200", items: "8", time: "10:30 AM" },
    { customer: "New Customer", amount: "₹850", items: "5", time: "11:15 AM" },
    { customer: "Bulk Order", amount: "₹3,500", items: "25", time: "09:45 AM" },
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
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">KrishiSetu</h1>
              <p className="text-sm text-muted-foreground">Retailer Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            {[
              { id: "dashboard", label: "Retail Dashboard", icon: BarChart3 },
              { id: "sales", label: "Sales", icon: ShoppingCart },
              { id: "inventory", label: "Inventory", icon: Package },
              { id: "customers", label: "Customers", icon: Users },
              { id: "analytics", label: "Analytics", icon: BarChart },
              { id: "orders", label: "Supplier Orders", icon: CreditCard },
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
                  {activeTab === "dashboard" && "Retail Dashboard"}
                  {activeTab === "sales" && "Sales Management"}
                  {activeTab === "inventory" && "Inventory Management"}
                  {activeTab === "customers" && "Customer Management"}
                  {activeTab === "analytics" && "Business Analytics"}
                  {activeTab === "orders" && "Supplier Orders"}
                  {activeTab === "revenue" && "Revenue Analytics"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {activeTab === "dashboard" && "Monitor retail operations and sales performance"}
                  {activeTab === "sales" && "Manage sales transactions and customer purchases"}
                  {activeTab === "inventory" && "Track product stock and manage inventory"}
                  {activeTab === "customers" && "Manage customer relationships and loyalty"}
                  {activeTab === "analytics" && "Analyze business performance and trends"}
                  {activeTab === "orders" && "Place and track orders with suppliers"}
                  {activeTab === "revenue" && "Monitor revenue and financial performance"}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Bell className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-medium">
                    R
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
              {/* Retail Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {retailStats.map((stat, index) => (
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
                {/* Top Products */}
                <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Top Selling Products</h3>
                  <div className="space-y-3">
                    {topProducts.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-3 hover:bg-accent rounded-lg transition-colors">
                        <div>
                          <p className="font-medium text-foreground">{product.product}</p>
                          <p className="text-sm text-muted-foreground">{product.units} sold</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">{product.sales}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            product.trend === 'up' ? 'bg-green-500/20 text-green-600' : 'bg-blue-500/20 text-blue-600'
                          }`}>
                            {product.trend === 'up' ? 'Trending ↑' : 'Stable'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h3>
                  <div className="space-y-3">
                    {recentTransactions.map((transaction, index) => (
                      <div key={index} className="p-3 hover:bg-accent rounded-lg transition-colors border-l-4 border-emerald-500">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-foreground">{transaction.customer}</p>
                            <p className="text-sm text-muted-foreground">{transaction.items} items</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-foreground">{transaction.amount}</p>
                            <p className="text-xs text-muted-foreground">{transaction.time}</p>
                          </div>
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
                    { label: "New Sale", icon: ShoppingCart, action: () => handleTabChange("sales") },
                    { label: "Check Stock", icon: Package, action: () => handleTabChange("inventory") },
                    { label: "Analytics", icon: BarChart, action: () => handleTabChange("analytics") },
                    { label: "Place Order", icon: CreditCard, action: () => handleTabChange("orders") },
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

          {activeTab === "sales" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <ShoppingCart className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Sales Management</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Process customer sales, manage transactions, track daily revenue, 
                  and optimize your retail sales operations and customer service.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">₹45k</p>
                    <p className="text-sm text-muted-foreground">Today's Sales</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">67</p>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">12%</p>
                    <p className="text-sm text-muted-foreground">Growth</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "inventory" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <Package className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Inventory Management</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Track product inventory, manage stock levels, monitor product movement, 
                  and optimize inventory turnover for maximum profitability.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="p-6 bg-accent rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Total Products</h3>
                    <p className="text-3xl font-bold text-emerald-500">156</p>
                    <p className="text-sm text-muted-foreground">In inventory</p>
                  </div>
                  <div className="p-6 bg-accent rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Low Stock</h3>
                    <p className="text-3xl font-bold text-emerald-500">8</p>
                    <p className="text-sm text-muted-foreground">Need reordering</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "customers" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <Users className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Customer Management</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Manage customer relationships, track purchase history, 
                  implement loyalty programs, and enhance customer satisfaction.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">234</p>
                    <p className="text-sm text-muted-foreground">Today's Visits</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">1.2k</p>
                    <p className="text-sm text-muted-foreground">Regular Customers</p>
                  </div>
                  <div className="p-4 bg-accent rounded-lg text-center">
                    <p className="text-2xl font-bold text-foreground">4.8★</p>
                    <p className="text-sm text-muted-foreground">Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <BarChart className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Business Analytics</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Analyze sales trends, monitor business performance, 
                  track key metrics, and make data-driven retail decisions.
                </p>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  View Detailed Reports
                </Button>
              </div>
            </div>
          )}

          {activeTab === "orders" && (
            <div className="bg-card/50 backdrop-blur rounded-xl border border-border p-6">
              <div className="text-center py-8">
                <CreditCard className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-4">Supplier Orders</h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Place orders with suppliers, track order status, 
                  manage purchase orders, and ensure timely stock replenishment.
                </p>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  Place New Order
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
                  Monitor revenue streams, track profit margins, 
                  analyze financial performance, and optimize retail profitability.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <div className="p-6 bg-accent rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-2">This Month</h3>
                    <p className="text-3xl font-bold text-emerald-500">₹8.7L</p>
                    <p className="text-sm text-muted-foreground">+18% from last month</p>
                  </div>
                  <div className="p-6 bg-accent rounded-lg">
                    <h3 className="text-lg font-semibold text-foreground mb-2">Total Revenue</h3>
                    <p className="text-3xl font-bold text-emerald-500">₹42.5L</p>
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