"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  BarChart3, 
  Package, 
  DollarSign, 
  Store,
  LogOut,
  Users,
  ShoppingCart,
  BarChart,
  Truck,
  Shield,
  Search,
  Eye,
  Sprout,
  User,
  MapPin,
  Phone,
  Building,
  Edit,
  X,
  Save,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function RetailerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [availableProducts, setAvailableProducts] = useState<any[]>([])
  const [myOrders, setMyOrders] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [orderQuantity, setOrderQuantity] = useState(1)
  const [loading, setLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    phone: "",
    address: "",
    business_name: ""
  })

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace("/auth/login")
          return
        }
        setUser(user)
        await loadRetailerProfile(user.id)
        await loadAvailableProducts()
        await loadMyOrders(user.id)
      } catch (error) {
        console.error('🔴 Auth check error:', error)
        router.replace("/auth/login")
      }
    }
    checkAuth()
  }, [router, supabase.auth])

  // Load retailer profile - FIXED: Using the correct API endpoint
  const loadRetailerProfile = async (userId: string) => {
    try {
      setProfileLoading(true)
      console.log('🟡 Loading retailer profile for:', userId)

      const response = await fetch(`/api/profile?id=${userId}`)
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          console.log('🟡 No retailer profile found, creating default')
          await createDefaultProfile(userId)
          return
        }
        throw new Error(result.error || 'Failed to load profile')
      }

      console.log('🟢 Retailer profile loaded:', result.profile)
      setProfile(result.profile)
      setProfileForm({
        phone: result.profile.phone || "",
        address: result.profile.address || "",
        business_name: result.profile.business_name || ""
      })

    } catch (error) {
      console.error('🔴 Error loading retailer profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  // Create default profile - FIXED: Using the correct API endpoint
  const createDefaultProfile = async (userId: string) => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) return

      const profileData = {
        role: 'retailer',
        email: currentUser.email,
        phone: profileForm.phone || '',
        address: profileForm.address || '',
        business_name: profileForm.business_name || '',
        verified: false
      }

      console.log('🟡 Creating retailer profile:', profileData)

      const response = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      const result = await response.json()
      if (response.ok) {
        console.log('🟢 Retailer profile created:', result.profile)
        setProfile(result.profile)
        setProfileForm({
          phone: result.profile.phone || "",
          address: result.profile.address || "",
          business_name: result.profile.business_name || ""
        })
      } else {
        console.error('🔴 Profile creation failed:', result.error)
      }
    } catch (error) {
      console.error('🔴 Error creating retailer profile:', error)
    }
  }

  // Update profile - FIXED: Using the correct API endpoint
  const updateProfile = async () => {
    if (!user?.id) return

    try {
      setProfileLoading(true)
      const profileData = {
        id: user.id,
        role: 'retailer',
        email: user.email,
        phone: profileForm.phone,
        address: profileForm.address,
        business_name: profileForm.business_name,
        verified: profile?.verified || false
      }

      console.log('🟡 Updating retailer profile:', profileData)

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      const result = await response.json()
      if (response.ok) {
        console.log('🟢 Retailer profile updated:', result.profile)
        setProfile(result.profile)
        setIsEditingProfile(false)
        alert('Profile updated successfully!')
      } else {
        alert(`Profile update failed: ${result.error}`)
      }
    } catch (error) {
      console.error('🔴 Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  // Load available products from farmers - FIXED: Proper connection to farmer products
  const loadAvailableProducts = async () => {
    try {
      setLoading(true)
      console.log('🟡 Loading available products from farmers...')

      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          farmer:profiles!products_farmer_id_fkey(
            business_name,
            phone,
            address,
            email
          )
        `)
        .eq('status', 'Available')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('🔴 Error loading products:', error)
        return
      }

      console.log('🟢 Products loaded:', products?.length)
      setAvailableProducts(products || [])

    } catch (error) {
      console.error('🔴 Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load retailer's orders - FIXED: Proper order tracking
  const loadMyOrders = async (retailerId: string) => {
    try {
      console.log('🟡 Loading orders for retailer:', retailerId)

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(
            product_name,
            category,
            price_per_quintal,
            farm_location,
            farmer:profiles!products_farmer_id_fkey(
              business_name,
              phone
            )
          )
        `)
        .eq('retailer_id', retailerId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('🔴 Error loading orders:', error)
        return
      }

      console.log('🟢 Orders loaded:', orders?.length)
      setMyOrders(orders || [])
    } catch (error) {
      console.error('🔴 Error loading orders:', error)
    }
  }

  // Place order for a product - FIXED: Proper order creation
  const placeOrder = async (product: any) => {
    if (!user?.id) {
      alert("Please login to place orders")
      return
    }

    if (orderQuantity > product.quantity) {
      alert(`Cannot order more than available quantity (${product.quantity} quintals)`)
      return
    }

    if (orderQuantity <= 0) {
      alert("Please enter a valid quantity")
      return
    }

    try {
      setLoading(true)
      
      const orderData = {
        product_id: product.id,
        retailer_id: user.id,
        farmer_id: product.farmer_id,
        quantity: orderQuantity,
        total_price: orderQuantity * product.price_per_quintal,
        status: 'Pending',
        order_date: new Date().toISOString()
      }

      console.log('🟡 Placing order:', orderData)

      const { data: order, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()

      if (error) {
        console.error('🔴 Order creation error:', error)
        alert(`Order failed: ${error.message}`)
        return
      }

      // Update product quantity
      const newQuantity = product.quantity - orderQuantity
      const { error: updateError } = await supabase
        .from('products')
        .update({ quantity: newQuantity })
        .eq('id', product.id)

      if (updateError) {
        console.error('🔴 Product update error:', updateError)
      }

      // Notify farmer
      await notifyFarmer(product.farmer_id, product.product_name, orderQuantity)

      alert(`✅ Order placed successfully!\nProduct: ${product.product_name}\nQuantity: ${orderQuantity} quintals\nTotal: ₹${orderQuantity * product.price_per_quintal}`)
      
      setSelectedProduct(null)
      setOrderQuantity(1)
      await loadMyOrders(user.id)
      await loadAvailableProducts()

    } catch (error) {
      console.error('🔴 Order error:', error)
      alert("❌ Failed to place order")
    } finally {
      setLoading(false)
    }
  }

  // Notify farmer about the order
  const notifyFarmer = async (farmerId: string, productName: string, quantity: number) => {
    try {
      console.log(`🟡 Notifying farmer ${farmerId} about order`)
      
      // Create notification in database
      await supabase
        .from('notifications')
        .insert([{
          user_id: farmerId,
          title: 'New Order Received! 🎉',
          message: `A retailer has ordered ${quantity} quintals of your ${productName}. Please check your orders.`,
          type: 'order',
          read: false,
          created_at: new Date().toISOString()
        }])
    } catch (error) {
      console.error('🔴 Notification error:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/auth/login")
  }

  // Calculate retailer stats based on actual data
  const calculateStats = () => {
    const totalOrders = myOrders.length
    const pendingOrders = myOrders.filter(order => order.status === 'Pending').length
    const completedOrders = myOrders.filter(order => order.status === 'Delivered').length
    const totalSpent = myOrders.reduce((sum, order) => sum + (order.total_price || 0), 0)

    return [
      { 
        label: "Total Orders", 
        value: totalOrders.toString(), 
        change: "+12%", 
        icon: Package,
        color: "text-blue-400"
      },
      { 
        label: "Pending Orders", 
        value: pendingOrders.toString(), 
        change: `${pendingOrders} active`, 
        icon: Clock,
        color: "text-yellow-400"
      },
      { 
        label: "Total Spent", 
        value: totalSpent >= 100000 ? `₹${(totalSpent / 100000).toFixed(1)}L` : 
               totalSpent >= 1000 ? `₹${(totalSpent / 1000).toFixed(1)}k` : `₹${totalSpent}`,
        change: "+18%", 
        icon: DollarSign,
        color: "text-emerald-400"
      },
    ]
  }

  const retailStats = calculateStats()

  // Filter products based on search
  const filteredProducts = availableProducts.filter(product =>
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.farm_location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get status icon and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Delivered':
        return { icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-900' }
      case 'Shipped':
        return { icon: Truck, color: 'text-blue-400', bgColor: 'bg-blue-900' }
      case 'Processing':
        return { icon: Clock, color: 'text-yellow-400', bgColor: 'bg-yellow-900' }
      default:
        return { icon: Clock, color: 'text-gray-400', bgColor: 'bg-gray-900' }
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">KrishiSetu</h1>
              <p className="text-sm text-gray-400">Retailer Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            {[
              { id: "dashboard", label: "Retail Dashboard", icon: BarChart3 },
              { id: "marketplace", label: "Farm Marketplace", icon: Sprout },
              { id: "orders", label: "My Orders", icon: Package },
              { id: "analytics", label: "Analytics", icon: BarChart },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Profile Section */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile Information
            </h3>
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="text-gray-500 hover:text-white transition-colors"
              disabled={profileLoading}
            >
              {isEditingProfile ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </button>
          </div>

          {profileLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500 mx-auto"></div>
              <p className="text-xs text-gray-400 mt-2">Loading profile...</p>
            </div>
          ) : isEditingProfile ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Business Name</label>
                <input
                  type="text"
                  value={profileForm.business_name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, business_name: e.target.value }))}
                  placeholder="Your store/business name"
                  className="w-full p-2 text-sm bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Phone</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Your phone number"
                  className="w-full p-2 text-sm bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Store Address</label>
                <textarea
                  value={profileForm.address}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Your store address"
                  rows={3}
                  className="w-full p-2 text-sm bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={updateProfile}
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                  disabled={profileLoading}
                >
                  {profileLoading ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                  ) : (
                    <Save className="h-3 w-3 mr-1" />
                  )}
                  Save
                </Button>
                <Button
                  onClick={() => setIsEditingProfile(false)}
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-white">
                <Mail className="h-3 w-3 text-gray-400" />
                <span className="truncate">{user?.email}</span>
              </div>
              {profile?.phone && (
                <div className="flex items-center gap-2 text-sm text-white">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile?.business_name && (
                <div className="flex items-center gap-2 text-sm text-white">
                  <Building className="h-3 w-3 text-gray-400" />
                  <span className="truncate">{profile.business_name}</span>
                </div>
              )}
              {profile?.address && (
                <div className="flex items-start gap-2 text-sm text-white">
                  <MapPin className="h-3 w-3 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs">{profile.address}</span>
                </div>
              )}
              {(!profile || (!profile?.phone && !profile?.business_name && !profile?.address)) && (
                <p className="text-xs text-gray-500">Click edit to add profile information</p>
              )}
            </div>
          )}

          {profile && (
            <div className="mt-3 pt-3 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Verification</span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  profile.verified 
                    ? 'bg-emerald-900 text-emerald-400' 
                    : 'bg-yellow-900 text-yellow-400'
                }`}>
                  {profile.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">Role</span>
                <span className="text-xs text-white capitalize">{profile.role || 'retailer'}</span>
              </div>
            </div>
          )}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800 mt-4">
          <div className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-medium">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.business_name || user?.email || 'Retailer'}
              </p>
              <p className="text-xs text-gray-400 capitalize">{profile?.role || 'retailer'} Account</p>
            </div>
            <button 
              onClick={handleLogout}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="px-6 py-4">
            <h1 className="text-xl font-bold text-white">
              {activeTab === "dashboard" && "Retail Dashboard"}
              {activeTab === "marketplace" && "Farm Marketplace"}
              {activeTab === "orders" && "My Orders"}
              {activeTab === "analytics" && "Business Analytics"}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === "dashboard" && "Overview of your purchases from farmers"}
              {activeTab === "marketplace" && "Source products directly from farmers"}
              {activeTab === "orders" && "Track your orders from farmers"}
              {activeTab === "analytics" && "Analyze your purchasing patterns"}
            </p>
          </div>
        </header>

        <main className="flex-1 p-6 bg-black">
          {loading && (
            <div className="fixed top-0 left-0 w-full h-1 bg-emerald-500 z-50 animate-pulse"></div>
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Retail Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {retailStats.map((stat, index) => (
                  <div key={index} className="bg-gray-900 rounded-lg border border-gray-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                        <div className="mt-2">
                          <span className="text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                            {stat.change}
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center border border-gray-700">
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: "Browse Products", icon: Sprout, action: () => setActiveTab("marketplace") },
                    { label: "View Orders", icon: Package, action: () => setActiveTab("orders") },
                    { label: "Track Delivery", icon: Truck, action: () => setActiveTab("orders") },
                    { label: "Analytics", icon: BarChart, action: () => setActiveTab("analytics") },
                  ].map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors text-center"
                    >
                      <action.icon className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-white">{action.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Orders */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Orders</h3>
                {myOrders.length > 0 ? (
                  <div className="space-y-3">
                    {myOrders.slice(0, 5).map((order, index) => {
                      const StatusIcon = getStatusInfo(order.status).icon
                      const statusColor = getStatusInfo(order.status).color
                      return (
                        <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-800 rounded-lg border border-gray-700 transition-colors">
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium text-white">{order.product?.product_name}</p>
                                <p className="text-sm text-gray-400">
                                  From: {order.product?.farmer?.business_name || 'Farmer'} • 
                                  Quantity: {order.quantity} quintals
                                </p>
                                <p className="text-xs text-gray-500">
                                  Ordered: {new Date(order.order_date).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-white font-semibold">
                                  ₹{order.total_price?.toLocaleString()}
                                </p>
                                <div className={`flex items-center gap-1 justify-end mt-1 ${statusColor}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  <span className="text-xs">{order.status}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-gray-400">No orders yet.</p>
                    <p className="text-sm text-gray-500">Browse the marketplace to place your first order!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "marketplace" && (
            <div className="space-y-6">
              {/* Search Bar */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products by name, category, or location..."
                      className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <div key={index} className="bg-gray-900 rounded-lg border border-gray-800 p-6 hover:border-emerald-500 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-semibold text-white text-lg">{product.product_name}</h3>
                        <p className="text-sm text-gray-400">{product.category}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        product.quality_metrics?.grade === 'A' ? 'bg-emerald-900 text-emerald-400' :
                        product.quality_metrics?.grade === 'B' ? 'bg-blue-900 text-blue-400' :
                        'bg-yellow-900 text-yellow-400'
                      }`}>
                        Grade {product.quality_metrics?.grade || 'A'}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Available Quantity:</span>
                        <span className="text-white">{product.quantity} quintals</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Price per Quintal:</span>
                        <span className="text-white font-semibold">₹{product.price_per_quintal}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Farm Location:</span>
                        <span className="text-white text-right">{product.farm_location}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Farmer:</span>
                        <span className="text-white">{product.farmer?.business_name || 'Local Farmer'}</span>
                      </div>
                      {product.harvest_date && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Harvest Date:</span>
                          <span className="text-white">{new Date(product.harvest_date).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={() => setSelectedProduct(product)}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <Sprout className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-400 mb-2">No products found</h3>
                  <p className="text-gray-500">Try adjusting your search criteria or check back later for new products.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">My Orders ({myOrders.length})</h3>
                {myOrders.length > 0 ? (
                  <div className="space-y-4">
                    {myOrders.map((order, index) => {
                      const StatusIcon = getStatusInfo(order.status).icon
                      const statusColor = getStatusInfo(order.status).color
                      const bgColor = getStatusInfo(order.status).bgColor
                      
                      return (
                        <div key={index} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-white">{order.product?.product_name}</h4>
                              <p className="text-sm text-gray-400">
                                From: {order.product?.farmer?.business_name || 'Farmer'} • 
                                Location: {order.product?.farm_location}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${bgColor} ${statusColor}`}>
                                {order.status}
                              </span>
                              <StatusIcon className={`h-4 w-4 ${statusColor}`} />
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Quantity:</span>
                              <p className="text-white">{order.quantity} quintals</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Unit Price:</span>
                              <p className="text-white">₹{order.product?.price_per_quintal}/quintal</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Total:</span>
                              <p className="text-white font-semibold">₹{order.total_price?.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Order Date:</span>
                              <p className="text-white">{new Date(order.order_date).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          {order.product?.farmer?.phone && (
                            <div className="mt-3 pt-3 border-t border-gray-700">
                              <span className="text-gray-400 text-sm">Farmer Contact: </span>
                              <span className="text-white text-sm">{order.product.farmer.phone}</span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">No orders yet</h3>
                    <p className="text-gray-500 mb-4">Start sourcing products from farmers in the marketplace.</p>
                    <Button 
                      onClick={() => setActiveTab("marketplace")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Browse Marketplace
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Product Detail Modal */}
          {selectedProduct && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-white">{selectedProduct.product_name}</h3>
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-semibold text-white mb-3">Product Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Category:</span>
                        <span className="text-white">{selectedProduct.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Available Quantity:</span>
                        <span className="text-white">{selectedProduct.quantity} quintals</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Price per Quintal:</span>
                        <span className="text-white font-semibold">₹{selectedProduct.price_per_quintal}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Quality Grade:</span>
                        <span className="text-white">Grade {selectedProduct.quality_metrics?.grade || 'A'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-3">Farmer Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Business Name:</span>
                        <span className="text-white">{selectedProduct.farmer?.business_name || 'Local Farmer'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Location:</span>
                        <span className="text-white">{selectedProduct.farm_location}</span>
                      </div>
                      {selectedProduct.farmer?.phone && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Contact:</span>
                          <span className="text-white">{selectedProduct.farmer.phone}</span>
                        </div>
                      )}
                      {selectedProduct.farmer?.email && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Email:</span>
                          <span className="text-white">{selectedProduct.farmer.email}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-6">
                  <h4 className="font-semibold text-white mb-3">Place Order</h4>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="text-sm text-gray-400 mb-2 block">Quantity (Quintal)</label>
                      <input
                        type="number"
                        min="1"
                        max={selectedProduct.quantity}
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(parseInt(e.target.value) || 1)}
                        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Maximum available: {selectedProduct.quantity} quintals
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-400">Total Price</p>
                      <p className="text-xl font-bold text-emerald-500">
                        ₹{(orderQuantity * selectedProduct.price_per_quintal).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => placeOrder(selectedProduct)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={loading || orderQuantity > selectedProduct.quantity || orderQuantity <= 0}
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Placing Order...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Place Order
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "analytics" && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <div className="text-center py-8">
                <BarChart className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Purchasing Analytics</h2>
                <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                  Analyze your purchasing patterns, track spending, and optimize your sourcing strategy from farmers.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-2xl mx-auto">
                  <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Total Spent</h3>
                    <p className="text-3xl font-bold text-emerald-500">
                      {myOrders.reduce((sum, order) => sum + (order.total_price || 0), 0) >= 100000 
                        ? `₹${(myOrders.reduce((sum, order) => sum + (order.total_price || 0), 0) / 100000).toFixed(1)}L` 
                        : `₹${myOrders.reduce((sum, order) => sum + (order.total_price || 0), 0).toLocaleString()}`
                      }
                    </p>
                    <p className="text-sm text-gray-400">Across all orders</p>
                  </div>
                  <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Farmers Connected</h3>
                    <p className="text-3xl font-bold text-emerald-500">
                      {[...new Set(myOrders.map(order => order.farmer_id))].length}
                    </p>
                    <p className="text-sm text-gray-400">Unique farmers</p>
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