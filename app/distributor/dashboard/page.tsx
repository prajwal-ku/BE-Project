"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { 
  BarChart3, 
  Package, 
  Truck, 
  DollarSign, 
  LogOut,
  Shield,
  User,
  MapPin,
  Edit,
  Save,
  X,
  Mail,
  Phone,
  Building,
  Warehouse,
  Users,
  Search,
  ShoppingCart,
  Navigation,
  Target,
  Route,
  Loader2,
  Globe,
  Layers,
  Map as MapIcon,
  AlertCircle,
  Compass,
  LocateFixed,
  ZoomIn,
  ZoomOut,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Crosshair,
  Copy,
  Wallet,
  ShieldCheck,
  TrendingUp,
  Calendar,
  Award,
  Star,
  TrendingDown,
  ExternalLink,
  QrCode,
  Info
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { MetaMaskConnect } from "@/components/MetaMaskConnect"
import { blockchainService } from "@/services/blockchainService"

// Dynamically import Leaflet to avoid SSR issues
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] rounded-xl border border-gray-700 overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-400">Loading interactive map...</p>
      </div>
    </div>
  )
})

// Helper function to geocode location
const geocodeLocation = async (location: string): Promise<{lat: number, lng: number} | null> => {
  const locationLower = location.toLowerCase()
  
  const locationMap: {[key: string]: {lat: number, lng: number}} = {
    'mumbai': { lat: 19.0760, lng: 72.8777 },
    'delhi': { lat: 28.6139, lng: 77.2090 },
    'bangalore': { lat: 12.9716, lng: 77.5946 },
    'hyderabad': { lat: 17.3850, lng: 78.4867 },
    'ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'chennai': { lat: 13.0827, lng: 80.2707 },
    'kolkata': { lat: 22.5726, lng: 88.3639 },
    'pune': { lat: 18.5204, lng: 73.8567 },
    'jaipur': { lat: 26.9124, lng: 75.7873 },
    'lucknow': { lat: 26.8467, lng: 80.9462 },
    'nagpur': { lat: 21.1458, lng: 79.0882 },
    'indore': { lat: 22.7196, lng: 75.8577 },
    'bhopal': { lat: 23.2599, lng: 77.4126 },
    'visakhapatnam': { lat: 17.6868, lng: 83.2185 },
    'patna': { lat: 25.5941, lng: 85.1376 },
    'vadodara': { lat: 22.3072, lng: 73.1812 },
    'guwahati': { lat: 26.1445, lng: 91.7362 },
    'chandigarh': { lat: 30.7333, lng: 76.7794 },
    'mysore': { lat: 12.2958, lng: 76.6394 },
    'coimbatore': { lat: 11.0168, lng: 76.9558 },
    'kochi': { lat: 9.9312, lng: 76.2673 },
    'thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
    'amritsar': { lat: 31.6340, lng: 74.8723 },
    'jodhpur': { lat: 26.2389, lng: 73.0243 },
    'udaipur': { lat: 24.5854, lng: 73.7125 },
    'kanpur': { lat: 26.4499, lng: 80.3319 },
    'agra': { lat: 27.1767, lng: 78.0081 },
    'varanasi': { lat: 25.3176, lng: 82.9739 },
    'ranchi': { lat: 23.3441, lng: 85.3096 },
    'raipur': { lat: 21.2514, lng: 81.6296 },
    'bhubaneswar': { lat: 20.2961, lng: 85.8245 },
    'goa': { lat: 15.2993, lng: 74.1240 },
    'shimla': { lat: 31.1048, lng: 77.1734 },
    'dehradun': { lat: 30.3165, lng: 78.0322 },
    'srinagar': { lat: 34.0837, lng: 74.7973 }
  }
  
  for (const [key, coords] of Object.entries(locationMap)) {
    if (locationLower.includes(key)) {
      return coords
    }
  }
  
  return { lat: 20.5937, lng: 78.9629 }
}

// Helper function to extract coordinates from product data
const extractCoordinates = (product: any): {lat: number, lng: number} | null => {
  if (!product) return null
  
  if (product.farm_coordinates && typeof product.farm_coordinates === 'string') {
    try {
      const match = product.farm_coordinates.match(/POINT\(([^ ]+) ([^)]+)\)/)
      if (match && match[1] && match[2]) {
        return {
          lng: parseFloat(match[1]),
          lat: parseFloat(match[2])
        }
      }
    } catch (e) {
      console.error('Error parsing farm_coordinates:', e)
    }
  }
  
  if (product.quality_metrics) {
    try {
      if (typeof product.quality_metrics === 'object' && product.quality_metrics !== null) {
        if (product.quality_metrics.location?.coordinates) {
          const { lat, lng } = product.quality_metrics.location.coordinates
          if (typeof lat === 'number' && typeof lng === 'number') {
            return { lat, lng }
          }
        }
      }
    } catch (e) {}
  }
  
  return null
}

