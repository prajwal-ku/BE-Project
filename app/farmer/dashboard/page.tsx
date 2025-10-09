"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  BarChart3, 
  Package, 
  Truck, 
  DollarSign, 
  Sprout,
  LogOut,
  Crop,
  Plus,
  Scan,
  History,
  Shield,
  User,
  QrCode
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export default function FarmerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [user, setUser] = useState<any>(null)
  const [blockchainProducts, setBlockchainProducts] = useState<any[]>([])
  const [newProduct, setNewProduct] = useState({
    productType: "",
    quantity: 0,
    quality: "A",
    harvestDate: "",
    farmLocation: "Odisha Farm"
  })
  const [trackingId, setTrackingId] = useState("")
  const [trackingResult, setTrackingResult] = useState<any>(null)
  const [qrCodeData, setQrCodeData] = useState<string>("")
  const [generatedProductId, setGeneratedProductId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [farmStats, setFarmStats] = useState([
    { 
      label: "Blockchain Products", 
      value: "0", 
      icon: Shield,
      color: "text-blue-400"
    },
    { 
      label: "Active Crops", 
      value: "0", 
      icon: Crop,
      color: "text-green-400"
    },
    { 
      label: "Total Revenue", 
      value: "₹0", 
      icon: DollarSign,
      color: "text-emerald-400"
    },
  ])
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/auth/login")
        return
      }
      setUser(user)
      await loadBlockchainProducts(user.id)
    }
    checkAuth()
  }, [router, supabase.auth])

  // Update stats whenever products change
  useEffect(() => {
    updateFarmStats(blockchainProducts)
  }, [blockchainProducts])

  // Load products from database
  const loadBlockchainProducts = async (farmerId: string) => {
    try {
      setLoading(true)
      const response = await fetch('/api/blockchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getFarmerProducts',
          data: { farmerId }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setBlockchainProducts(result.products || [])
        // Save to localStorage as backup
        localStorage.setItem('blockchainProducts', JSON.stringify(result.products || []));
      } else {
        console.error('Failed to load products from database:', result.error)
        // Fallback to localStorage if database fails
        const savedProducts = localStorage.getItem('blockchainProducts');
        if (savedProducts) {
          setBlockchainProducts(JSON.parse(savedProducts));
        }
      }
    } catch (error) {
      console.error('Error loading products from database:', error)
      // Fallback to localStorage
      const savedProducts = localStorage.getItem('blockchainProducts');
      if (savedProducts) {
        setBlockchainProducts(JSON.parse(savedProducts));
      }
    } finally {
      setLoading(false)
    }
  }

  // Update farm stats based on products
  const updateFarmStats = (products: any[]) => {
    const totalProducts = products.length;
    
    // Calculate total revenue from products
    const totalRevenue = products.reduce((sum, product) => {
      // Extract price from format like "₹1500/kg" or "₹1500"
      const priceMatch = product.price?.match(/₹([\d,]+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1].replace(/,/g, ''));
        return sum + (price || 0);
      }
      return sum;
    }, 0);
    
    // Count active crops (harvest date in future)
    const activeCrops = products.filter(product => {
      try {
        if (product.harvestDate) {
          const harvestDate = new Date(product.harvestDate);
          return harvestDate > new Date();
        }
        return false;
      } catch {
        return false;
      }
    }).length;

    setFarmStats([
      { 
        label: "Blockchain Products", 
        value: totalProducts.toString(), 
        icon: Shield,
        color: "text-blue-400"
      },
      { 
        label: "Active Crops", 
        value: activeCrops.toString(), 
        icon: Crop,
        color: "text-green-400"
      },
      { 
        label: "Total Revenue", 
        value: totalRevenue >= 1000 ? `₹${(totalRevenue / 1000).toFixed(0)}k` : `₹${totalRevenue}`,
        icon: DollarSign,
        color: "text-emerald-400"
      },
    ]);
  }

  const generateQRCode = async (productId: string) => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(productId)}`;
    return qrCodeUrl;
  }

  // Register product in database
  const registerProductOnBlockchain = async () => {
    if (!newProduct.productType || !newProduct.quantity) {
      alert("Please fill all required fields")
      return
    }

    try {
      setLoading(true)
      
      // Generate product ID and QR code
      const productId = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setGeneratedProductId(productId);
      const qrCodeUrl = await generateQRCode(productId);
      setQrCodeData(qrCodeUrl);

      // Register in database
      const response = await fetch('/api/blockchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'registerProduct',
          data: {
            ...newProduct,
            productId: productId,
            farmerId: user.id,
            farmerName: user.email,
            qrCode: qrCodeUrl
          }
        })
      })

      const result = await response.json()
      
      if (result.success) {
        alert(`✅ Product Registered Successfully!\nProduct ID: ${result.productId}\nTransaction ID: ${result.transactionId}`)
        
        // Reload products to get fresh data from database
        await loadBlockchainProducts(user.id);
        
        // Reset form
        setNewProduct({
          productType: "",
          quantity: 0,
          quality: "A",
          harvestDate: "",
          farmLocation: "Odisha Farm"
        })
        
        setActiveTab("blockchain")
      } else {
        alert(`❌ Registration Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Registration error:', error)
      alert("❌ Failed to register product")
    } finally {
      setLoading(false)
    }
  }

  // Track product from database - FIXED
  const trackProductOnBlockchain = async () => {
    if (!trackingId.trim()) {
      alert("Please enter a product ID")
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/blockchain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'getProductHistory',
          data: { productId: trackingId.trim() }
        })
      })

      const result = await response.json()
      
      if (result.success && result.history) {
        console.log('Tracking result:', result.history);
        setTrackingResult(result.history);
      } else {
        // Fallback to local search if database fails
        const foundProduct = blockchainProducts.find(product => 
          product.productId === trackingId ||
          product.qrCode?.includes(trackingId) ||
          product.productType.toLowerCase().includes(trackingId.toLowerCase())
        );

        if (foundProduct) {
          setTrackingResult(foundProduct);
        } else {
          alert(`❌ Product not found: ${trackingId}`)
          setTrackingResult(null)
        }
      }
    } catch (error) {
      console.error('Tracking error:', error)
      // Fallback to local search
      const foundProduct = blockchainProducts.find(product => 
        product.productId === trackingId ||
        product.qrCode?.includes(trackingId) ||
        product.productType.toLowerCase().includes(trackingId.toLowerCase())
      );

      if (foundProduct) {
        setTrackingResult(foundProduct);
      } else {
        alert(`❌ Product not found: ${trackingId}`)
        setTrackingResult(null)
      }
    } finally {
      setLoading(false)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeData) {
      const link = document.createElement('a');
      link.href = qrCodeData;
      link.download = `qr_code_${generatedProductId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/auth/login")
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
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
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Sprout className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">KrishiSetu</h1>
              <p className="text-sm text-gray-400">Farmer Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "blockchain", label: "Blockchain Products", icon: Shield },
              { id: "orders", label: "Orders", icon: Package },
              { id: "revenue", label: "Revenue", icon: DollarSign },
              { id: "delivery", label: "Delivery", icon: Truck },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-green-600 text-white shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800 mt-4">
          <div className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.email || 'Farmer'}
              </p>
              <p className="text-xs text-gray-400">Farmer Account</p>
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
              {activeTab === "dashboard" && "Farm Dashboard"}
              {activeTab === "blockchain" && "Blockchain Products"}
              {activeTab === "orders" && "Orders"}
              {activeTab === "revenue" && "Revenue & Sales"}
              {activeTab === "delivery" && "Delivery Tracking"}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {activeTab === "dashboard" && "Overview of your farming operations"}
              {activeTab === "blockchain" && "Register and track products on blockchain"}
              {activeTab === "orders" && "Manage your product orders"}
              {activeTab === "revenue" && "Track your sales and earnings"}
              {activeTab === "delivery" && "Monitor product deliveries"}
            </p>
          </div>
        </header>

        <main className="flex-1 p-6 bg-black">
          {loading && (
            <div className="fixed top-0 left-0 w-full h-1 bg-green-500 z-50 animate-pulse"></div>
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Farm Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {farmStats.map((stat, index) => (
                  <div key={index} className="bg-gray-900 rounded-lg border border-gray-800 p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
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
                    { label: "Register Product", icon: Shield, action: () => setActiveTab("blockchain") },
                    { label: "View Orders", icon: Package, action: () => setActiveTab("orders") },
                    { label: "Track Product", icon: Scan, action: () => setActiveTab("blockchain") },
                    { label: "Sales Report", icon: DollarSign, action: () => setActiveTab("revenue") },
                  ].map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      disabled={loading}
                      className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <action.icon className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-white">{action.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent Blockchain Products */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Blockchain Products</h3>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading products from database...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blockchainProducts.slice(0, 3).map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-800 rounded-lg border border-gray-700 transition-colors">
                        <div>
                          <p className="font-medium text-white">{product.productType}</p>
                          <p className="text-sm text-gray-400">{product.quantity} • {product.price}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            product.status === 'Registered' ? 'bg-green-900 text-green-400' :
                            'bg-yellow-900 text-yellow-400'
                          }`}>
                            {product.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{product.currentOwner}</p>
                        </div>
                      </div>
                    ))}
                    
                    {blockchainProducts.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-gray-400">No products registered yet.</p>
                        <p className="text-sm text-gray-500">Register your first product to get started!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "blockchain" && (
            <div className="space-y-6">
              {/* Register New Product */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-500" />
                  Register New Product
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Product Type *</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Organic Rice, Wheat, Tomatoes"
                      className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={newProduct.productType}
                      onChange={(e) => setNewProduct({...newProduct, productType: e.target.value})}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Quantity (kg) *</label>
                    <input 
                      type="number" 
                      placeholder="Enter quantity in kg"
                      className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({...newProduct, quantity: parseInt(e.target.value) || 0})}
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Quality Grade</label>
                    <select 
                      className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={newProduct.quality}
                      onChange={(e) => setNewProduct({...newProduct, quality: e.target.value})}
                      disabled={loading}
                    >
                      <option value="A">Grade A (Premium)</option>
                      <option value="B">Grade B (Standard)</option>
                      <option value="C">Grade C (Economy)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Harvest Date</label>
                    <input 
                      type="date" 
                      className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={newProduct.harvestDate}
                      onChange={(e) => setNewProduct({...newProduct, harvestDate: e.target.value})}
                      disabled={loading}
                    />
                  </div>
                </div>
                <Button 
                  onClick={registerProductOnBlockchain}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Registering Product...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Register Product & Generate QR
                    </>
                  )}
                </Button>

                {/* QR Code Display */}
                {qrCodeData && (
                  <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-green-500" />
                      Generated QR Code for Product: {generatedProductId}
                    </h4>
                    <div className="flex flex-col md:flex-row items-center gap-4">
                      <div className="bg-white p-2 rounded-lg">
                        <img 
                          src={qrCodeData} 
                          alt="QR Code" 
                          className="w-48 h-48"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-white mb-2">
                          <strong>Product ID:</strong> {generatedProductId}
                        </p>
                        <p className="text-sm text-gray-400 mb-4">
                          Scan this QR code to track this product's journey from farm to consumer.
                        </p>
                        <Button 
                          onClick={downloadQRCode}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <QrCode className="h-4 w-4 mr-2" />
                          Download QR Code
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Track Product - FIXED */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Scan className="h-5 w-5 text-green-500" />
                  Track Product Journey
                </h3>
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    placeholder="Enter Product ID or Product Type"
                    className="flex-1 p-3 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    disabled={loading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        trackProductOnBlockchain();
                      }
                    }}
                  />
                  <Button 
                    onClick={trackProductOnBlockchain}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Tracking...
                      </>
                    ) : (
                      <>
                        <Scan className="h-4 w-4 mr-2" />
                        Track Product
                      </>
                    )}
                  </Button>
                </div>

                {/* Quick Search Suggestions */}
                {blockchainProducts.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Quick search from your products:</p>
                    <div className="flex flex-wrap gap-2">
                      {blockchainProducts.slice(0, 5).map((product) => (
                        <button
                          key={product.productId}
                          onClick={() => {
                            setTrackingId(product.productId);
                            trackProductOnBlockchain();
                          }}
                          className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-full border border-gray-700 transition-colors"
                          title={`Click to track: ${product.productType}`}
                        >
                          {product.productType} ({product.productId.slice(0, 8)}...)
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {trackingResult && (
                  <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <h4 className="font-semibold text-white mb-4">Product Tracking Details</h4>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Product ID</p>
                          <p className="text-white font-medium">{trackingResult.productId}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Product Type</p>
                          <p className="text-white font-medium">{trackingResult.productType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Quantity</p>
                          <p className="text-white font-medium">{trackingResult.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Current Owner</p>
                          <p className="text-white font-medium">{trackingResult.currentOwner}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Status</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            trackingResult.status === 'Registered' ? 'bg-green-900 text-green-400' :
                            'bg-yellow-900 text-yellow-400'
                          }`}>
                            {trackingResult.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Price</p>
                          <p className="text-white font-medium">{trackingResult.price}</p>
                        </div>
                      </div>
                      
                      {trackingResult.history && trackingResult.history.length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-gray-400 mb-2">Product Journey History</h5>
                          <div className="space-y-2">
                            {trackingResult.history.map((history: any, index: number) => (
                              <div key={index} className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div className="flex-1">
                                  <p className="text-white text-sm">{history.action}</p>
                                  <p className="text-gray-400 text-xs">By: {history.by} • {new Date(history.timestamp).toLocaleString()}</p>
                                  {history.details && (
                                    <p className="text-gray-500 text-xs">Details: {history.details}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Blockchain Products List */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <History className="h-5 w-5 text-green-500" />
                  My Products ({blockchainProducts.length})
                </h3>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading products from database...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blockchainProducts.map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-4 hover:bg-gray-800 rounded-lg border border-gray-700 transition-colors">
                        <div>
                          <p className="font-medium text-white">{product.productType}</p>
                          <p className="text-sm text-gray-400">ID: {product.productId}</p>
                          <p className="text-xs text-gray-500">
                            Registered: {new Date(product.timestamp).toLocaleDateString()}
                            {product.harvestDate && ` • Harvest: ${new Date(product.harvestDate).toLocaleDateString()}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-white">{product.quantity}</p>
                          <p className="text-sm text-gray-400">{product.price}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            product.status === 'Registered' ? 'bg-green-900 text-green-400' :
                            'bg-yellow-900 text-yellow-400'
                          }`}>
                            {product.status}
                          </span>
                          {product.qrCode && (
                            <div className="mt-2">
                              <img 
                                src={product.qrCode} 
                                alt="QR Code" 
                                className="w-16 h-16 mx-auto border border-gray-600 rounded"
                                title="Product QR Code"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {blockchainProducts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p className="text-gray-400">No products registered yet.</p>
                        <p className="text-sm text-gray-500">Register your first product above to get started!</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Other tabs remain the same */}
          {activeTab === "orders" && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <div className="text-center py-8">
                <Package className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Orders Management</h2>
                <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                  View and manage all your product orders, track order status, 
                  and process new orders from distributors and retailers.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-gray-800 rounded-lg text-center border border-gray-700">
                    <p className="text-2xl font-bold text-white">12</p>
                    <p className="text-sm text-gray-400">Pending Orders</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg text-center border border-gray-700">
                    <p className="text-2xl font-bold text-white">8</p>
                    <p className="text-sm text-gray-400">Completed Today</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg text-center border border-gray-700">
                    <p className="text-2xl font-bold text-white">₹45K</p>
                    <p className="text-sm text-gray-400">Today's Revenue</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "revenue" && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <div className="text-center py-8">
                <DollarSign className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Revenue & Sales</h2>
                <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                  Track your sales performance, analyze revenue patterns, 
                  and monitor your business growth.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 max-w-2xl mx-auto">
                  <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">This Month</h3>
                    <p className="text-3xl font-bold text-green-500">₹85,000</p>
                    <p className="text-sm text-gray-400">+18% from last month</p>
                  </div>
                  <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                    <h3 className="text-lg font-semibold text-white mb-2">Total Revenue</h3>
                    <p className="text-3xl font-bold text-green-500">₹4.2L</p>
                    <p className="text-sm text-gray-400">Year to date</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "delivery" && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <div className="text-center py-8">
                <Truck className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Delivery Tracking</h2>
                <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                  Monitor your product deliveries in real-time, track shipment status, 
                  and ensure timely delivery to your customers.
                </p>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
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