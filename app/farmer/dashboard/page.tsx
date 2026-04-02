"use client"

import { useState, useEffect, useRef } from "react"
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
  QrCode,
  MapPin,
  Edit,
  Save,
  X,
  Mail,
  Phone,
  Building,
  AlertCircle,
  CheckCircle,
  Clock,
  Locate,
  Map as MapIcon,
  Navigation,
  Compass,
  Crosshair,
  Globe,
  Layers,
  Loader2,
  Wallet,
  ExternalLink,
  Copy,
  ShieldCheck
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"
import { MetaMaskConnect } from "@/components/MetaMaskConnect"
import { blockchainService } from "@/lib/blockchain"
import Web3 from "web3"

// Dynamically import Leaflet map to avoid SSR issues
const LocationPickerMap = dynamic(() => import('./LocationPickerMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] rounded-lg border border-gray-700 overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-green-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-400">Loading map...</p>
      </div>
    </div>
  )
})

export default function FarmerDashboard() {
  const [activeTab, setActiveTab] = useState("dashboard")
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [newProduct, setNewProduct] = useState({
    product_name: "",
    category: "",
    quantity: 0,
    harvest_date: "",
    farm_location: "",
    farm_lat: null as number | null,
    farm_lng: null as number | null,
    price_per_quintal: 0,
    quality_grade: "A",
  })
  const [trackingId, setTrackingId] = useState("")
  const [trackingResult, setTrackingResult] = useState<any>(null)
  const [qrCodeData, setQrCodeData] = useState<string>("")
  const [generatedProductId, setGeneratedProductId] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [trackingLoading, setTrackingLoading] = useState(false)
  const [profileLoading, setProfileLoading] = useState(false)
  const [locationLoading, setLocationLoading] = useState(false)
  const [showLocationPicker, setShowLocationPicker] = useState(false)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([20.5937, 78.9629])
  
  // Blockchain states
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [blockchainReady, setBlockchainReady] = useState(false)
  const [verifyingBlockchain, setVerifyingBlockchain] = useState(false)
  const [selectedProductForBlockchain, setSelectedProductForBlockchain] = useState<any>(null)
  const [showBlockchainDetails, setShowBlockchainDetails] = useState(false)
  const [blockchainProductDetails, setBlockchainProductDetails] = useState<any>(null)
  
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
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState({
    phone: "",
    address: "",
    business_name: ""
  })
  
  const router = useRouter()
  const supabase = createClient()

  // Quality grades options
  const qualityGrades = [
    { value: "A", label: "Grade A - Premium Quality" },
    { value: "B", label: "Grade B - Good Quality" },
    { value: "C", label: "Grade C - Standard Quality" },
    { value: "D", label: "Grade D - Commercial Quality" },
    { value: "Organic", label: "Organic - Certified Organic" }
  ]

  // Product categories
  const productCategories = [
    "Cereals",
    "Pulses",
    "Vegetables",
    "Fruits",
    "Spices",
    "Oilseeds",
    "Tubers",
    "Medicinal Plants",
    "Flowers",
    "Other"
  ]

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.replace("/auth/login")
          return
        }
        setUser(user)
        await loadFarmerProfile(user.id)
        await loadProducts(user.id)
        
        // Check if user already has wallet address in profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('wallet_address')
          .eq('id', user.id)
          .single()
        
        if (profileData?.wallet_address) {
          setWalletAddress(profileData.wallet_address)
          setWalletConnected(true)
          // Initialize blockchain service
          await blockchainService.init()
          setBlockchainReady(true)
        }
      } catch (error) {
        console.error('🔴 Auth check error:', error)
        router.replace("/auth/login")
      }
    }
    checkAuth()
  }, [router, supabase.auth])

  // Load farmer profile from API
  const loadFarmerProfile = async (userId: string) => {
    try {
      setProfileLoading(true)
      console.log('🟡 Loading profile for user:', userId)

      const response = await fetch(`/api/farmer/profile?id=${userId}`)
      const result = await response.json()

      if (!response.ok) {
        if (response.status === 404) {
          console.log('🟡 No profile found, creating default profile')
          await createDefaultProfile(userId)
          return
        }
        throw new Error(result.error || 'Failed to load profile')
      }

      console.log('🟢 Profile loaded:', result.profile)
      setProfile(result.profile)
      setProfileForm({
        phone: result.profile.phone || "",
        address: result.profile.address || "",
        business_name: result.profile.business_name || ""
      })
      
      if (result.profile.address) {
        setNewProduct(prev => ({ ...prev, farm_location: result.profile.address }))
      }

    } catch (error) {
      console.error('🔴 Error loading profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  // Create default profile using API
  const createDefaultProfile = async (userId: string) => {
    try {
      console.log('🟡 Creating default profile for:', userId)
      
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        console.error('🔴 No user found for profile creation')
        return
      }

      const profileData = {
        id: userId,
        role: 'farmer',
        email: currentUser.email,
        phone: profileForm.phone || '',
        address: profileForm.address || '',
        business_name: profileForm.business_name || '',
        verified: false
      }

      console.log('🟡 Profile data to create:', profileData)

      const response = await fetch('/api/farmer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('🔴 Profile creation failed:', result.error)
        return
      }

      console.log('🟢 Default profile created:', result.profile)
      setProfile(result.profile)
      setProfileForm({
        phone: result.profile.phone || "",
        address: result.profile.address || "",
        business_name: result.profile.business_name || ""
      })

    } catch (error) {
      console.error('🔴 Error creating default profile:', error)
    }
  }

  // Update profile using API
  const updateProfile = async () => {
    if (!user?.id) {
      console.error('🔴 No user ID available for profile update')
      return
    }

    try {
      setProfileLoading(true)
      console.log('🟡 Updating profile for user:', user.id)

      const profileData = {
        id: user.id,
        role: 'farmer',
        email: user.email,
        phone: profileForm.phone,
        address: profileForm.address,
        business_name: profileForm.business_name,
        verified: profile?.verified || false,
        wallet_address: walletAddress // Include wallet address if connected
      }

      console.log('🟡 Profile data to update:', profileData)

      const response = await fetch('/api/farmer/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('🔴 Profile update error:', result.error)
        alert(`Profile update failed: ${result.error}`)
        return
      }

      console.log('🟢 Profile updated:', result.profile)
      setProfile(result.profile)
      setIsEditingProfile(false)
      
      if (result.profile.address) {
        setNewProduct(prev => ({ ...prev, farm_location: result.profile.address }))
      }

      alert('Profile updated successfully!')

    } catch (error) {
      console.error('🔴 Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  // Update stats whenever products change
  useEffect(() => {
    updateFarmStats(products)
  }, [products])

  // Load products from Supabase
  const loadProducts = async (farmerId: string) => {
    if (!farmerId) {
      console.error('🔴 No farmer ID provided for loading products')
      return
    }

    try {
      setLoading(true)
      console.log('🟡 Loading products for farmer:', farmerId)

      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .eq('farmer_id', farmerId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('🔴 Supabase query error:', error)
        const savedProducts = localStorage.getItem('products')
        if (savedProducts) {
          console.log('🟡 Using localStorage products as fallback')
          setProducts(JSON.parse(savedProducts))
        }
        return
      }

      console.log('🟢 Successfully loaded products:', products?.length)
      setProducts(products || [])
      localStorage.setItem('products', JSON.stringify(products || []))

    } catch (error) {
      console.error('🔴 Error loading products:', error)
      const savedProducts = localStorage.getItem('products')
      if (savedProducts) {
        console.log('🟡 Using localStorage products as fallback due to error')
        setProducts(JSON.parse(savedProducts))
      }
    } finally {
      setLoading(false)
    }
  }

  // Update farm stats based on products
  const updateFarmStats = (products: any[]) => {
    const totalProducts = products.length
    
    const totalRevenue = products.reduce((sum, product) => {
      const quantity = product.quantity || 0
      const pricePerQuintal = product.price_per_quintal || 0
      return sum + (quantity * pricePerQuintal)
    }, 0)
    
    const activeCrops = products.filter(product => {
      try {
        if (product.harvest_date) {
          const harvestDate = new Date(product.harvest_date)
          const thirtyDaysAgo = new Date()
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
          return harvestDate > thirtyDaysAgo
        }
        return false
      } catch {
        return false
      }
    }).length

    setFarmStats([
      { 
        label: "Total Products", 
        value: totalProducts.toString(), 
        icon: Package,
        color: "text-blue-400"
      },
      { 
        label: "Blockchain Verified", 
        value: products.filter(p => p.blockchain_tx).length.toString(), 
        icon: Shield,
        color: "text-green-400"
      },
      { 
        label: "Active Crops", 
        value: activeCrops.toString(), 
        icon: Crop,
        color: "text-emerald-400"
      },
      { 
        label: "Total Revenue", 
        value: totalRevenue >= 100000 ? `₹${(totalRevenue / 100000).toFixed(1)}L` : 
               totalRevenue >= 1000 ? `₹${(totalRevenue / 1000).toFixed(1)}k` : `₹${totalRevenue}`,
        icon: DollarSign,
        color: "text-yellow-400"
      },
    ])
  }

  const generateQRCode = async (productId: string) => {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(productId)}`
    return qrCodeUrl
  }

  // Check if farmer is verified
  const isFarmerVerified = () => {
    return profile?.verified === true
  }

  // Get current location using browser's geolocation API
  const getCurrentLocation = () => {
    setLocationLoading(true)
    setLocationError(null)
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser")
      setLocationLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        
        // Reverse geocode to get address
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`)
          .then(response => response.json())
          .then(data => {
            const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
            
            setNewProduct(prev => ({
              ...prev,
              farm_location: address,
              farm_lat: latitude,
              farm_lng: longitude
            }))
            
            setMapCenter([latitude, longitude])
            setLocationAccuracy(accuracy)
            setShowLocationPicker(true)
            setLocationLoading(false)
          })
          .catch(() => {
            // If geocoding fails, just use coordinates
            setNewProduct(prev => ({
              ...prev,
              farm_location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
              farm_lat: latitude,
              farm_lng: longitude
            }))
            
            setMapCenter([latitude, longitude])
            setLocationAccuracy(accuracy)
            setShowLocationPicker(true)
            setLocationLoading(false)
          })
      },
      (error) => {
        setLocationLoading(false)
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Please allow location access to use this feature")
            break
          case error.POSITION_UNAVAILABLE:
            setLocationError("Location information is unavailable")
            break
          case error.TIMEOUT:
            setLocationError("Location request timed out")
            break
          default:
            setLocationError("An unknown error occurred")
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // Handle map location selection
  const handleLocationSelect = (lat: number, lng: number, address: string) => {
    setNewProduct(prev => ({
      ...prev,
      farm_location: address,
      farm_lat: lat,
      farm_lng: lng
    }))
    setShowLocationPicker(false)
  }

  // Handle wallet connection
  const handleWalletConnected = async (account: string) => {
    setWalletConnected(true)
    setWalletAddress(account)
    
    // Initialize blockchain service
    const initialized = await blockchainService.init()
    setBlockchainReady(initialized)
    
    // Update profile with wallet address
    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({ wallet_address: account })
          .eq('id', user.id)
        
        console.log('✅ Wallet address saved to profile:', account)
      } catch (error) {
        console.error('Error saving wallet address:', error)
      }
    }
  }

  const handleWalletDisconnected = () => {
    setWalletConnected(false)
    setWalletAddress(null)
    setBlockchainReady(false)
  }

  // Register product on blockchain and Supabase
  const registerProductOnBlockchain = async () => {
    if (!isFarmerVerified()) {
      alert("❌ You need to be verified by the admin before registering products.")
      return
    }

    if (!newProduct.product_name || !newProduct.quantity || !newProduct.farm_location) {
      alert("Please fill all required fields including product name and farm location")
      return
    }

    // Check wallet connection
    if (!walletConnected || !walletAddress) {
      alert("❌ Please connect your MetaMask wallet first")
      return
    }

    try {
      setLoading(true)
      
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        alert("User not authenticated")
        return
      }

      // Register on blockchain
      const blockchainResult = await blockchainService.registerProduct(
        newProduct.product_name,
        newProduct.quantity,
        newProduct.price_per_quintal,
        newProduct.farm_location,
        newProduct.category || 'Other'
      )

      if (!blockchainResult.success) {
        throw new Error(blockchainResult.error || 'Blockchain registration failed')
      }

      console.log('✅ Blockchain registration successful:', blockchainResult)

      // Generate batch number and QR code
      const batchNumber = `BATCH_${blockchainResult.productId}_${Date.now()}`
      const qrCodeUrl = await generateQRCode(batchNumber)
      setQrCodeData(qrCodeUrl)
      setGeneratedProductId(batchNumber)

      // Save to Supabase
      const productData = {
        product_name: newProduct.product_name.trim(),
        category: newProduct.category || 'Other',
        quantity: Number(newProduct.quantity),
        harvest_date: newProduct.harvest_date || null,
        farm_location: newProduct.farm_location.trim(),
        farm_coordinates: newProduct.farm_lat && newProduct.farm_lng ? 
          `POINT(${newProduct.farm_lng} ${newProduct.farm_lat})` : null,
        farmer_id: currentUser.id,
        quality_metrics: { 
          grade: newProduct.quality_grade
        },
        qr_code_hash: qrCodeUrl,
        batch_number: batchNumber,
        price_per_quintal: Number(newProduct.price_per_quintal) || 0,
        current_owner: 'Farmer',
        status: 'Registered',
        description: '',
        
        // Blockchain fields
        blockchain_id: blockchainResult.productId,
        blockchain_tx: blockchainResult.transactionHash,
        wallet_address: walletAddress,
        blockchain_verified: true
      }

      console.log('🔄 Inserting product with blockchain data:', productData)

      const { data: product, error } = await supabase
        .from('products')
        .insert([productData])
        .select()

      if (error) {
        console.error('❌ Database error:', error)
        alert(`Registration failed: ${error.message}`)
        return
      }

      console.log('✅ Product inserted successfully:', product)

      alert(`✅ Product Registered Successfully on Blockchain!\n\n` +
            `Product: ${newProduct.product_name}\n` +
            `Blockchain ID: ${blockchainResult.productId}\n` +
            `Transaction: ${blockchainResult.transactionHash?.substring(0, 10)}...`)
      
      await loadProducts(currentUser.id)
      
      // Reset form but keep location if needed
      setNewProduct({
        product_name: "",
        category: "",
        quantity: 0,
        harvest_date: "",
        farm_location: newProduct.farm_location,
        farm_lat: newProduct.farm_lat,
        farm_lng: newProduct.farm_lng,
        price_per_quintal: 0,
        quality_grade: "A"
      })
      
      setActiveTab("blockchain")

    } catch (error: any) {
      console.error('❌ Registration error:', error)
      alert(`❌ Failed to register product: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Track product on blockchain
  const trackProductOnBlockchain = async () => {
    if (!trackingId.trim()) {
      alert("Please enter a product ID or batch number")
      return
    }

    try {
      setTrackingLoading(true)
      setTrackingResult(null)
      setBlockchainProductDetails(null)
      
      console.log('🔍 Tracking product:', trackingId)

      const cleanTrackingId = trackingId.trim()
      
      // First, try to find in Supabase
      let { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('batch_number', cleanTrackingId)
        .single()

      if (error) {
        // Try by ID
        const { data: productById } = await supabase
          .from('products')
          .select('*')
          .eq('id', cleanTrackingId)
          .single()

        if (productById) {
          product = productById
        } else {
          // Try by name
          const { data: productsByName } = await supabase
            .from('products')
            .select('*')
            .ilike('product_name', `%${cleanTrackingId}%`)
            .limit(1)

          if (productsByName && productsByName.length > 0) {
            product = productsByName[0]
          }
        }
      }

      setTrackingResult(product)

      // If blockchain ID exists, get blockchain data
      if (product?.blockchain_id && walletConnected && blockchainReady) {
        try {
          const blockchainProduct = await blockchainService.getProduct(product.blockchain_id)
          setBlockchainProductDetails(blockchainProduct)
        } catch (blockchainError) {
          console.error('Error fetching blockchain data:', blockchainError)
        }
      }

      if (!product) {
        alert(`❌ Product not found: ${trackingId}`)
      }

    } catch (error) {
      console.error('🔴 Tracking error:', error)
      alert(`❌ Error tracking product: ${error}`)
    } finally {
      setTrackingLoading(false)
    }
  }

  // Verify product on blockchain
  const verifyProductOnBlockchain = async (product: any) => {
    if (!walletConnected || !blockchainReady) {
      alert("Please connect your wallet first")
      return
    }

    setVerifyingBlockchain(true)
    setSelectedProductForBlockchain(product)
    
    try {
      if (product.blockchain_id) {
        const blockchainProduct = await blockchainService.getProduct(product.blockchain_id)
        setBlockchainProductDetails(blockchainProduct)
        setShowBlockchainDetails(true)
      }
    } catch (error) {
      console.error('Error verifying product:', error)
      alert('Failed to verify product on blockchain')
    } finally {
      setVerifyingBlockchain(false)
    }
  }

  const downloadQRCode = () => {
    if (qrCodeData) {
      const link = document.createElement('a')
      link.href = qrCodeData
      link.download = `qr_code_${generatedProductId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/auth/login")
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified'
    try {
      return new Date(dateString).toLocaleDateString('en-IN')
    } catch {
      return 'Invalid date'
    }
  }

  // Get quality grade from quality_metrics JSON
  const getQualityGrade = (product: any) => {
    if (!product.quality_metrics) return null
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

  // Copy transaction hash
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  // Render verification banner
  const renderVerificationBanner = () => {
    if (isFarmerVerified()) {
      return (
        <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-green-400 font-medium">✓ Verified Farmer</p>
            <p className="text-sm text-green-300/70">Your account is verified. You can now register products.</p>
          </div>
        </div>
      )
    } else {
      return (
        <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 mb-6 flex items-center gap-3">
          <Clock className="h-5 w-5 text-yellow-500 flex-shrink-0" />
          <div>
            <p className="text-yellow-400 font-medium">⏳ Pending Verification</p>
            <p className="text-sm text-yellow-300/70">
              Complete your profile and wait for admin approval to register products.
            </p>
          </div>
        </div>
      )
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex">
      {/* Sidebar - same as before */}
      <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col">
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
        
        <nav className="p-4 flex-1">
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

        {/* MetaMask Connect Button */}
        <div className="p-4 border-t border-gray-800">
          <MetaMaskConnect 
            onConnected={handleWalletConnected}
            onDisconnected={handleWalletDisconnected}
            showBalance={true}
          />
          
          {walletConnected && walletAddress && (
            <div className="mt-3 p-3 bg-green-900/20 border border-green-800 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                <span className="text-xs font-medium text-green-400">Blockchain Ready</span>
              </div>
              <p className="text-xs text-gray-400 truncate">
                {walletAddress}
              </p>
            </div>
          )}
        </div>

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
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mx-auto"></div>
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
                  placeholder="Your farm/business name"
                  className="w-full p-2 text-sm bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500"
                  disabled={profileLoading}
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
                  disabled={profileLoading}
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Farm Address</label>
                <textarea
                  value={profileForm.address}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Your farm address"
                  rows={3}
                  className="w-full p-2 text-sm bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 resize-none"
                  disabled={profileLoading}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={updateProfile}
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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
                  disabled={profileLoading}
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
                <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                  profile.verified 
                    ? 'bg-green-900 text-green-400' 
                    : 'bg-yellow-900 text-yellow-400'
                }`}>
                  {profile.verified ? (
                    <>
                      <CheckCircle className="h-3 w-3" />
                      Verified
                    </>
                  ) : (
                    <>
                      <Clock className="h-3 w-3" />
                      Pending
                    </>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-gray-400">Role</span>
                <span className="text-xs text-white capitalize">{profile.role || 'farmer'}</span>
              </div>
              {walletAddress && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-400">Wallet</span>
                  <span className="text-xs font-mono text-green-400">
                    {walletAddress.substring(0, 6)}...
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Section */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-medium">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.business_name || user?.email || 'Farmer'}
              </p>
              <p className="text-xs text-gray-400 capitalize">{profile?.role || 'farmer'} Account</p>
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
      <div className="flex-1 flex flex-col overflow-hidden">
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
              {activeTab === "blockchain" && "Register products with GPS location on blockchain"}
              {activeTab === "orders" && "Manage your product orders"}
              {activeTab === "revenue" && "Track your sales and earnings"}
              {activeTab === "delivery" && "Monitor product deliveries"}
            </p>
          </div>
        </header>

        <main className="flex-1 p-6 bg-black overflow-y-auto">
          {loading && (
            <div className="fixed top-0 left-0 w-full h-1 bg-green-500 z-50 animate-pulse"></div>
          )}

          {/* Verification Banner */}
          {renderVerificationBanner()}

          {/* Wallet Connection Warning */}
          {!walletConnected && activeTab === "blockchain" && (
            <div className="mb-6 p-4 bg-orange-900/30 border border-orange-800 rounded-lg">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-orange-500 flex-shrink-0" />
                <div>
                  <p className="text-orange-400 font-medium">Connect MetaMask to use blockchain features</p>
                  <p className="text-sm text-orange-300/70">
                    You need to connect your wallet to register products on the blockchain.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Farm Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    { 
                      label: "Register Product", 
                      icon: Shield, 
                      action: () => setActiveTab("blockchain"),
                      requiresVerification: true
                    },
                    { label: "View Orders", icon: Package, action: () => setActiveTab("orders") },
                    { label: "Track Product", icon: Scan, action: () => setActiveTab("blockchain") },
                    { label: "Sales Report", icon: DollarSign, action: () => setActiveTab("revenue") },
                  ].map((action, index) => {
                    const isDisabled = action.requiresVerification && !isFarmerVerified();
                    
                    return (
                      <button
                        key={index}
                        onClick={action.action}
                        disabled={loading || isDisabled}
                        className={`p-4 bg-gray-800 rounded-lg border border-gray-700 transition-colors text-center relative group ${
                          isDisabled 
                            ? 'opacity-50 cursor-not-allowed hover:bg-gray-800' 
                            : 'hover:bg-gray-700 cursor-pointer'
                        }`}
                        title={isDisabled ? "Verification required to register products" : action.label}
                      >
                        {isDisabled && (
                          <div className="absolute -top-2 -right-2">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                          </div>
                        )}
                        <action.icon className={`h-8 w-8 mx-auto mb-2 ${
                          isDisabled ? 'text-gray-500' : 'text-green-500'
                        }`} />
                        <p className="text-sm font-medium text-white">{action.label}</p>
                        {isDisabled && (
                          <p className="text-xs text-yellow-500 mt-1 hidden group-hover:block">
                            Verification required
                          </p>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recent Products */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Products</h3>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading products...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.slice(0, 5).map((product, index) => {
                      const qualityGrade = getQualityGrade(product)
                      return (
                        <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-800 rounded-lg border border-gray-700 transition-colors">
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-white">{product.product_name}</p>
                                  {product.blockchain_verified && (
                                    <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Shield className="h-3 w-3" />
                                      Blockchain
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
                                {product.harvest_date && (
                                  <p className="text-xs text-gray-500">
                                    Harvest: {formatDate(product.harvest_date)}
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-white font-semibold">
                                  Total: ₹{(product.quantity * product.price_per_quintal).toLocaleString()}
                                </p>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  product.status === 'Registered' ? 'bg-green-900 text-green-400' :
                                  'bg-yellow-900 text-yellow-400'
                                }`}>
                                  {product.status || 'Registered'}
                                </span>
                              </div>
                            </div>
                            {qualityGrade && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  qualityGrade === 'A' ? 'bg-green-900 text-green-400' :
                                  qualityGrade === 'B' ? 'bg-blue-900 text-blue-400' :
                                  qualityGrade === 'C' ? 'bg-yellow-900 text-yellow-400' :
                                  qualityGrade === 'D' ? 'bg-orange-900 text-orange-400' :
                                  'bg-purple-900 text-purple-400'
                                }`}>
                                  Quality: {qualityGrade}
                                </span>
                                {product.blockchain_id && (
                                  <button
                                    onClick={() => verifyProductOnBlockchain(product)}
                                    className="text-xs bg-blue-900 text-blue-400 px-2 py-1 rounded-full hover:bg-blue-800 transition-colors"
                                  >
                                    Verify on Blockchain
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    
                    {products.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
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
              {/* Register New Product with Location */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-500" />
                  Register New Product on Blockchain
                </h3>
                
                {!isFarmerVerified() && (
                  <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                      <div>
                        <p className="text-yellow-400 font-medium">Verification Required</p>
                        <p className="text-sm text-yellow-300/70">
                          You need to be verified by the admin before you can register products.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {!walletConnected && isFarmerVerified() && (
                  <div className="mb-6 p-4 bg-orange-900/20 border border-orange-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-5 w-5 text-orange-500 flex-shrink-0" />
                      <div>
                        <p className="text-orange-400 font-medium">Connect Wallet First</p>
                        <p className="text-sm text-orange-300/70">
                          Please connect your MetaMask wallet from the sidebar to register on blockchain.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Product Name *</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Organic Basmati Rice"
                      className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500"
                      value={newProduct.product_name}
                      onChange={(e) => setNewProduct({...newProduct, product_name: e.target.value})}
                      disabled={loading || !isFarmerVerified()}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Category *</label>
                    <select 
                      className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500"
                      value={newProduct.category}
                      onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                      disabled={loading || !isFarmerVerified()}
                    >
                      <option value="">Select Category</option>
                      {productCategories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Quantity (Quintal) *</label>
                    <input 
                      type="number" 
                      placeholder="Enter quantity"
                      className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500"
                      value={newProduct.quantity}
                      onChange={(e) => setNewProduct({...newProduct, quantity: parseFloat(e.target.value) || 0})}
                      disabled={loading || !isFarmerVerified()}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Price per Quintal (₹) *</label>
                    <input 
                      type="number" 
                      placeholder="Enter price"
                      className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500"
                      value={newProduct.price_per_quintal}
                      onChange={(e) => setNewProduct({...newProduct, price_per_quintal: parseFloat(e.target.value) || 0})}
                      disabled={loading || !isFarmerVerified()}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Harvest Date</label>
                    <input 
                      type="date" 
                      className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500"
                      value={newProduct.harvest_date}
                      onChange={(e) => setNewProduct({...newProduct, harvest_date: e.target.value})}
                      disabled={loading || !isFarmerVerified()}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white mb-2 block">Quality Grade *</label>
                    <select 
                      className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white focus:ring-2 focus:ring-green-500"
                      value={newProduct.quality_grade}
                      onChange={(e) => setNewProduct({...newProduct, quality_grade: e.target.value})}
                      disabled={loading || !isFarmerVerified()}
                    >
                      {qualityGrades.map(grade => (
                        <option key={grade.value} value={grade.value}>{grade.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Location Section */}
                  <div className="md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-white">Farm Location *</label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={getCurrentLocation}
                          disabled={locationLoading || loading || !isFarmerVerified()}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 h-8"
                        >
                          {locationLoading ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Getting location...
                            </>
                          ) : (
                            <>
                              <Locate className="h-3 w-3 mr-1" />
                              Use My Current Location
                            </>
                          )}
                        </Button>
                        {newProduct.farm_lat && newProduct.farm_lng && (
                          <Button
                            type="button"
                            onClick={() => setShowLocationPicker(!showLocationPicker)}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-3 py-1 h-8"
                          >
                            <MapIcon className="h-3 w-3 mr-1" />
                            {showLocationPicker ? 'Hide Map' : 'Show on Map'}
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {locationError && (
                      <div className="mb-3 p-2 bg-red-900/20 border border-red-800 rounded-lg text-xs text-red-400">
                        <AlertCircle className="h-3 w-3 inline mr-1" />
                        {locationError}
                      </div>
                    )}
                    
                    {locationAccuracy && (
                      <div className="mb-3 p-2 bg-blue-900/20 border border-blue-800 rounded-lg text-xs text-blue-400">
                        <Crosshair className="h-3 w-3 inline mr-1" />
                        Location accuracy: ±{Math.round(locationAccuracy)} meters
                      </div>
                    )}
                    
                    <div className="relative">
                      <input 
                        type="text" 
                        placeholder="Farm location will appear here"
                        className="w-full p-3 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500 pr-24"
                        value={newProduct.farm_location}
                        onChange={(e) => setNewProduct({...newProduct, farm_location: e.target.value})}
                        disabled={loading || !isFarmerVerified()}
                      />
                      {newProduct.farm_lat && newProduct.farm_lng && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1 text-xs text-green-400">
                          <CheckCircle className="h-3 w-3" />
                          <span>GPS verified</span>
                        </div>
                      )}
                    </div>
                    
                    {newProduct.farm_lat && newProduct.farm_lng && (
                      <p className="text-xs text-gray-500 mt-1">
                        Coordinates: {newProduct.farm_lat.toFixed(6)}, {newProduct.farm_lng.toFixed(6)}
                      </p>
                    )}
                    
                    {profile?.address && !newProduct.farm_lat && (
                      <p className="text-xs text-gray-400 mt-1">
                        Profile address: {profile.address}
                        <button 
                          onClick={() => setNewProduct(prev => ({ ...prev, farm_location: profile.address }))}
                          className="ml-2 text-green-500 hover:text-green-400 text-xs"
                          disabled={!isFarmerVerified()}
                        >
                          Use this address
                        </button>
                      </p>
                    )}
                  </div>
                  
                  {/* Location Picker Map */}
                  {showLocationPicker && newProduct.farm_lat && newProduct.farm_lng && (
                    <div className="md:col-span-2 mt-2">
                      <LocationPickerMap
                        initialLat={newProduct.farm_lat}
                        initialLng={newProduct.farm_lng}
                        onLocationSelect={handleLocationSelect}
                      />
                    </div>
                  )}
                </div>

                <Button 
                  onClick={registerProductOnBlockchain}
                  className={`w-full ${
                    isFarmerVerified() && walletConnected
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-gray-600 cursor-not-allowed'
                  } text-white`}
                  disabled={loading || !isFarmerVerified() || !walletConnected || !newProduct.farm_location.trim() || !newProduct.product_name.trim()}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Registering on Blockchain...
                    </>
                  ) : !isFarmerVerified() ? (
                    <>
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Verification Required
                    </>
                  ) : !walletConnected ? (
                    <>
                      <Wallet className="h-4 w-4 mr-2" />
                      Connect Wallet First
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Register on Blockchain with GPS
                    </>
                  )}
                </Button>

                {qrCodeData && (
                  <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-green-500" />
                      Blockchain Product QR Code
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
                          <strong>Product:</strong> {newProduct.product_name}
                        </p>
                        <p className="text-sm text-white mb-1">
                          <strong>Batch:</strong> {generatedProductId}
                        </p>
                        <p className="text-sm text-white mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <strong>Location:</strong> {newProduct.farm_location}
                        </p>
                        {newProduct.farm_lat && newProduct.farm_lng && (
                          <p className="text-sm text-white mb-1">
                            <strong>GPS:</strong> {newProduct.farm_lat.toFixed(6)}, {newProduct.farm_lng.toFixed(6)}
                          </p>
                        )}
                        <p className="text-sm text-white mb-1">
                          <strong>Quantity:</strong> {newProduct.quantity} quintals
                        </p>
                        <p className="text-sm text-white mb-1">
                          <strong>Quality:</strong> {newProduct.quality_grade}
                        </p>
                        <p className="text-sm text-white mb-4">
                          <strong>Price:</strong> ₹{newProduct.price_per_quintal}/quintal
                        </p>
                        <p className="text-sm text-gray-400 mb-4">
                          This QR code contains the blockchain product ID. Scan to verify authenticity.
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

              {/* Track Product Section */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Scan className="h-5 w-5 text-green-500" />
                  Track Product Journey
                </h3>
                <div className="flex gap-2 mb-4">
                  <input 
                    type="text" 
                    placeholder="Enter Batch Number, Product ID, or Product Name"
                    className="flex-1 p-3 border border-gray-700 rounded-lg bg-gray-800 text-white placeholder-gray-500 focus:ring-2 focus:ring-green-500"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    disabled={trackingLoading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        trackProductOnBlockchain();
                      }
                    }}
                  />
                  <Button 
                    onClick={trackProductOnBlockchain}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    disabled={trackingLoading}
                  >
                    {trackingLoading ? (
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

                {products.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Quick search from your products:</p>
                    <div className="flex flex-wrap gap-2">
                      {products.slice(0, 5).map((product) => (
                        <button
                          key={product.id}
                          onClick={() => {
                            setTrackingId(product.batch_number || product.id);
                            trackProductOnBlockchain();
                          }}
                          className="text-xs bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-full border border-gray-700 transition-colors flex items-center gap-1"
                          title={`Click to track: ${product.product_name}`}
                        >
                          {product.product_name}
                          {product.blockchain_verified && (
                            <Shield className="h-3 w-3 text-green-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Tracking Results */}
                {trackingResult && (
                  <div className="mt-6 space-y-6">
                    {/* Database Product Info */}
                    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                        <Package className="h-4 w-4 text-green-500" />
                        Product Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-400">Product Name</p>
                          <p className="text-white font-medium">{trackingResult.product_name}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Batch Number</p>
                          <p className="text-white font-medium">{trackingResult.batch_number}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Category</p>
                          <p className="text-white font-medium">{trackingResult.category}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Quantity</p>
                          <p className="text-white font-medium">{trackingResult.quantity} quintals</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Farm Location</p>
                          <p className="text-white font-medium">{trackingResult.farm_location}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Current Owner</p>
                          <p className="text-white font-medium">{trackingResult.current_owner || 'Farmer'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Price</p>
                          <p className="text-white font-medium">₹{trackingResult.price_per_quintal}/quintal</p>
                        </div>
                      </div>
                      
                      {trackingResult.blockchain_verified && (
                        <div className="mt-4 p-3 bg-green-900/20 border border-green-800 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Shield className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-400">Blockchain Verified</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">
                            Blockchain ID: {trackingResult.blockchain_id}
                          </p>
                          <p className="text-xs text-gray-400">
                            TX: {trackingResult.blockchain_tx?.substring(0, 20)}...
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Blockchain Product Info */}
                    {blockchainProductDetails && (
                      <div className="p-4 bg-gray-800 rounded-lg border border-green-700">
                        <h4 className="font-semibold text-white mb-4 flex items-center gap-2">
                          <Shield className="h-4 w-4 text-green-500" />
                          Blockchain Verified Data
                        </h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-400">Blockchain Product ID</p>
                            <p className="text-white font-medium">#{blockchainProductDetails.id}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Farmer Address</p>
                            <p className="text-white font-mono text-xs">
                              {blockchainProductDetails.farmer?.substring(0, 10)}...
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Current Owner</p>
                            <p className="text-white font-mono text-xs">
                              {blockchainProductDetails.currentOwner?.substring(0, 10)}...
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Quantity</p>
                            <p className="text-white">{blockchainProductDetails.quantity} quintals</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Price</p>
                            <p className="text-white">₹{blockchainProductDetails.price}/quintal</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-400">Location</p>
                            <p className="text-white">{blockchainProductDetails.location}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Products List */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <History className="h-5 w-5 text-green-500" />
                  My Products ({products.length})
                </h3>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
                    <p className="text-gray-400 mt-2">Loading products...</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {products.map((product, index) => {
                      const qualityGrade = getQualityGrade(product)
                      return (
                        <div key={index} className="p-4 hover:bg-gray-800 rounded-lg border border-gray-700 transition-colors">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-white">{product.product_name}</p>
                                {product.blockchain_verified ? (
                                  <span className="text-xs bg-green-900 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Shield className="h-3 w-3" />
                                    Blockchain
                                  </span>
                                ) : (
                                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                                    Database Only
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">
                                {product.category} • {product.quantity} quintals • ₹{product.price_per_quintal}/quintal
                              </p>
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {product.farm_location}
                                {product.batch_number && ` • Batch: ${product.batch_number}`}
                              </p>
                              
                              <div className="flex flex-wrap gap-1 mt-2">
                                {qualityGrade && (
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    qualityGrade === 'A' ? 'bg-green-900 text-green-400' :
                                    qualityGrade === 'B' ? 'bg-blue-900 text-blue-400' :
                                    qualityGrade === 'C' ? 'bg-yellow-900 text-yellow-400' :
                                    qualityGrade === 'D' ? 'bg-orange-900 text-orange-400' :
                                    'bg-purple-900 text-purple-400'
                                  }`}>
                                    Quality: {qualityGrade}
                                  </span>
                                )}
                                {product.blockchain_id && (
                                  <button
                                    onClick={() => verifyProductOnBlockchain(product)}
                                    disabled={verifyingBlockchain}
                                    className="text-xs bg-green-900 text-green-400 px-2 py-1 rounded-full hover:bg-green-800 transition-colors flex items-center gap-1"
                                  >
                                    {verifyingBlockchain && selectedProductForBlockchain?.id === product.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Shield className="h-3 w-3" />
                                    )}
                                    Verify
                                  </button>
                                )}
                              </div>

                              {product.blockchain_tx && (
                                <div className="mt-2 text-xs">
                                  <p className="text-gray-500">
                                    TX: {product.blockchain_tx.substring(0, 20)}...
                                    <button 
                                      onClick={() => copyToClipboard(product.blockchain_tx)}
                                      className="ml-2 text-blue-400 hover:text-blue-300"
                                    >
                                      <Copy className="h-3 w-3 inline" />
                                    </button>
                                  </p>
                                </div>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-sm text-white font-semibold">
                                ₹{(product.quantity * product.price_per_quintal).toLocaleString()}
                              </p>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                product.status === 'Registered' ? 'bg-green-900 text-green-400' :
                                'bg-yellow-900 text-yellow-400'
                              }`}>
                                {product.status || 'Registered'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                    
                    {products.length === 0 && (
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

          {/* Other tabs - Orders, Revenue, Delivery (simplified) */}
          {activeTab === "orders" && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <div className="text-center py-8">
                <Package className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Orders Management</h2>
                <p className="text-gray-400">Orders feature coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === "revenue" && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <div className="text-center py-8">
                <DollarSign className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Revenue & Sales</h2>
                <p className="text-gray-400">Revenue tracking coming soon...</p>
              </div>
            </div>
          )}

          {activeTab === "delivery" && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <div className="text-center py-8">
                <Truck className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-4">Delivery Tracking</h2>
                <p className="text-gray-400">Delivery tracking coming soon...</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Blockchain Details Modal */}
      {showBlockchainDetails && blockchainProductDetails && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-lg border border-gray-800 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                Blockchain Verification Details
              </h3>
              <button
                onClick={() => setShowBlockchainDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Product ID</p>
                  <p className="text-white font-mono text-sm">#{blockchainProductDetails.id}</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Product Name</p>
                  <p className="text-white">{blockchainProductDetails.name}</p>
                </div>
                <div className="col-span-2 p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Farmer Address</p>
                  <p className="text-white font-mono text-sm break-all">{blockchainProductDetails.farmer}</p>
                </div>
                <div className="col-span-2 p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Current Owner</p>
                  <p className="text-white font-mono text-sm break-all">{blockchainProductDetails.currentOwner}</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Quantity</p>
                  <p className="text-white">{blockchainProductDetails.quantity} quintals</p>
                </div>
                <div className="p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Price</p>
                  <p className="text-white">₹{blockchainProductDetails.price}/quintal</p>
                </div>
                <div className="col-span-2 p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Location</p>
                  <p className="text-white">{blockchainProductDetails.location}</p>
                </div>
                <div className="col-span-2 p-3 bg-gray-800 rounded-lg">
                  <p className="text-xs text-gray-400">Registration Date</p>
                  <p className="text-white">{new Date(blockchainProductDetails.timestamp * 1000).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setShowBlockchainDetails(false)}
                  className="bg-green-600 hover:bg-green-700 text-white"
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