export default function DistributorDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [farmerProducts, setFarmerProducts] = useState<any[]>([])
  const [purchasedProducts, setPurchasedProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [trackingId, setTrackingId] = useState("")
  const [trackingResult, setTrackingResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [purchaseQuantity, setPurchaseQuantity] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    phone: "",
    address: "",
    business_name: "",
  })
  const [mapLoading, setMapLoading] = useState(false)
  
  // Blockchain states
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [blockchainReady, setBlockchainReady] = useState(false)
  const [blockchainPurchasing, setBlockchainPurchasing] = useState(false)
  
  const [distributorStats, setDistributorStats] = useState([
    { label: "Available Products", value: "0", icon: Package, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
    { label: "Total Purchased", value: "0 q", icon: ShoppingCart, color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/20" },
    { label: "Total Spent", value: "₹0", icon: DollarSign, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
  ])
  
  const router = useRouter()
  const supabase = createClient()

  const [mapMarkers, setMapMarkers] = useState<Array<{
    id: string,
    lat: number,
    lng: number,
    name: string,
    productName: string,
    productId: string,
    farmerId: string,
    type: 'farm' | 'warehouse',
    status: 'available' | 'active',
    quantity: number,
    price: number,
    hasGPS: boolean,
    blockchainId?: number
  }>>([])
  const [selectedMarker, setSelectedMarker] = useState<any>(null)

  const productCategories = [
    "All", "Cereals", "Pulses", "Vegetables", "Fruits", "Spices", 
    "Oilseeds", "Tubers", "Medicinal Plants", "Flowers", "Other"
  ]

  const isDistributorVerified = () => profile?.verified === true

  // Handle wallet connection
  const handleWalletConnected = async (account: string) => {
    setWalletConnected(true)
    setWalletAddress(account)
    const initialized = await blockchainService.init()
    setBlockchainReady(initialized)
    
    if (user) {
      await supabase
        .from('profiles')
        .update({ wallet_address: account })
        .eq('id', user.id)
    }
  }

  const handleWalletDisconnected = () => {
    setWalletConnected(false)
    setWalletAddress(null)
    setBlockchainReady(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  // Load product locations
  const loadProductLocations = async () => {
    try {
      setMapLoading(true)
      const markers = []
      
      for (const product of farmerProducts) {
        if (product?.farm_location && product?.quantity > 0) {
          const coords = extractCoordinates(product)
          
          if (coords) {
            markers.push({
              id: `farm-${product.id}`,
              lat: coords.lat,
              lng: coords.lng,
              name: product.farm_location,
              productName: product.product_name,
              productId: product.id,
              farmerId: product.farmer_id,
              type: 'farm',
              status: 'available',
              quantity: product.quantity,
              price: product.price_per_quintal,
              hasGPS: true,
              blockchainId: product.blockchain_id
            })
          } else {
            const approxCoords = await geocodeLocation(product.farm_location)
            if (approxCoords) {
              markers.push({
                id: `farm-${product.id}`,
                lat: approxCoords.lat,
                lng: approxCoords.lng,
                name: product.farm_location,
                productName: product.product_name,
                productId: product.id,
                farmerId: product.farmer_id,
                type: 'farm',
                status: 'available',
                quantity: product.quantity,
                price: product.price_per_quintal,
                hasGPS: false,
                blockchainId: product.blockchain_id
              })
            }
          }
        }
      }
      
      if (profile?.address) {
        const warehouseCoords = await geocodeLocation(profile.address)
        if (warehouseCoords) {
          markers.push({
            id: 'warehouse-main',
            lat: warehouseCoords.lat,
            lng: warehouseCoords.lng,
            name: profile.business_name || 'Your Warehouse',
            productName: 'Distribution Center',
            productId: 'warehouse',
            farmerId: '',
            type: 'warehouse',
            status: 'active',
            quantity: purchasedProducts.reduce((sum, p) => sum + (p.quantity_purchased || 0), 0),
            price: 0,
            hasGPS: false
          })
        }
      }
      
      setMapMarkers(markers)
    } catch (error) {
      console.error('Error loading product locations:', error)
    } finally {
      setMapLoading(false)
    }
  }

  useEffect(() => {
    if (farmerProducts.length > 0) {
      loadProductLocations()
    }
  }, [farmerProducts, profile])

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.replace("/auth/login")
          return
        }
        
        const userRole = authUser.user_metadata?.role || 'distributor'
        if (userRole !== 'distributor') {
          router.replace("/auth/login")
          return
        }
        
        setUser({ ...authUser, role: userRole })
        await loadDistributorProfile(authUser.id, userRole)
        await loadFarmerProducts()
        await loadPurchasedProducts(authUser.id)
        
        const { data: profileData } = await supabase
          .from('profiles')
          .select('wallet_address')
          .eq('id', authUser.id)
          .single()
        
        if (profileData?.wallet_address) {
          setWalletAddress(profileData.wallet_address)
          setWalletConnected(true)
          await blockchainService.init()
          setBlockchainReady(true)
        }
      } catch (error) {
        console.error('Auth error:', error)
        router.replace("/auth/login")
      }
    }
    checkAuth()
  }, [router, supabase.auth])

  const loadDistributorProfile = async (userId: string, userRole: string) => {
    try {
      setProfileLoading(true)
      
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !profileData) {
        const simpleProfile = {
          id: userId,
          email: user?.email || "",
          role: userRole,
          phone: "",
          address: "",
          business_name: "Distributor Business",
          verified: false
        }
        
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert([simpleProfile])
          .select()
          .single()
        
        setProfile(newProfile || simpleProfile)
      } else {
        setProfile(profileData)
        setProfileForm({
          phone: profileData.phone || "",
          address: profileData.address || "",
          business_name: profileData.business_name || ""
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const updateProfile = async () => {
    if (!user?.id) return

    try {
      setProfileLoading(true)
      
      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .upsert([{
          id: user.id,
          email: user.email,
          role: user.role,
          phone: profileForm.phone,
          address: profileForm.address,
          business_name: profileForm.business_name,
          verified: profile?.verified || false,
          wallet_address: walletAddress
        }])
        .select()
        .single()

      if (!error && updatedProfile) {
        setProfile(updatedProfile)
        setIsEditingProfile(false)
        alert('Profile updated successfully!')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const loadFarmerProducts = async () => {
    try {
      setLoading(true)
      
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .gt('quantity', 0)
        .neq('status', 'Sold Out')
        .order('created_at', { ascending: false })

      if (error) throw error
      setFarmerProducts(products || [])
    } catch (error) {
      console.error('Error loading products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load purchased products
  const loadPurchasedProducts = async (distributorId: string) => {
    try {
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('distributor_id', distributorId)
        .order('purchased_at', { ascending: false })

      if (error) {
        console.error('Error loading purchases:', error)
        return
      }

      const purchasesWithProducts = []
      for (const purchase of purchases || []) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', purchase.product_id)
          .single()

        if (!productError) {
          purchasesWithProducts.push({
            ...purchase,
            product: product
          })
        } else {
          purchasesWithProducts.push({
            ...purchase,
            product: null
          })
        }
      }

      setPurchasedProducts(purchasesWithProducts)
    } catch (error) {
      console.error('Error in loadPurchasedProducts:', error)
    }
  }

  // Purchase product - FIXED for full quantity only
  const purchaseProduct = async (product: any) => {
    if (!isDistributorVerified()) {
      alert("❌ You need to be verified by the admin before purchasing products.")
      return
    }

    if (!walletConnected || !blockchainReady) {
      alert("❌ Please connect your MetaMask wallet first")
      return
    }

    // Always purchase the full quantity
    const quantityToPurchase = product.quantity

    try {
      setBlockchainPurchasing(true)
      setLoading(true)

      console.log('🟡 Starting purchase...')
      console.log('Product:', product.product_name)
      console.log('Full Quantity:', quantityToPurchase)

      // Register purchase on blockchain
      const blockchainResult = await blockchainService.purchaseProduct(
        product.blockchain_id || product.id,
        quantityToPurchase,
        product.price_per_quintal
      )

      if (!blockchainResult.success) {
        throw new Error(blockchainResult.error || 'Blockchain transaction failed')
      }

      console.log('✅ Blockchain purchase successful:', blockchainResult)

      // Update product to sold out
      const { error: updateError } = await supabase
        .from('products')
        .update({
          quantity: 0,
          current_owner: 'Distributor',
          status: 'Sold Out',
          blockchain_tx: blockchainResult.transactionHash,
          blockchain_verified: true
        })
        .eq('id', product.id)

      if (updateError) {
        console.error('Error updating product:', updateError)
        throw updateError
      }

      // Create purchase record
      const purchaseData = {
        product_id: product.id,
        distributor_id: user.id,
        quantity_purchased: quantityToPurchase,
        price_per_quintal: product.price_per_quintal,
        total_amount: quantityToPurchase * product.price_per_quintal,
        status: 'Purchased',
        purchased_at: new Date().toISOString()
      }

      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert([purchaseData])

      if (purchaseError) {
        console.error('Error creating purchase:', purchaseError)
        throw purchaseError
      }

      alert(`✅ Purchase Successful!\n\n` +
            `Product: ${product.product_name}\n` +
            `Quantity: ${quantityToPurchase} quintals\n` +
            `Total: ₹${quantityToPurchase * product.price_per_quintal}\n` +
            `Transaction: ${blockchainResult.transactionHash?.substring(0, 10)}...`)
      
      // Reload all data
      await loadFarmerProducts()
      await loadPurchasedProducts(user.id)
      await loadProductLocations()
      
      setSelectedProduct(null)
      setPurchaseQuantity(1)

    } catch (error: any) {
      console.error('Purchase error:', error)
      alert(`❌ Purchase failed: ${error.message || 'Please check console for details'}`)
    } finally {
      setBlockchainPurchasing(false)
      setLoading(false)
    }
  }

  // Handle product click - set full quantity
  const handleProductClick = (product: any) => {
    setSelectedProduct(product)
    setPurchaseQuantity(product.quantity) // Set to full quantity
  }

  const trackProductOnBlockchain = async () => {
    if (!trackingId.trim()) {
      alert("Please enter a product ID or batch number")
      return
    }

    try {
      setTrackingLoading(true)
      setTrackingResult(null)
      
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('batch_number', trackingId.trim())
        .single()

      if (error) {
        const { data: productById } = await supabase
          .from('products')
          .select('*')
          .eq('id', trackingId.trim())
          .single()

        if (productById) {
          setTrackingResult(productById)
        } else {
          alert(`❌ Product not found: ${trackingId}`)
        }
      } else {
        setTrackingResult(product)
      }
    } catch (error) {
      console.error('Tracking error:', error)
      alert(`❌ Error tracking product`)
    } finally {
      setTrackingLoading(false)
    }
  }

  const updateDistributorStats = () => {
    const totalAvailable = farmerProducts.length
    const totalPurchasedQty = purchasedProducts.reduce((sum, p) => sum + (p.quantity_purchased || 0), 0)
    const totalSpent = purchasedProducts.reduce((sum, p) => sum + (p.total_amount || 0), 0)

    setDistributorStats([
      { label: "Available Products", value: totalAvailable.toString(), icon: Package, color: "text-blue-400", bgColor: "bg-blue-500/10", borderColor: "border-blue-500/20" },
      { label: "Total Purchased", value: totalPurchasedQty + ' q', icon: ShoppingCart, color: "text-green-400", bgColor: "bg-green-500/10", borderColor: "border-green-500/20" },
      { label: "Total Spent", value: totalSpent >= 100000 ? `₹${(totalSpent/100000).toFixed(1)}L` : `₹${totalSpent.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/20" },
    ])
  }

  useEffect(() => {
    updateDistributorStats()
  }, [farmerProducts, purchasedProducts])

  const filteredProducts = farmerProducts.filter(product => {
    if (product.quantity <= 0) return false
    const matchesSearch = searchTerm === "" || 
      product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.farm_location?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || 
      product.category?.toLowerCase() === selectedCategory.toLowerCase()
    return matchesSearch && matchesCategory
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.replace('/auth/login')
  }

  const getQualityGrade = (product: any) => {
    if (!product?.quality_metrics) return null
    try {
      if (typeof product.quality_metrics === 'string') {
        const metrics = JSON.parse(product.quality_metrics)
        return metrics.grade || null
      }
      return product.quality_metrics.grade || null
    } catch {
      return null
    }
  }

  const getGradeColor = (grade: string) => {
    switch(grade) {
      case 'A': return 'bg-green-900 text-green-400 border-green-700'
      case 'B': return 'bg-blue-900 text-blue-400 border-blue-700'
      case 'C': return 'bg-yellow-900 text-yellow-400 border-yellow-700'
      case 'D': return 'bg-orange-900 text-orange-400 border-orange-700'
      case 'Organic': return 'bg-purple-900 text-purple-400 border-purple-700'
      default: return 'bg-gray-800 text-gray-400 border-gray-700'
    }
  }

  const renderVerificationBanner = () => {
    if (isDistributorVerified()) {
      return (
        <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-800 rounded-xl p-5 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="text-green-400 font-semibold text-lg">✓ Verified Distributor</p>
            <p className="text-sm text-green-300/70">Your account is verified. You can now purchase products directly from farmers.</p>
          </div>
        </div>
      )
    } else {
      return (
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-800 rounded-xl p-5 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Clock className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex-1">
            <p className="text-yellow-400 font-semibold text-lg">⏳ Pending Verification</p>
            <p className="text-sm text-yellow-300/70">
              Complete your profile and wait for admin approval to purchase products.
            </p>
          </div>
        </div>
      )
    }
  }

  const renderRoutesSection = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                Farm Locations Map
              </h3>
              <p className="text-sm text-gray-400 mt-1">Real GPS data from registered farms</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm px-3 py-1.5 bg-blue-900/30 text-blue-400 rounded-full flex items-center gap-2">
                <MapIcon className="h-3.5 w-3.5" />
                {mapLoading ? 'Loading...' : `${mapMarkers.length} Locations`}
              </span>
            </div>
          </div>
          
          {mapLoading ? (
            <div className="h-[500px] rounded-xl border border-gray-700 flex items-center justify-center bg-gray-800">
              <div className="text-center">
                <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-3" />
                <p className="text-gray-400">Loading farm locations...</p>
              </div>
            </div>
          ) : (
            <LeafletMap 
              markers={mapMarkers}
              selectedMarker={selectedMarker}
              onMarkerSelect={setSelectedMarker}
            />
          )}

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gradient-to-br from-green-900/20 to-emerald-900/20 rounded-xl border border-green-800/30">
              <h4 className="font-medium text-white mb-2">Active Farms</h4>
              <p className="text-3xl font-bold text-green-400">{mapMarkers.filter(m => m.type === 'farm').length}</p>
              <p className="text-sm text-gray-400 mt-1">With available products</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-800/30">
              <h4 className="font-medium text-white mb-2">GPS Verified</h4>
              <p className="text-3xl font-bold text-blue-400">{mapMarkers.filter(m => m.hasGPS).length}</p>
              <p className="text-sm text-gray-400 mt-1">Exact farm locations</p>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-xl border border-purple-800/30">
              <h4 className="font-medium text-white mb-2">Blockchain Verified</h4>
              <p className="text-3xl font-bold text-purple-400">{mapMarkers.filter(m => m.blockchainId).length}</p>
              <p className="text-sm text-gray-400 mt-1">On-chain products</p>
            </div>
          </div>

          {selectedMarker && selectedMarker.type === 'farm' && (
            <div className="mt-6 p-5 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-xl border border-blue-500/30">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-white text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-500" />
                  {selectedMarker.productName}
                </h4>
                <div className="flex gap-2">
                  {selectedMarker.hasGPS && (
                    <span className="text-xs bg-blue-900 text-blue-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Crosshair className="h-3 w-3" /> GPS Verified
                    </span>
                  )}
                  {selectedMarker.blockchainId && (
                    <span className="text-xs bg-purple-900 text-purple-400 px-2.5 py-1 rounded-full flex items-center gap-1">
                      <Shield className="h-3 w-3" /> Blockchain
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Location</p>
                  <p className="text-white font-medium mt-1">{selectedMarker.name.substring(0, 50)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Available Stock</p>
                  <p className="text-white font-medium mt-1">{selectedMarker.quantity} quintals</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Price per Quintal</p>
                  <p className="text-white font-medium mt-1">₹{selectedMarker.price}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Total Value</p>
                  <p className="text-white font-medium mt-1">₹{selectedMarker.quantity * selectedMarker.price}</p>
                </div>
              </div>
              {isDistributorVerified() && walletConnected && (
                <Button
                  onClick={() => {
                    const product = farmerProducts.find(p => p.id === selectedMarker.productId)
                    if (product) handleProductClick(product)
                  }}
                  className="mt-5 w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase from this Farm
                </Button>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-gray-800/50 rounded-xl">
            <h5 className="font-medium text-white mb-3">Map Legend</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>
                <span className="text-sm text-gray-300">Farm (GPS)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg"></div>
                <span className="text-sm text-gray-300">Farm (Approx)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full shadow-lg"></div>
                <span className="text-sm text-gray-300">Blockchain Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full shadow-lg"></div>
                <span className="text-sm text-gray-300">Your Warehouse</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-gray-900 to-gray-950 border-r border-gray-800 flex flex-col">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">KrishiSetu</h1>
              <p className="text-xs text-gray-400">Distributor Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4 flex-1">
          <div className="space-y-1">
            {[
              { id: "dashboard", label: "Dashboard", icon: BarChart3 },
              { id: "marketplace", label: "Farm Products", icon: Package },
              { id: "my-purchases", label: "My Purchases", icon: ShoppingCart },
              { id: "tracking", label: "Product Tracking", icon: Shield },
              { id: "routes", label: "Farm Locations", icon: MapPin },
              { id: "retailers", label: "Retailers", icon: Users },
              { id: "revenue", label: "Revenue", icon: DollarSign },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* MetaMask Connect */}
        <div className="p-4 border-t border-gray-800">
          <MetaMaskConnect 
            onConnected={handleWalletConnected}
            onDisconnected={handleWalletDisconnected}
            showBalance={true}
          />
          
          {walletConnected && walletAddress && (
            <div className="mt-3 p-3 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 border border-blue-800 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                <span className="text-xs font-medium text-blue-400">Blockchain Ready</span>
              </div>
              <p className="text-xs text-gray-400 truncate font-mono">{walletAddress.substring(0, 10)}...{walletAddress.substring(38)}</p>
            </div>
          )}
        </div>

        {/* Profile Section */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
              <User className="h-3 w-3" /> Profile
            </h3>
            <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="text-gray-500 hover:text-white transition-colors">
              {isEditingProfile ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </button>
          </div>

          {isEditingProfile ? (
            <div className="space-y-3">
              <input type="text" value={profileForm.business_name} onChange={(e) => setProfileForm(prev => ({ ...prev, business_name: e.target.value }))} placeholder="Business Name" className="w-full p-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500" />
              <input type="text" value={profileForm.phone} onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))} placeholder="Phone" className="w-full p-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500" />
              <textarea value={profileForm.address} onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))} placeholder="Address" rows={2} className="w-full p-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-blue-500" />
              <Button onClick={updateProfile} size="sm" className="w-full bg-gradient-to-r from-blue-600 to-cyan-600"><Save className="h-3 w-3 mr-1" /> Save Changes</Button>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm font-medium text-white truncate">{profile?.business_name || user?.email?.split('@')[0] || 'Distributor'}</p>
              {profile?.phone && <p className="text-xs text-gray-400 flex items-center gap-1"><Phone className="h-3 w-3" /> {profile.phone}</p>}
              <div className="flex items-center gap-2 pt-1">
                <span className={`text-xs px-2 py-1 rounded-full ${profile?.verified ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'}`}>
                  {profile?.verified ? '✓ Verified' : '⏳ Pending'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Section with Logout */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 p-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.business_name || 'Distributor'}</p>
              <p className="text-xs text-gray-400">Distributor Account</p>
            </div>
            <button onClick={handleLogout} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-gradient-to-r from-gray-900 to-gray-950 border-b border-gray-800 px-8 py-5">
          <h1 className="text-2xl font-bold text-white">
            {activeTab === "dashboard" && "Dashboard Overview"}
            {activeTab === "marketplace" && "Farm Products Marketplace"}
            {activeTab === "my-purchases" && "My Purchases History"}
            {activeTab === "tracking" && "Product Tracking"}
            {activeTab === "routes" && "Farm Locations Map"}
            {activeTab === "retailers" && "Retailer Network"}
            {activeTab === "revenue" && "Revenue Analytics"}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {activeTab === "dashboard" && "Welcome back! Here's your distribution overview"}
            {activeTab === "marketplace" && `${farmerProducts.length} products available from verified farmers`}
            {activeTab === "my-purchases" && `${purchasedProducts.length} purchases made`}
            {activeTab === "tracking" && "Track product authenticity on blockchain"}
            {activeTab === "routes" && `${mapMarkers.filter(m => m.hasGPS).length} GPS verified farm locations`}
          </p>
        </header>

        <main className="flex-1 p-8 bg-gradient-to-b from-black to-gray-950 overflow-y-auto">
          {loading && <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500 z-50 animate-pulse" />}
          {renderVerificationBanner()}

          {/* Wallet Warning */}
          {!walletConnected && activeTab === "marketplace" && (
            <div className="mb-6 p-4 bg-gradient-to-r from-orange-900/30 to-red-900/30 border border-orange-800 rounded-xl">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-orange-500" />
                <div className="flex-1">
                  <p className="text-orange-400 font-medium">Connect MetaMask to purchase products on blockchain</p>
                  <p className="text-sm text-orange-300/70">Blockchain integration ensures transparent and secure transactions</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {distributorStats.map((stat, index) => (
                  <div key={index} className={`${stat.bgColor} ${stat.borderColor} border rounded-xl p-6 transition-all hover:scale-105 duration-300`}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm text-gray-400 mb-1">{stat.label}</p>
                        <p className="text-3xl font-bold text-white">{stat.value}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bgColor} border ${stat.borderColor}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Products Section */}
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Recent Products</h3>
                    <p className="text-sm text-gray-400 mt-1">Latest additions from farmers</p>
                  </div>
                  <button onClick={() => setActiveTab("marketplace")} className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">View all <ExternalLink className="h-3 w-3" /></button>
                </div>
                
                {farmerProducts.slice(0, 5).map((product, idx) => {
                  const qualityGrade = getQualityGrade(product)
                  const hasGPS = extractCoordinates(product) !== null
                  return (
                    <div key={product.id} className={`p-4 bg-gray-800/50 rounded-lg mb-3 transition-all hover:bg-gray-800 border border-gray-700/50 ${idx === 0 ? 'border-l-4 border-l-blue-500' : ''}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <p className="font-semibold text-white">{product.product_name}</p>
                            {product.blockchain_verified && <span className="text-xs bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-purple-700"><Shield className="h-3 w-3" /> Blockchain</span>}
                            {hasGPS && <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1 border border-blue-700"><Crosshair className="h-3 w-3" /> GPS</span>}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div><p className="text-gray-500 text-xs">Category</p><p className="text-gray-300">{product.category}</p></div>
                            <div><p className="text-gray-500 text-xs">Quantity</p><p className="text-gray-300">{product.quantity} quintals</p></div>
                            <div><p className="text-gray-500 text-xs">Price</p><p className="text-gray-300">₹{product.price_per_quintal}/q</p></div>
                            <div><p className="text-gray-500 text-xs">Location</p><p className="text-gray-300 text-xs">{product.farm_location?.substring(0, 30)}</p></div>
                          </div>
                          {qualityGrade && (
                            <div className="mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full border ${getGradeColor(qualityGrade)}`}>
                                <Award className="h-3 w-3 inline mr-1" /> Grade {qualityGrade}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <p className="text-lg font-bold text-white mb-2">₹{(product.quantity * product.price_per_quintal).toLocaleString()}</p>
                          <Button onClick={() => handleProductClick(product)} disabled={!isDistributorVerified() || !walletConnected} className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-4 py-2 text-sm">
                            {!walletConnected ? 'Connect Wallet' : !isDistributorVerified() ? 'Verification Pending' : 'Purchase Now'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
                
                {farmerProducts.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">No products available at the moment</p>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-400" /> Recent Purchases</h3>
                  {purchasedProducts.slice(0, 3).map((purchase) => (
                    <div key={purchase.id} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                      <div><p className="text-white text-sm">{purchase.product?.product_name || 'Product'}</p><p className="text-xs text-gray-500">{new Date(purchase.purchased_at).toLocaleDateString()}</p></div>
                      <p className="text-white font-semibold">₹{purchase.total_amount?.toLocaleString()}</p>
                    </div>
                  ))}
                  {purchasedProducts.length === 0 && <p className="text-gray-500 text-center py-4">No purchases yet</p>}
                </div>
                
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-blue-400" /> Top Sourcing Locations</h3>
                  {(() => {
                    const uniqueLocations: {[key: string]: any} = {};
                    farmerProducts.forEach(product => {
                      if (product.farm_location && !uniqueLocations[product.farm_location]) {
                        uniqueLocations[product.farm_location] = product;
                      }
                    });
                    const locationList = Object.entries(uniqueLocations).slice(0, 3);
                    return locationList.map(([location, product]: [string, any]) => (
                      <div key={location} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0">
                        <p className="text-white text-sm">{location?.substring(0, 30)}</p>
                        <p className="text-blue-400 text-sm">{product.quantity} q available</p>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>
          )}

          {activeTab === "marketplace" && (
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-500" />
                    <input type="text" placeholder="Search products..." className="w-full pl-10 pr-4 p-3 bg-gray-800 border border-gray-700 rounded-xl text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                  </div>
                  <select className="p-3 bg-gray-800 border border-gray-700 rounded-xl text-white" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    {productCategories.map(cat => <option key={cat} value={cat.toLowerCase()}>{cat}</option>)}
                  </select>
                </div>

                {!isDistributorVerified() && (
                  <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-800 rounded-xl">
                    <div className="flex items-center gap-3"><AlertCircle className="h-5 w-5 text-yellow-500" /><div><p className="text-yellow-400 font-medium">Verification Required</p></div></div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const qualityGrade = getQualityGrade(product)
                    const hasGPS = extractCoordinates(product) !== null
                    return (
                      <div key={product.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden hover:border-blue-500/50 transition-all">
                        <div className="p-5">
                          <h3 className="font-semibold text-white text-lg mb-2">{product.product_name}</h3>
                          <div className="space-y-2 mb-4">
                            <p className="text-sm text-gray-400"><span className="text-gray-500">Category:</span> {product.category}</p>
                            <p className="text-sm text-gray-400"><span className="text-gray-500">Quantity:</span> {product.quantity} quintals</p>
                            <p className="text-sm text-gray-400"><span className="text-gray-500">Price:</span> <span className="text-green-400 font-bold">₹{product.price_per_quintal}/q</span></p>
                            <p className="text-sm text-gray-400"><span className="text-gray-500">Location:</span> {product.farm_location?.substring(0, 30)}</p>
                          </div>
                          <div className="flex gap-2 mb-4">
                            {qualityGrade && <span className={`text-xs px-2 py-1 rounded-full border ${getGradeColor(qualityGrade)}`}><Award className="h-3 w-3 inline mr-1" /> Grade {qualityGrade}</span>}
                            {hasGPS && <span className="text-xs bg-blue-900 text-blue-400 px-2 py-1 rounded-full flex items-center gap-1"><Crosshair className="h-3 w-3" /> GPS</span>}
                            {product.blockchain_verified && <span className="text-xs bg-purple-900 text-purple-400 px-2 py-1 rounded-full flex items-center gap-1"><Shield className="h-3 w-3" /> Blockchain</span>}
                          </div>
                          <Button onClick={() => handleProductClick(product)} className={`w-full ${isDistributorVerified() && walletConnected ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-gray-600 cursor-not-allowed'} text-white py-2.5`} disabled={!isDistributorVerified() || !walletConnected}>
                            {!walletConnected ? <><Wallet className="h-4 w-4 mr-2" /> Connect Wallet</> : !isDistributorVerified() ? <><Clock className="h-4 w-4 mr-2" /> Verification Required</> : <><ShoppingCart className="h-4 w-4 mr-2" /> Purchase</>}
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                
                {filteredProducts.length === 0 && (
                  <div className="text-center py-12"><Package className="h-16 w-16 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">No products found</p></div>
                )}
              </div>

              {/* Purchase Modal - FIXED for full quantity only */}
              {selectedProduct && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-xl border border-gray-700 max-w-md w-full p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white">Purchase {selectedProduct.product_name}</h3>
                      <button onClick={() => setSelectedProduct(null)} className="text-gray-400 hover:text-white"><X className="h-5 w-5" /></button>
                    </div>
                    <div className="space-y-4">
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-400">Available Stock</p>
                        <p className="text-2xl font-bold text-white">{selectedProduct.quantity} quintals</p>
                      </div>
                      <div className="p-3 bg-gray-800 rounded-lg">
                        <p className="text-sm text-gray-400">Price per Quintal</p>
                        <p className="text-2xl font-bold text-green-400">₹{selectedProduct.price_per_quintal}</p>
                      </div>
                      
                      {/* Fixed quantity display - full purchase only */}
                      <div>
                        <label className="text-sm text-gray-400 block mb-2">Quantity (quintals)</label>
                        <input 
                          type="number" 
                          value={selectedProduct.quantity} 
                          disabled
                          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white opacity-75"
                        />
                        <div className="mt-2 p-2 bg-blue-900/20 rounded-lg border border-blue-800">
                          <p className="text-xs text-blue-400 flex items-center gap-1">
                            <Info className="h-3 w-3" />
                            This product must be purchased in full quantity ({selectedProduct.quantity} quintals)
                          </p>
                        </div>
                      </div>
                      
                      <div className="p-3 bg-gradient-to-r from-blue-900/20 to-cyan-900/20 rounded-lg">
                        <p className="text-sm text-gray-400">Total Amount</p>
                        <p className="text-3xl font-bold text-white">₹{(selectedProduct.quantity * selectedProduct.price_per_quintal).toLocaleString()}</p>
                      </div>
                      
                      {selectedProduct.blockchain_verified && (
                        <div className="flex items-center gap-2 p-2 bg-purple-900/20 rounded-lg border border-purple-800">
                          <Shield className="h-4 w-4 text-purple-400" />
                          <p className="text-xs text-purple-400">This product is blockchain verified</p>
                        </div>
                      )}
                      
                      <div className="flex gap-3 pt-2">
                        <Button onClick={() => purchaseProduct(selectedProduct)} className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-2.5" disabled={blockchainPurchasing}>
                          {blockchainPurchasing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processing...</> : <><Shield className="h-4 w-4 mr-2" /> Confirm Purchase</>}
                        </Button>
                        <Button onClick={() => setSelectedProduct(null)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2.5">Cancel</Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "my-purchases" && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex justify-between items-center mb-6">
                <div><h3 className="text-lg font-semibold text-white">Purchase History</h3><p className="text-sm text-gray-400 mt-1">All your verified purchases</p></div>
                <span className="text-sm px-3 py-1.5 bg-green-900/30 text-green-400 rounded-full">{purchasedProducts.length} Total Purchases</span>
              </div>
              
              {purchasedProducts.length === 0 ? (
                <div className="text-center py-12"><ShoppingCart className="h-16 w-16 text-gray-600 mx-auto mb-4" /><p className="text-gray-400">No purchases yet</p><Button onClick={() => setActiveTab("marketplace")} className="mt-4 bg-blue-600 text-white">Browse Products</Button></div>
              ) : (
                <div className="space-y-4">
                  {purchasedProducts.map((item) => (
                    <div key={item.id} className="p-5 bg-gray-800 rounded-xl border border-gray-700 hover:border-blue-500/30 transition-all">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="font-semibold text-white text-lg">{item.product?.product_name || 'Product'}</p>
                            {item.product?.blockchain_verified && <span className="text-xs bg-purple-900 text-purple-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Shield className="h-3 w-3" /> Blockchain</span>}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-3">
                            <div><p className="text-gray-500 text-xs">Quantity</p><p className="text-white font-medium">{item.quantity_purchased} quintals</p></div>
                            <div><p className="text-gray-500 text-xs">Price per Quintal</p><p className="text-white font-medium">₹{item.price_per_quintal}</p></div>
                            <div><p className="text-gray-500 text-xs">Total Amount</p><p className="text-green-400 font-bold">₹{item.total_amount?.toLocaleString()}</p></div>
                            <div><p className="text-gray-500 text-xs">Purchase Date</p><p className="text-white font-medium">{new Date(item.purchased_at).toLocaleDateString()}</p></div>
                          </div>
                          {item.product?.blockchain_tx && (
                            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1"><Shield className="h-3 w-3 text-purple-400" /> TX: {item.product.blockchain_tx.substring(0, 20)}...</p>
                          )}
                        </div>
                        {item.product?.blockchain_tx && (
                          <button onClick={() => copyToClipboard(item.product.blockchain_tx)} className="ml-4 text-xs bg-purple-900/50 text-purple-400 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-purple-800/50"><Copy className="h-3 w-3" /> TX Hash</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "tracking" && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-white text-center mb-2">Track Product Authenticity</h3>
                <p className="text-sm text-gray-400 text-center mb-6">Enter batch number or product ID to verify on blockchain</p>
                <div className="flex gap-3 mb-6">
                  <input type="text" placeholder="Enter Batch Number or Product ID" className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-xl text-white" value={trackingId} onChange={(e) => setTrackingId(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && trackProductOnBlockchain()} />
                  <Button onClick={trackProductOnBlockchain} className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6" disabled={trackingLoading}>
                    {trackingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />} Track
                  </Button>
                </div>
                {trackingResult && (
                  <div className="p-5 bg-gradient-to-r from-gray-800 to-gray-800/50 rounded-xl border border-gray-700">
                    <h4 className="font-semibold text-white mb-4">Product Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div><p className="text-xs text-gray-500">Name</p><p className="text-white">{trackingResult.product_name}</p></div>
                      <div><p className="text-xs text-gray-500">Batch</p><p className="text-white font-mono text-sm">{trackingResult.batch_number}</p></div>
                      <div><p className="text-xs text-gray-500">Owner</p><p className="text-white">{trackingResult.current_owner || 'Farmer'}</p></div>
                      <div><p className="text-xs text-gray-500">Status</p><p className={`font-medium ${trackingResult.status === 'Sold Out' ? 'text-red-400' : 'text-green-400'}`}>{trackingResult.status || 'Available'}</p></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "routes" && renderRoutesSection()}

          {activeTab === "retailers" && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
              <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Retailer Network Coming Soon</h2>
            </div>
          )}

          {activeTab === "revenue" && (
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
              <DollarSign className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Revenue Analytics Coming Soon</h2>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}