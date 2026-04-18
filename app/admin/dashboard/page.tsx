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
  UserX,
  Copy,
  ExternalLink,
  Clock,
  History,
  Wallet,
  QrCode
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
  wallet_address?: string | null
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
  blockchain_id?: string
  blockchain_status?: string
  blockchain_tx?: string
  farmer?: UserProfile
  sold_at?: string
}

interface Transaction {
  id: string
  product_id: string
  farmer_id: string
  distributor_id: string | null
  retailer_id: string | null
  quantity: number
  price_per_quintal: number
  total_amount: number
  status: string
  transaction_hash: string | null
  purchased_at: string
  product?: Product
  farmer?: UserProfile
  buyer?: UserProfile
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [farmers, setFarmers] = useState<UserProfile[]>([])
  const [distributors, setDistributors] = useState<UserProfile[]>([])
  const [retailers, setRetailers] = useState<UserProfile[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [farmerProducts, setFarmerProducts] = useState<{[key: string]: Product[]}>({})
  const [farmerSales, setFarmerSales] = useState<{[key: string]: Transaction[]}>({})
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalFarmers: 0,
    totalDistributors: 0,
    totalRetailers: 0,
    totalProducts: 0,
    soldProducts: 0,
    activeOrders: 0,
    totalRevenue: 0,
    pendingVerifications: 0,
    pendingDistributorVerifications: 0,
    previousFarmers: 0,
    previousProducts: 0,
    previousOrders: 0
  })
  const [notifications, setNotifications] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterVerified, setFilterVerified] = useState("all")
  const [distributorSearchQuery, setDistributorSearchQuery] = useState("")
  const [distributorFilterVerified, setDistributorFilterVerified] = useState("all")
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [showTransactionDetails, setShowTransactionDetails] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // Check authentication
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
          await supabase.from('profiles').insert({
            id: currentUser.id,
            email: currentUser.email,
            role: 'admin',
            verified: true,
            created_at: new Date().toISOString()
          })
        } else if (profile.role !== 'admin') {
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
        fetchTransactions()
      ])
      await calculateStats()
      await calculateNotifications()
      generateRecentActivities()
      organizeFarmerProducts()
      organizeFarmerSales()
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

  // Fetch products
  const fetchProducts = async () => {
    try {
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

      const { data: farmersData } = await supabase
        .from('profiles')
        .select('id, email, business_name')
        .eq('role', 'farmer')

      const farmersMap = new Map()
      if (farmersData) {
        farmersData.forEach(farmer => {
          farmersMap.set(farmer.id, farmer)
        })
      }

      const productsWithFarmers = productsData.map(product => ({
        ...product,
        farmer: farmersMap.get(product.farmer_id) || null
      }))

      setProducts(productsWithFarmers)
    } catch (error) {
      console.error("Error in fetchProducts:", error)
    }
  }

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select(`
          *,
          product:products(*),
          farmer:profiles!purchases_farmer_id_fkey(*),
          buyer:profiles!purchases_distributor_id_fkey(*)
        `)
        .order('purchased_at', { ascending: false })

      if (!error && purchases) {
        setTransactions(purchases)
      } else {
        // If purchases table doesn't exist yet, create empty array
        setTransactions([])
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
      setTransactions([])
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

  // Organize sales by farmer
  const organizeFarmerSales = () => {
    const farmerSalesMap: {[key: string]: Transaction[]} = {}
    
    transactions.forEach(transaction => {
      if (transaction.farmer_id) {
        if (!farmerSalesMap[transaction.farmer_id]) {
          farmerSalesMap[transaction.farmer_id] = []
        }
        farmerSalesMap[transaction.farmer_id].push(transaction)
      }
    })
    
    setFarmerSales(farmerSalesMap)
  }

  // Calculate statistics
  const calculateStats = async () => {
    try {
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

      // Calculate total revenue from transactions
      let totalRevenue = 0
      if (transactions.length > 0) {
        totalRevenue = transactions.reduce((sum, transaction) => {
          return sum + (transaction.total_amount || 0)
        }, 0)
      }

      // Count sold products
      const soldProducts = products.filter(p => p.blockchain_status === 'sold' || p.status === 'Sold').length

      // Calculate pending verifications
      const pendingFarmerVerifications = farmers.filter(f => !f.verified).length
      const pendingDistributorVerifications = distributors.filter(d => !d.verified).length

      // Previous month data (simulated)
      const previousFarmers = Math.max(0, (farmersCount.count || 0) - Math.floor(Math.random() * 5))
      const previousProducts = Math.max(0, (productsCount.count || 0) - Math.floor(Math.random() * 10))
      const previousOrders = Math.max(0, transactions.length - Math.floor(Math.random() * 3))

      setStats({
        totalFarmers: farmersCount.count || 0,
        totalDistributors: distributorsCount.count || 0,
        totalRetailers: retailersCount.count || 0,
        totalProducts: productsCount.count || 0,
        soldProducts: soldProducts,
        activeOrders: transactions.length,
        totalRevenue,
        pendingVerifications: pendingFarmerVerifications,
        pendingDistributorVerifications,
        previousFarmers,
        previousProducts,
        previousOrders
      })

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
    
    // Recent transactions
    transactions.slice(0, 3).forEach(transaction => {
      activities.push({
        action: `Product sold: ${transaction.product?.product_name || 'Unknown'}`,
        user: transaction.farmer?.business_name || transaction.farmer?.email?.split('@')[0] || 'Farmer',
        time: formatTimeAgo(transaction.purchased_at),
        type: 'sale',
        amount: transaction.total_amount
      })
    })
    
    // Recent farmer registrations
    farmers.slice(0, 2).forEach(farmer => {
      activities.push({
        action: "New farmer registered",
        user: farmer.business_name || farmer.email.split('@')[0],
        time: formatTimeAgo(farmer.created_at),
        type: 'farmer'
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
    
    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    setRecentActivities(activities.slice(0, 5))
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
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
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

  // Toggle verification
  const toggleVerification = async (userId: string, currentVerified: boolean, role: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ verified: !currentVerified })
        .eq('id', userId)

      if (error) throw error

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

  // Copy to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  // View transaction details
  const viewTransactionDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction)
    setShowTransactionDetails(true)
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

  // Dynamic stats for dashboard
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
      label: "Total Sales", 
      value: transactions.length.toString(), 
      change: getChangeInfo(calculatePercentageChange(transactions.length, stats.previousOrders)),
      previous: stats.previousOrders.toString(),
      icon: DollarSign,
      pending: 0,
      action: () => setActiveTab("transactions")
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

  const platformStats = [
    { 
      label: "Total Products", 
      value: stats.totalProducts.toString(), 
      description: "Registered products" 
    },
    { 
      label: "Sold Products", 
      value: stats.soldProducts.toString(), 
      description: "Successfully sold" 
    },
    { 
      label: "Active Products", 
      value: (stats.totalProducts - stats.soldProducts).toString(), 
      description: "Available for sale" 
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
              { id: "transactions", label: "Transactions", icon: FileText },
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
                  {activeTab === "transactions" && `Transactions (${transactions.length})`}
                  {activeTab === "billing" && "Billing System"}
                  {activeTab === "security" && "Security Settings"}
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                  {activeTab === "dashboard" && "Real-time platform overview & analytics"}
                  {activeTab === "transactions" && `View all blockchain transactions and sales`}
                  {activeTab !== "dashboard" && activeTab !== "transactions" && `Manage ${activeTab} on the platform`}
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                {notifications > 0 && (
                  <button 
                    onClick={() => {
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
        <main className="flex-1 p-6 bg-black overflow-y-auto">
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
                                  activity.type === 'sale' ? 'bg-green-500/20' :
                                  'bg-yellow-500/20'
                                }`}>
                                  {activity.type === 'farmer' ? <Users className="h-4 w-4 text-emerald-400" /> :
                                   activity.type === 'sale' ? <DollarSign className="h-4 w-4 text-green-400" /> :
                                   <Package className="h-4 w-4 text-yellow-400" />}
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-white">{activity.action}</p>
                                  <p className="text-xs text-gray-400">by {activity.user}</p>
                                  {activity.amount && (
                                    <p className="text-xs text-green-400">{formatCurrency(activity.amount)}</p>
                                  )}
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
                          <p className="text-sm text-gray-400 mt-1">from {transactions.length} transactions</p>
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
                      {platformStats.map((stat, index) => (
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
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {filteredFarmers.map((farmer) => {
                      const farmerProductsList = farmerProducts[farmer.id] || []
                      const farmerSalesList = farmerSales[farmer.id] || []
                      const totalEarnings = farmerSalesList.reduce((sum, sale) => sum + (sale.total_amount || 0), 0)
                      
                      return (
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
                              
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                                {farmer.phone && (
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <Phone className="h-4 w-4" />
                                    <span className="text-white">{farmer.phone}</span>
                                  </div>
                                )}
                                {farmer.wallet_address && (
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <Wallet className="h-4 w-4" />
                                    <span className="text-white font-mono text-xs">
                                      {farmer.wallet_address.substring(0, 10)}...
                                    </span>
                                  </div>
                                )}
                                <div className="text-gray-400">
                                  Products: <span className="text-white">{farmerProductsList.length}</span>
                                </div>
                                <div className="text-gray-400">
                                  Earnings: <span className="text-green-400">{formatCurrency(totalEarnings)}</span>
                                </div>
                              </div>

                              {/* Farmer's Recent Sales */}
                              {farmerSalesList.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-800">
                                  <h5 className="text-sm font-medium text-gray-400 mb-2">Recent Sales ({farmerSalesList.length})</h5>
                                  <div className="space-y-2">
                                    {farmerSalesList.slice(0, 3).map(sale => (
                                      <div key={sale.id} className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                                        <div>
                                          <p className="text-sm text-white">{sale.product?.product_name || 'Product'}</p>
                                          <p className="text-xs text-gray-400">
                                            {sale.quantity} quintals • ₹{sale.price_per_quintal}/quintal
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm text-green-400">{formatCurrency(sale.total_amount)}</p>
                                          <p className="text-xs text-gray-500">{formatDate(sale.purchased_at)}</p>
                                        </div>
                                      </div>
                                    ))}
                                    {farmerSalesList.length > 3 && (
                                      <p className="text-xs text-gray-500 text-center">
                                        +{farmerSalesList.length - 3} more sales
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 ml-4">
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
                      )
                    })}
                    
                    {filteredFarmers.length === 0 && (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-400">No farmers found</p>
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

                  {/* Distributors List */}
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {filteredDistributors.map((distributor) => {
                      const distributorTransactions = transactions.filter(t => t.distributor_id === distributor.id)
                      const totalSpent = distributorTransactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
                      
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
                                {distributor.wallet_address && (
                                  <div className="flex items-center gap-2 text-gray-400">
                                    <Wallet className="h-4 w-4" />
                                    <span className="text-white font-mono text-xs">
                                      {distributor.wallet_address.substring(0, 10)}...
                                    </span>
                                  </div>
                                )}
                                <div className="text-gray-400">
                                  Purchases: <span className="text-white">{distributorTransactions.length}</span>
                                </div>
                              </div>

                              {/* Distributor's Recent Purchases */}
                              {distributorTransactions.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-800">
                                  <h5 className="text-sm font-medium text-gray-400 mb-2">Recent Purchases ({distributorTransactions.length})</h5>
                                  <div className="space-y-2">
                                    {distributorTransactions.slice(0, 3).map(purchase => (
                                      <div key={purchase.id} className="flex justify-between items-center p-2 bg-gray-800/50 rounded">
                                        <div>
                                          <p className="text-sm text-white">{purchase.product?.product_name || 'Product'}</p>
                                          <p className="text-xs text-gray-400">
                                            {purchase.quantity} quintals • ₹{purchase.price_per_quintal}/quintal
                                          </p>
                                        </div>
                                        <div className="text-right">
                                          <p className="text-sm text-blue-400">{formatCurrency(purchase.total_amount)}</p>
                                          <p className="text-xs text-gray-500">{formatDate(purchase.purchased_at)}</p>
                                        </div>
                                      </div>
                                    ))}
                                    {distributorTransactions.length > 3 && (
                                      <p className="text-xs text-gray-500 text-center">
                                        +{distributorTransactions.length - 3} more purchases
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
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "transactions" && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">All Blockchain Transactions</h3>
                  
                  {/* Transaction Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Total Transactions</p>
                      <p className="text-2xl font-bold text-white">{transactions.length}</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Total Volume</p>
                      <p className="text-2xl font-bold text-emerald-500">
                        {formatCurrency(transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0))}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Farmers Involved</p>
                      <p className="text-2xl font-bold text-blue-500">
                        {Object.keys(farmerSales).length}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Avg Transaction</p>
                      <p className="text-2xl font-bold text-purple-500">
                        {transactions.length > 0 
                          ? formatCurrency(transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0) / transactions.length)
                          : '₹0'}
                      </p>
                    </div>
                  </div>

                  {/* Transactions List */}
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {transactions.map((transaction) => (
                      <div 
                        key={transaction.id} 
                        className="border border-gray-800 rounded-lg p-4 hover:bg-gray-800/50 transition-colors cursor-pointer"
                        onClick={() => viewTransactionDetails(transaction)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-white">
                                  {transaction.product?.product_name || 'Product'}
                                </h4>
                                <p className="text-sm text-gray-400">
                                  Transaction #{transaction.id.substring(0, 8)}
                                </p>
                              </div>
                              <span className="px-2 py-1 text-xs rounded-full bg-green-900/30 text-green-400">
                                {transaction.status || 'Completed'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm mb-3">
                              <div>
                                <p className="text-gray-400">Farmer</p>
                                <p className="text-white">
                                  {transaction.farmer?.business_name || transaction.farmer?.email?.split('@')[0] || 'Unknown'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Buyer</p>
                                <p className="text-white">
                                  {transaction.buyer?.business_name || transaction.buyer?.email?.split('@')[0] || 'Distributor'}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-400">Quantity</p>
                                <p className="text-white">{transaction.quantity} quintals</p>
                              </div>
                              <div>
                                <p className="text-gray-400">Total Amount</p>
                                <p className="text-emerald-400 font-semibold">{formatCurrency(transaction.total_amount)}</p>
                              </div>
                            </div>

                            {transaction.transaction_hash && (
                              <div className="mt-2 pt-2 border-t border-gray-800">
                                <p className="text-xs text-gray-500 flex items-center gap-2">
                                  <Shield className="h-3 w-3" />
                                  Blockchain TX: {transaction.transaction_hash.substring(0, 30)}...
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      copyToClipboard(transaction.transaction_hash!)
                                    }}
                                    className="text-blue-400 hover:text-blue-300"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </button>
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-xs text-gray-500">{formatDate(transaction.purchased_at)}</p>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                viewTransactionDetails(transaction)
                              }}
                              className="mt-2 px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {transactions.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-400">No transactions yet</p>
                        <p className="text-sm text-gray-500">Transactions will appear here when products are sold on the blockchain</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "products" && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Products Overview</h3>
                  
                  {/* Product Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Total Products</p>
                      <p className="text-2xl font-bold text-white">{products.length}</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Blockchain Verified</p>
                      <p className="text-2xl font-bold text-emerald-500">
                        {products.filter(p => p.blockchain_verified).length}
                      </p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Sold Products</p>
                      <p className="text-2xl font-bold text-blue-500">{stats.soldProducts}</p>
                    </div>
                    <div className="bg-gray-800/50 p-4 rounded-lg">
                      <p className="text-sm text-gray-400">Available</p>
                      <p className="text-2xl font-bold text-green-500">{stats.totalProducts - stats.soldProducts}</p>
                    </div>
                  </div>

                  {/* Products List */}
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {products.map((product) => (
                      <div key={product.id} className="border border-gray-800 rounded-lg p-4 hover:bg-gray-800/50 transition-colors">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h4 className="font-semibold text-white">{product.product_name}</h4>
                              {product.blockchain_verified && (
                                <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Shield className="h-3 w-3" />
                                  Blockchain
                                </span>
                              )}
                              {product.blockchain_status === 'sold' && (
                                <span className="text-xs bg-blue-900 text-blue-400 px-2 py-0.5 rounded-full">
                                  Sold
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">
                              {product.category} • {product.quantity} quintals • ₹{product.price_per_quintal}/quintal
                            </p>
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {product.farm_location}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              Farmer: {product.farmer?.business_name || product.farmer?.email || 'Unknown'}
                            </p>
                            {product.blockchain_id && (
                              <p className="text-xs text-gray-500 mt-1">
                                Blockchain ID: {product.blockchain_id}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-white font-semibold">
                              {formatCurrency(product.quantity * product.price_per_quintal)}
                            </p>
                            <p className="text-xs text-gray-500">{formatDate(product.created_at)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {products.length === 0 && (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                        <p className="text-gray-400">No products registered yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Other Tabs Placeholder */}
              {(activeTab === "retailers" || activeTab === "billing" || activeTab === "security") && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      {activeTab === "retailers" && <Store className="h-8 w-8 text-white" />}
                      {activeTab === "billing" && <DollarSign className="h-8 w-8 text-white" />}
                      {activeTab === "security" && <Shield className="h-8 w-8 text-white" />}
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Management
                    </h3>
                    <p className="text-gray-400">
                      {activeTab === "retailers" && `Manage ${retailers.length} retailers on the platform.`}
                      {activeTab === "billing" && "Handle billing and payments."}
                      {activeTab === "security" && "Configure security settings."}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Transaction Details Modal */}
      {showTransactionDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" />
                Transaction Details
              </h3>
              <button
                onClick={() => setShowTransactionDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Transaction ID</p>
                  <p className="text-white font-mono text-sm break-all">{selectedTransaction.id}</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Status</p>
                  <p className="text-green-400 font-medium">{selectedTransaction.status || 'Completed'}</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Product</p>
                  <p className="text-white">{selectedTransaction.product?.product_name}</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Category</p>
                  <p className="text-white">{selectedTransaction.product?.category}</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Farmer</p>
                  <p className="text-white">{selectedTransaction.farmer?.business_name || selectedTransaction.farmer?.email}</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Buyer</p>
                  <p className="text-white">{selectedTransaction.buyer?.business_name || selectedTransaction.buyer?.email || 'Distributor'}</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Quantity</p>
                  <p className="text-white">{selectedTransaction.quantity} quintals</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Price per Quintal</p>
                  <p className="text-white">₹{selectedTransaction.price_per_quintal}</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Total Amount</p>
                  <p className="text-emerald-400 font-bold text-lg">{formatCurrency(selectedTransaction.total_amount)}</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Purchase Date</p>
                  <p className="text-white">{formatDate(selectedTransaction.purchased_at)}</p>
                </div>
                {selectedTransaction.product?.farm_location && (
                  <div className="col-span-2 p-3 bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-400">Farm Location</p>
                    <p className="text-white flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {selectedTransaction.product.farm_location}
                    </p>
                  </div>
                )}
                {selectedTransaction.transaction_hash && (
                  <div className="col-span-2 p-3 bg-gray-800 rounded-lg">
                    <p className="text-xs text-gray-400">Blockchain Transaction Hash</p>
                    <p className="text-white font-mono text-sm break-all flex items-center gap-2">
                      {selectedTransaction.transaction_hash}
                      <button 
                        onClick={() => copyToClipboard(selectedTransaction.transaction_hash!)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setShowTransactionDetails(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}