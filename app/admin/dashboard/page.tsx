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
  Shield,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  MapPin,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Search,
  AlertCircle,
  UserCheck,
  UserX
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

interface UserProfile {
  id: string
  email: string
  role: string
  phone: string | null
  address: string | null
  business_name: string | null
  verified: boolean
  created_at: string
}

interface Product {
  id: string
  product_name: string
  category: string
  quantity: number
  price_per_quintal: number
  farm_location: string
  farmer_id: string
  status: string
  current_owner: string
  created_at: string
  harvest_date: string | null
  farmer?: UserProfile
}

interface Order {
  id: string
  product_id: string
  farmer_id: string
  distributor_id: string | null
  quantity: number
  price: number
  status: string
  created_at: string
  product?: Product
  farmer?: UserProfile
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [farmers, setFarmers] = useState<UserProfile[]>([])
  const [distributors, setDistributors] = useState<UserProfile[]>([])
  const [retailers, setRetailers] = useState<UserProfile[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [farmerProducts, setFarmerProducts] = useState<{[key: string]: Product[]}>({})
  const [distributorPurchases, setDistributorPurchases] = useState<{[key: string]: any[]}>({})
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalFarmers: 0,
    totalDistributors: 0,
    totalRetailers: 0,
    totalProducts: 0,
    activeOrders: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
    pendingDistributorVerifications: 0, // NEW: Pending distributor verifications
    previousFarmers: 0,
    previousProducts: 0,
    previousOrders: 0
  })
  const [notifications, setNotifications] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterVerified, setFilterVerified] = useState("all")
  const [distributorSearchQuery, setDistributorSearchQuery] = useState("")
  const [distributorFilterVerified, setDistributorFilterVerified] = useState("all")
  
  const router = useRouter()
  const supabase = createClient()

  // Check authentication and prevent back navigation
  useEffect(() => {
    let isMounted = true

    const checkAuth = async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser()
        if (!currentUser) {
          router.replace("/auth/login")
          return
        }
        
        // Check if user is admin
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .single()

        if (error || !profile) {
          // Create admin profile if doesn't exist
          await supabase.from('profiles').insert({
            id: currentUser.id,
            email: currentUser.email,
            role: 'admin',
            verified: true,
            created_at: new Date().toISOString()
          })
        } else if (profile.role !== 'admin') {
          // Redirect based on role
          if (profile.role === 'farmer') {
            router.replace("/farmer/dashboard")
          } else if (profile.role === 'distributor') {
            router.replace("/distributor/dashboard")
          } else {
            router.replace("/dashboard")
          }
          return
        }

        if (isMounted) {
          setUser(currentUser)
          await fetchAllData()
          
          // Prevent back navigation
          window.history.pushState(null, "", window.location.href)
        }
      } catch (error) {
        console.error("Auth error:", error)
        router.replace("/auth/login")
      }
    }

    // Handle back button press
    const handleBackButton = (e: PopStateEvent) => {
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          e.preventDefault()
          window.history.pushState(null, "", window.location.href)
          alert("Please logout first to leave the admin dashboard")
        }
      })
    }

    checkAuth()
    
    window.addEventListener('popstate', handleBackButton)

    // Prevent back button with keyboard
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Backspace' && e.target === document.body) {
        e.preventDefault()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      isMounted = false
      window.removeEventListener('popstate', handleBackButton)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [router, supabase.auth])

  // Fetch all data
  const fetchAllData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchFarmers(),
        fetchDistributors(),
        fetchRetailers(),
        fetchProducts(),
        fetchOrders(),
        fetchDistributorPurchases() // NEW: Fetch distributor purchases
      ])
      await calculateStats()
      await calculateNotifications()
      generateRecentActivities()
      organizeFarmerProducts()
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch farmers
  const fetchFarmers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'farmer')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setFarmers(data)
    }
  }

  // Fetch distributors
  const fetchDistributors = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'distributor')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setDistributors(data)
    }
  }

  // NEW: Fetch distributor purchases
  const fetchDistributorPurchases = async () => {
    try {
      // Try to fetch from purchases table
      const { data: purchasesData, error } = await supabase
        .from('purchases')
        .select('*')
        .order('purchased_at', { ascending: false })

      if (!error && purchasesData) {
        // Organize purchases by distributor
        const purchasesByDistributor: {[key: string]: any[]} = {}
        purchasesData.forEach(purchase => {
          if (purchase.distributor_id) {
            if (!purchasesByDistributor[purchase.distributor_id]) {
              purchasesByDistributor[purchase.distributor_id] = []
            }
            purchasesByDistributor[purchase.distributor_id].push(purchase)
          }
        })
        setDistributorPurchases(purchasesByDistributor)
      }
    } catch (error) {
      console.error("Error fetching distributor purchases:", error)
    }
  }

  // Fetch retailers
  const fetchRetailers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'retailer')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setRetailers(data)
    }
  }

  // Fetch products with farmer information
  const fetchProducts = async () => {
    try {
      // Fetch all products
      const { data: productsData, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error("Error fetching products:", error)
        return
      }

      if (!productsData) {
        setProducts([])
        return
      }

      // Fetch all farmers to map to products
      const { data: farmersData } = await supabase
        .from('profiles')
        .select('id, email, business_name')
        .eq('role', 'farmer')

      // Create a map of farmer_id -> farmer details
      const farmersMap = new Map()
      if (farmersData) {
        farmersData.forEach(farmer => {
          farmersMap.set(farmer.id, farmer)
        })
      }

      // Combine products with farmer information
      const productsWithFarmers = productsData.map(product => ({
        ...product,
        farmer: farmersMap.get(product.farmer_id) || null
      }))

      setProducts(productsWithFarmers)
    } catch (error) {
      console.error("Error in fetchProducts:", error)
    }
  }

  // Fetch orders
  const fetchOrders = async () => {
    try {
      // Try to fetch from orders table
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(*),
          farmer:profiles!orders_farmer_id_fkey(*)
        `)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setOrders(data)
      } else {
        // Use products with status as orders
        await fetchProductsForOrders()
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
      await fetchProductsForOrders()
    }
  }

  // Fetch products for orders (fallback)
  const fetchProductsForOrders = async () => {
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .in('status', ['Processing', 'Confirmed', 'Shipped', 'In Transit'])
      .order('created_at', { ascending: false })

    if (productsData) {
      const fakeOrders: Order[] = productsData.map(product => ({
        id: product.id,
        product_id: product.id,
        farmer_id: product.farmer_id,
        distributor_id: null,
        quantity: product.quantity,
        price: product.price_per_quintal * product.quantity,
        status: product.status,
        created_at: product.created_at,
        product: product
      }))
      setOrders(fakeOrders)
    }
  }

  // Organize products by farmer
  const organizeFarmerProducts = () => {
    const farmerProductsMap: {[key: string]: Product[]} = {}
    
    products.forEach(product => {
      if (product.farmer_id) {
        if (!farmerProductsMap[product.farmer_id]) {
          farmerProductsMap[product.farmer_id] = []
        }
        farmerProductsMap[product.farmer_id].push(product)
      }
    })
    
    setFarmerProducts(farmerProductsMap)
  }

  // Calculate statistics
  const calculateStats = async () => {
    try {
      // Get current counts
      const [
        farmersCount,
        distributorsCount,
        retailersCount,
        productsCount
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'farmer'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'distributor'),
        supabase.from('profiles').select('id', { count: 'exact' }).eq('role', 'retailer'),
        supabase.from('products').select('id', { count: 'exact' })
      ])

      // Calculate total revenue
      let totalRevenue = 0
      if (products.length > 0) {
        totalRevenue = products.reduce((sum, product) => {
          return sum + (product.quantity * product.price_per_quintal)
        }, 0)
      }

      // Calculate active orders
      const activeOrders = orders.filter(order => 
        ['Processing', 'Confirmed', 'Shipped', 'In Transit'].includes(order.status)
      ).length

      // Calculate pending verifications
      const pendingFarmerVerifications = farmers.filter(f => !f.verified).length
      const pendingDistributorVerifications = distributors.filter(d => !d.verified).length

      // Previous month data (simulated)
      const previousFarmers = Math.max(0, (farmersCount.count || 0) - Math.floor(Math.random() * 5))
      const previousProducts = Math.max(0, (productsCount.count || 0) - Math.floor(Math.random() * 10))
      const previousOrders = Math.max(0, activeOrders - Math.floor(Math.random() * 3))

      setStats({
        totalFarmers: farmersCount.count || 0,
        totalDistributors: distributorsCount.count || 0,
        totalRetailers: retailersCount.count || 0,
        totalProducts: productsCount.count || 0,
        activeOrders,
        totalRevenue,
        pendingVerifications: pendingFarmerVerifications,
        pendingDistributorVerifications, // NEW: Store distributor pending verifications
        previousFarmers,
        previousProducts,
        previousOrders
      })

      // Update notifications
      const totalNotifications = pendingFarmerVerifications + pendingDistributorVerifications
      setNotifications(totalNotifications > 0 ? totalNotifications : 0)
    } catch (error) {
      console.error("Error calculating stats:", error)
    }
  }

  // Calculate notifications
  const calculateNotifications = async () => {
    const { count: farmerCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'farmer')
      .eq('verified', false)

    const { count: distributorCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'distributor')
      .eq('verified', false)

    setNotifications((farmerCount || 0) + (distributorCount || 0))
  }

  // Generate recent activities
  const generateRecentActivities = () => {
    const activities: any[] = []
    
    // Recent farmer registrations
    farmers.slice(0, 3).forEach(farmer => {
      activities.push({
        action: "New farmer registered",
        user: farmer.business_name || farmer.email.split('@')[0],
        time: formatTimeAgo(farmer.created_at),
        type: 'farmer'
      })
    })
    
    // Recent distributor registrations
    distributors.slice(0, 2).forEach(distributor => {
      activities.push({
        action: "New distributor registered",
        user: distributor.business_name || distributor.email.split('@')[0],
        time: formatTimeAgo(distributor.created_at),
        type: 'distributor'
      })
    })
    
    // Recent product registrations
    products.slice(0, 2).forEach(product => {
      const farmerName = product.farmer?.business_name || 
                        product.farmer?.email.split('@')[0] || 
                        "Unknown Farmer"
      activities.push({
        action: `New product: ${product.product_name}`,
        user: farmerName,
        time: formatTimeAgo(product.created_at),
        type: 'product'
      })
    })
    
    // Sort by time
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    setRecentActivities(activities.slice(0, 4))
  }

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    if (!dateString) return 'Just now'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 60) {
      return `${diffMins} min ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  // Get change info
  const getChangeInfo = (change: number) => {
    if (change > 0) {
      return {
        icon: <TrendingUp className="h-4 w-4" />,
        color: "text-emerald-500",
        text: `+${change}%`
      }
    } else if (change < 0) {
      return {
        icon: <TrendingDown className="h-4 w-4" />,
        color: "text-red-500",
        text: `${change}%`
      }
    } else {
      return {
        icon: null,
        color: "text-gray-500",
        text: "0%"
      }
    }
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`
    } else if (amount >= 1000) {
      return `₹${(amount / 1000).toFixed(1)}k`
    }
    return `₹${amount}`
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
      window.history.replaceState(null, "", "/auth/login")
      router.replace("/auth/login")
    } catch (error) {
      console.error("Logout error:", error)
      router.replace("/auth/login")
    }
  }

  // Refresh data
  const refreshData = () => {
    fetchAllData()
  }

  // Toggle verification for any user
  const toggleVerification = async (userId: string, currentVerified: boolean, role: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verified: !currentVerified })
        .eq('id', userId)

      if (error) throw error

      // Refresh relevant data
      if (role === 'farmer') {
        await fetchFarmers()
      } else if (role === 'distributor') {
        await fetchDistributors()
      }
      await calculateStats()
      await calculateNotifications()
      
      alert(`${role.charAt(0).toUpperCase() + role.slice(1)} verification status updated successfully!`)
    } catch (error) {
      console.error("Error updating verification:", error)
      alert("Failed to update verification status")
    }
  }

  // View user details
  const viewUserDetails = (user: UserProfile, role: string) => {
    let details = ""
    
    if (role === 'farmer') {
      const userProducts = farmerProducts[user.id] || []
      details = `
Email: ${user.email}
Business Name: ${user.business_name || 'Not provided'}
Phone: ${user.phone || 'Not provided'}
Address: ${user.address || 'Not provided'}
Verified: ${user.verified ? 'Yes ✅' : 'No ❌'}
Registered: ${formatDate(user.created_at)}
Total Products: ${userProducts.length}
Total Quantity: ${userProducts.reduce((sum, p) => sum + p.quantity, 0)} quintals
Total Value: ${formatCurrency(userProducts.reduce((sum, p) => sum + (p.quantity * p.price_per_quintal), 0))}
      `
    } else if (role === 'distributor') {
      const userPurchases = distributorPurchases[user.id] || []
      details = `
Email: ${user.email}
Business Name: ${user.business_name || 'Not provided'}
Phone: ${user.phone || 'Not provided'}
Address: ${user.address || 'Not provided'}
Verified: ${user.verified ? 'Yes ✅' : 'No ❌'}
Registered: ${formatDate(user.created_at)}
Total Purchases: ${userPurchases.length}
Total Spent: ${formatCurrency(userPurchases.reduce((sum, p) => sum + (p.total_amount || 0), 0))}
      `
    }
    
    alert(`${role.charAt(0).toUpperCase() + role.slice(1)} Details:\n\n${details}`)
  }

  // Filter farmers
  const filteredFarmers = farmers.filter(farmer => {
    const matchesSearch = searchQuery === "" || 
      farmer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (farmer.business_name && farmer.business_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (farmer.phone && farmer.phone.includes(searchQuery))
    
    const matchesVerified = filterVerified === "all" ||
      (filterVerified === "verified" && farmer.verified) ||
      (filterVerified === "unverified" && !farmer.verified)
    
    return matchesSearch && matchesVerified
  })

  // Filter distributors
  const filteredDistributors = distributors.filter(distributor => {
    const matchesSearch = distributorSearchQuery === "" || 
      distributor.email.toLowerCase().includes(distributorSearchQuery.toLowerCase()) ||
      (distributor.business_name && distributor.business_name.toLowerCase().includes(distributorSearchQuery.toLowerCase())) ||
      (distributor.phone && distributor.phone.includes(distributorSearchQuery))
    
    const matchesVerified = distributorFilterVerified === "all" ||
      (distributorFilterVerified === "verified" && distributor.verified) ||
      (distributorFilterVerified === "unverified" && !distributor.verified)
    
    return matchesSearch && matchesVerified
  })

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  // Calculate dynamic stats
  const dynamicStats = [
    { 
      label: "Total Farmers", 
      value: stats.totalFarmers.toString(), 
      change: getChangeInfo(calculatePercentageChange(stats.totalFarmers, stats.previousFarmers)),
      previous: stats.previousFarmers.toString(),
      icon: Users,
      pending: stats.pendingVerifications,
      action: () => {
        setActiveTab("farmers")
        setFilterVerified("unverified")
      }
    },
    { 
      label: "Active Orders", 
      value: stats.activeOrders.toString(), 
      change: getChangeInfo(calculatePercentageChange(stats.activeOrders, stats.previousOrders)),
      previous: stats.previousOrders.toString(),
      icon: FileText,
      pending: 0,
      action: () => setActiveTab("orders")
    },
    { 
      label: "Total Distributors", 
      value: stats.totalDistributors.toString(), 
      change: getChangeInfo(calculatePercentageChange(stats.totalDistributors, stats.previousFarmers)),
      previous: "0",
      icon: Truck,
      pending: stats.pendingDistributorVerifications,
      action: () => {
        setActiveTab("distributors")
        setDistributorFilterVerified("unverified")
      }
    },
  ]

  const dynamicPlatformStats = [
    { 
      label: "Total Users", 
      value: (stats.totalFarmers + stats.totalDistributors + stats.totalRetailers).toString(), 
      description: "Registered users" 
    },
    { 
      label: "Active Orders", 
      value: stats.activeOrders.toString(), 
      description: "Not delivered yet" 
    },
    { 
      label: "Products", 
      value: stats.totalProducts.toString(), 
      description: "On blockchain" 
    },
    { 
      label: "Revenue", 
      value: formatCurrency(stats.totalRevenue), 
      description: "Total value" 
    },
  ]

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
              <Building className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">KrishiSetu</h1>
              <p className="text-sm text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "farmers", label: "Farmers", icon: Users },
              { id: "distributors", label: "Distributors", icon: Truck },
              { id: "retailers", label: "Retailers", icon: Store },
              { id: "products", label: "Products", icon: Package },
              { id: "orders", label: "Orders", icon: FileText },
              { id: "billing", label: "Billing", icon: DollarSign },
              { id: "security", label: "Security", icon: Shield },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all relative ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {(item.id === "farmers" && stats.pendingVerifications > 0) && (
                  <span className="absolute right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {stats.pendingVerifications}
                  </span>
                )}
                {(item.id === "distributors" && stats.pendingDistributorVerifications > 0) && (
                  <span className="absolute right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {stats.pendingDistributorVerifications}
                  </span>
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-gray-800 mt-4">
          <div className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-medium">
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.email}</p>
              <p className="text-xs text-gray-400">Admin Account</p>
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
        {/* Header */}
        <header className="bg-gray-900 border-b border-gray-800">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {activeTab === "dashboard" && "Admin Dashboard"}
                  {activeTab === "farmers" && `Farmers Management (${farmers.length})`}
                  {activeTab === "distributors" && `Distributors Management (${distributors.length})`}
                  {activeTab === "retailers" && `Retailers (${retailers.length})`}
                  {activeTab === "products" && `Products (${products.length})`}
                  {activeTab === "orders" && `Orders (${orders.length})`}
                  {activeTab === "billing" && "Billing System"}
                  {activeTab === "security" && "Security Settings"}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  {activeTab === "dashboard" && "Real-time platform overview & analytics"}
                  {activeTab === "distributors" && `Manage ${distributors.length} distributors on the platform`}
                  {activeTab !== "dashboard" && activeTab !== "distributors" && `Manage ${activeTab} on the platform`}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {notifications > 0 && (
                  <button 
                    onClick={() => {
                      // Show dropdown for which notifications to view
                      const confirmed = confirm(
                        `You have ${notifications} pending verifications:\n` +
                        `• ${stats.pendingVerifications} farmers\n` +
                        `• ${stats.pendingDistributorVerifications} distributors\n\n` +
                        `Go to which section?`
                      )
                      if (confirmed) {
                        if (stats.pendingDistributorVerifications > 0) {
                          setActiveTab("distributors")
                          setDistributorFilterVerified("unverified")
                        } else {
                          setActiveTab("farmers")
                          setFilterVerified("unverified")
                        }
                      }
                    }}
                    className="p-2 text-gray-400 hover:text-white transition-colors relative"
                  >
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications}
                    </span>
                  </button>
                )}
                <button
                  onClick={refreshData}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Refresh Data"
                  disabled={loading}
                >
                  <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-6 bg-black">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
                <p className="mt-4 text-gray-400">Loading data...</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === "dashboard" && (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {dynamicStats.map((stat, index) => (
                      <div 
                        key={index} 
                        className="bg-gray-900 rounded-xl border border-gray-800 p-6 hover:shadow-lg transition-all cursor-pointer relative"
                        onClick={stat.action}
                      >
                        {stat.pending > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                            {stat.pending}
                          </span>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                            <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                          </div>
                          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                            <stat.icon className="h-6 w-6 text-white" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <span className={`text-sm font-medium ${stat.change.color} flex items-center gap-1`}>
                            {stat.change.icon}
                            {stat.change.text}
                          </span>
                          <span className="text-sm text-gray-400 ml-2">Previous: {stat.previous}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Recent Activities */}
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Recent Activities</h3>
                      <div className="space-y-4">
                        {recentActivities.length > 0 ? (
                          recentActivities.map((activity, index) => (
                            <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-800 rounded-lg transition-colors">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                  activity.type === 'farmer' ? 'bg-emerald-500/20' :
                                  activity.type === 'distributor' ? 'bg-blue-500/20' :
                                  'bg-yellow-500/20'
                                }`}>
                                  {activity.type === 'farmer' ? <Users className="h-4 w-4 text-emerald-400" /> :
                                   activity.type === 'distributor' ? <Truck className="h-4 w-4 text-blue-400" /> :
                                   <Package className="h-4 w-4 text-yellow-400" />}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">{activity.action}</p>
                                  <p className="text-xs text-gray-400">by {activity.user}</p>
                                </div>
                              </div>
                              <span className="text-xs text-gray-400">{activity.time}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-400">No recent activities</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Revenue */}
                    <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Total Revenue</h3>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-3xl font-bold text-white">{formatCurrency(stats.totalRevenue)}</p>
                          <p className="text-sm text-gray-400 mt-1">from all products</p>
                        </div>
                        <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                          {formatCurrency(stats.totalRevenue).replace('₹', '')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Platform Stats */}
                  <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                    <h3 className="text-lg font-semibold text-white mb-6">Platform Overview</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {dynamicPlatformStats.map((stat, index) => (
                        <div key={index} className="text-center group cursor-pointer p-4 hover:bg-gray-800 rounded-lg transition-colors">
                          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform">
                            <span className="text-white font-bold text-sm">{stat.value}</span>
                          </div>
                          <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                          <p className="text-xs text-gray-400 mt-1">{stat.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {activeTab === "farmers" && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Farmers Management</h3>
                  
                  {/* Search and Filter */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search farmers by email, business name, or phone..."
                          className="w-full pl-10 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <select
                      value={filterVerified}
                      onChange={(e) => setFilterVerified(e.target.value)}
                      className="p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    >
                      <option value="all">All Farmers</option>
                      <option value="verified">Verified Only</option>
                      <option value="unverified">Unverified Only</option>
                    </select>
                  </div>

                  {/* Farmers List */}
                  <div className="space-y-4">
                    {filteredFarmers.map((farmer) => (
                      <div key={farmer.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-medium">
                                {farmer.business_name?.charAt(0) || farmer.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">{farmer.business_name || 'No Business Name'}</h4>
                                <p className="text-sm text-gray-400 flex items-center gap-2">
                                  <Mail className="h-3 w-3" />
                                  {farmer.email}
                                </p>
                              </div>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                farmer.verified ? 'bg-emerald-900/30 text-emerald-400' : 'bg-yellow-900/30 text-yellow-400'
                              }`}>
                                {farmer.verified ? 'Verified' : 'Unverified'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                              {farmer.phone && (
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Phone className="h-4 w-4" />
                                  <span className="text-white">{farmer.phone}</span>
                                </div>
                              )}
                              {farmer.address && (
                                <div className="flex items-center gap-2 text-gray-400">
                                  <MapPin className="h-4 w-4" />
                                  <span className="text-white truncate">{farmer.address}</span>
                                </div>
                              )}
                              <div className="text-gray-400">
                                Registered: <span className="text-white">{formatDate(farmer.created_at)}</span>
                              </div>
                            </div>

                            {/* Farmer's Products */}
                            {farmerProducts[farmer.id] && farmerProducts[farmer.id].length > 0 && (
                              <div className="mt-4 pt-4 border-t border-gray-800">
                                <h5 className="text-sm font-medium text-gray-400 mb-2">Products ({farmerProducts[farmer.id].length})</h5>
                                <div className="space-y-2">
                                  {farmerProducts[farmer.id].slice(0, 3).map(product => (
                                    <div key={product.id} className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                                      <div>
                                        <p className="text-sm text-white">{product.product_name}</p>
                                        <p className="text-xs text-gray-400">{product.category} • {product.quantity} quintals</p>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm text-white">₹{product.quantity * product.price_per_quintal}</p>
                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                          product.status === 'Registered' ? 'bg-emerald-900/30 text-emerald-400' :
                                          product.status === 'Processing' ? 'bg-yellow-900/30 text-yellow-400' :
                                          'bg-blue-900/30 text-blue-400'
                                        }`}>
                                          {product.status}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                  {farmerProducts[farmer.id].length > 3 && (
                                    <p className="text-xs text-gray-500 text-center">
                                      +{farmerProducts[farmer.id].length - 3} more products
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex flex-col gap-2 ml-4">
                            <button
                              onClick={() => viewUserDetails(farmer, 'farmer')}
                              className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              Details
                            </button>
                            <button
                              onClick={() => toggleVerification(farmer.id, farmer.verified, 'farmer')}
                              className={`px-3 py-2 text-sm rounded-lg border transition-colors flex items-center gap-2 ${
                                farmer.verified 
                                  ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400 border-red-800' 
                                  : 'bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-400 border-emerald-800'
                              }`}
                            >
                              {farmer.verified ? (
                                <>
                                  <UserX className="h-4 w-4" />
                                  Unverify
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4" />
                                  Verify
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {filteredFarmers.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-400">No farmers found</p>
                        {searchQuery && (
                          <button
                            onClick={() => setSearchQuery("")}
                            className="text-sm text-emerald-500 hover:text-emerald-400 mt-2"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "distributors" && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Distributors Management</h3>
                  
                  {/* Search and Filter */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search distributors by email, business name, or phone..."
                          className="w-full pl-10 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={distributorSearchQuery}
                          onChange={(e) => setDistributorSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <select
                      value={distributorFilterVerified}
                      onChange={(e) => setDistributorFilterVerified(e.target.value)}
                      className="p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    >
                      <option value="all">All Distributors</option>
                      <option value="verified">Verified Only</option>
                      <option value="unverified">Unverified Only</option>
                    </select>
                  </div>

                  {/* Distributor Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Total Distributors</p>
                      <p className="text-2xl font-bold text-white">{distributors.length}</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Verified</p>
                      <p className="text-2xl font-bold text-emerald-500">
                        {distributors.filter(d => d.verified).length}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Unverified</p>
                      <p className="text-2xl font-bold text-yellow-500">
                        {distributors.filter(d => !d.verified).length}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Total Purchases</p>
                      <p className="text-2xl font-bold text-blue-500">
                        {Object.values(distributorPurchases).flat().length}
                      </p>
                    </div>
                  </div>

                  {/* Distributors List */}
                  <div className="space-y-4">
                    {filteredDistributors.map((distributor) => {
                      const distributorPurchasesList = distributorPurchases[distributor.id] || []
                      const totalSpent = distributorPurchasesList.reduce((sum, purchase) => 
                        sum + (purchase.total_amount || 0), 0
                      )
                      
                      return (
                        <div key={distributor.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-medium">
                                  {distributor.business_name?.charAt(0) || distributor.email.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-white">{distributor.business_name || 'No Business Name'}</h4>
                                  <p className="text-sm text-gray-400 flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    {distributor.email}
                                  </p>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  distributor.verified ? 'bg-emerald-900/30 text-emerald-400' : 'bg-yellow-900/30 text-yellow-400'
                                }`}>
                                  {distributor.verified ? 'Verified' : 'Unverified'}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                                {distributor.phone && (
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <Phone className="h-4 w-4" />
                                    <span className="text-white">{distributor.phone}</span>
                                  </div>
                                )}
                                {distributor.address && (
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <MapPin className="h-4 w-4" />
                                    <span className="text-white truncate">{distributor.address}</span>
                                  </div>
                                )}
                                <div className="text-gray-400">
                                  Registered: <span className="text-white">{formatDate(distributor.created_at)}</span>
                                </div>
                              </div>

                              {/* Distributor's Purchases */}
                              {distributorPurchasesList.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-800">
                                  <h5 className="text-sm font-medium text-gray-400 mb-2">Recent Purchases ({distributorPurchasesList.length})</h5>
                                  <div className="space-y-2">
                                    {distributorPurchasesList.slice(0, 3).map(purchase => (
                                      <div key={purchase.id} className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                                        <div>
                                          <p className="text-sm text-white">Purchase #{purchase.id.substring(0, 8)}</p>
                                          <p className="text-xs text-gray-400">
                                            {purchase.quantity_purchased || purchase.quantity} quintals • 
                                            ₹{purchase.price_per_quintal || purchase.price}/quintal
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm text-white">₹{purchase.total_amount || 0}</p>
                                          <span className={`text-xs px-2 py-1 rounded-full ${
                                            purchase.status === 'Purchased' ? 'bg-emerald-900/30 text-emerald-400' :
                                            'bg-yellow-900/30 text-yellow-400'
                                          }`}>
                                            {purchase.status || 'Completed'}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                    {distributorPurchasesList.length > 3 && (
                                      <p className="text-xs text-gray-500 text-center">
                                        +{distributorPurchasesList.length - 3} more purchases
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Distributor Summary */}
                            <div className="ml-4 text-right">
                              <div className="mb-4">
                                <p className="text-2xl font-bold text-white">{formatCurrency(totalSpent)}</p>
                                <p className="text-sm text-gray-400">Total Spent</p>
                              </div>
                              
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => viewUserDetails(distributor, 'distributor')}
                                  className="px-3 py-2 text-sm bg-gray-800 hover:bg-gray-700 text-white rounded-lg border border-gray-700 transition-colors flex items-center gap-2"
                                >
                                  <Eye className="h-4 w-4" />
                                  Details
                                </button>
                                <button
                                  onClick={() => toggleVerification(distributor.id, distributor.verified, 'distributor')}
                                  className={`px-3 py-2 text-sm rounded-lg border transition-colors flex items-center gap-2 ${
                                    distributor.verified 
                                      ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400 border-red-800' 
                                      : 'bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-400 border-emerald-800'
                                  }`}
                                >
                                  {distributor.verified ? (
                                    <>
                                      <UserX className="h-4 w-4" />
                                      Unverify
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="h-4 w-4" />
                                      Verify
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    
                    {filteredDistributors.length === 0 && (
                      <div className="text-center py-8">
                        <Truck className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-400">No distributors found</p>
                        {distributorSearchQuery && (
                          <button
                            onClick={() => setDistributorSearchQuery("")}
                            className="text-sm text-blue-500 hover:text-blue-400 mt-2"
                          >
                            Clear search
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Other Tabs */}
              {activeTab !== "dashboard" && activeTab !== "farmers" && activeTab !== "distributors" && activeTab !== "products" && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      {activeTab === "products" && <Package className="h-8 w-8 text-white" />}
                      {activeTab === "retailers" && <Store className="h-8 w-8 text-white" />}
                      {activeTab === "orders" && <FileText className="h-8 w-8 text-white" />}
                      {activeTab === "billing" && <DollarSign className="h-8 w-8 text-white" />}
                      {activeTab === "security" && <Shield className="h-8 w-8 text-white" />}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
                    </h3>
                    <p className="text-gray-400 mb-6">
                      {activeTab === "products" && `Manage ${products.length} products.`}
                      {activeTab === "retailers" && `Manage ${retailers.length} retailers.`}
                      {activeTab === "orders" && `Track ${orders.length} active orders.`}
                      {activeTab === "billing" && "Handle billing and payments."}
                      {activeTab === "security" && "Configure security settings."}
                    </p>
                    <Button 
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                      onClick={refreshData}
                    >
                      Refresh Data
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}