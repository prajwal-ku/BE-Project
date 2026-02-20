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
  Map,
  AlertCircle,
  Compass,
  LocateFixed,
  ZoomIn,
  ZoomOut,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Crosshair
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import dynamic from "next/dynamic"

// Dynamically import Leaflet to avoid SSR issues
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] rounded-lg border border-gray-700 overflow-hidden relative flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="text-center">
        <Loader2 className="h-8 w-8 text-blue-500 animate-spin mx-auto mb-3" />
        <p className="text-gray-400">Loading interactive map...</p>
      </div>
    </div>
  )
})

// Helper function to geocode location (simplified - in production use a real geocoding service)
const geocodeLocation = async (location: string): Promise<{lat: number, lng: number} | null> => {
  const locationLower = location.toLowerCase()
  
  // Mock coordinates for Indian cities/states
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
    'srinagar': { lat: 34.0837, lng: 74.7973 },
    'leh': { lat: 34.1526, lng: 77.5770 },
    'manali': { lat: 32.2396, lng: 77.1887 },
    'darjeeling': { lat: 27.0410, lng: 88.2663 },
    'ooty': { lat: 11.4064, lng: 76.6932 },
    'kodaikanal': { lat: 10.2381, lng: 77.4892 },
    'munnar': { lat: 10.0889, lng: 77.0595 },
    'alleppey': { lat: 9.4981, lng: 76.3388 },
    'pondicherry': { lat: 11.9139, lng: 79.8145 },
    'mahabalipuram': { lat: 12.6169, lng: 80.1992 },
    'hampi': { lat: 15.3350, lng: 76.4600 },
    'ajanta': { lat: 20.5525, lng: 75.7033 },
    'ellora': { lat: 20.0268, lng: 75.1771 },
    'khajuraho': { lat: 24.8318, lng: 79.9199 },
    'bodh gaya': { lat: 24.6961, lng: 84.9869 },
    'sarnath': { lat: 25.3762, lng: 83.0227 },
    'rishikesh': { lat: 30.0869, lng: 78.2676 },
    'haridwar': { lat: 29.9457, lng: 78.1642 },
    'mathura': { lat: 27.4924, lng: 77.6737 },
    'vrindavan': { lat: 27.5811, lng: 77.7006 },
    'ayodhya': { lat: 26.7921, lng: 82.1990 },
    'nashik': { lat: 19.9615, lng: 73.7904 },
    'shirdi': { lat: 19.7666, lng: 74.4770 },
    'kolhapur': { lat: 16.6913, lng: 74.2445 },
    'solapur': { lat: 17.6599, lng: 75.9064 },
    'aurangabad': { lat: 19.8762, lng: 75.3433 },
    'nanded': { lat: 19.1383, lng: 77.3210 },
    'latur': { lat: 18.4088, lng: 76.5604 },
    'jalgaon': { lat: 21.0077, lng: 75.5626 },
    'dhule': { lat: 20.9042, lng: 74.7749 },
    'malegaon': { lat: 20.5577, lng: 74.5253 },
    'akola': { lat: 20.7044, lng: 77.0025 },
    'amravati': { lat: 20.9374, lng: 77.7796 },
    'yeotmal': { lat: 20.3888, lng: 78.1204 },
    'wardha': { lat: 20.7453, lng: 78.6022 },
    'chandrapur': { lat: 19.9615, lng: 79.2961 },
    'gadchiroli': { lat: 20.1881, lng: 80.0055 },
    'gondia': { lat: 21.4669, lng: 80.1920 },
    'bhandara': { lat: 21.1667, lng: 79.6500 },
    'nagpur': { lat: 21.1458, lng: 79.0882 },
    'washim': { lat: 20.1025, lng: 77.1400 },
    'hingoli': { lat: 19.7167, lng: 77.1500 },
    'parbhani': { lat: 19.2686, lng: 76.7707 },
    'jalna': { lat: 19.8410, lng: 75.8864 },
    'beed': { lat: 18.9891, lng: 75.7684 },
    'osmanabad': { lat: 18.1855, lng: 76.0391 },
    'sangli': { lat: 16.8602, lng: 74.5648 },
    'satara': { lat: 17.6805, lng: 74.0183 },
    'ratnagiri': { lat: 16.9902, lng: 73.3120 },
    'sindhudurg': { lat: 16.1667, lng: 73.6833 },
    'thane': { lat: 19.2183, lng: 72.9781 },
    'palghar': { lat: 19.6967, lng: 72.7654 },
    'raigad': { lat: 18.5167, lng: 73.1833 },
    'nandurbar': { lat: 21.3667, lng: 74.2333 },
    'buldhana': { lat: 20.5333, lng: 76.1833 }
  }
  
  // Check if any key from locationMap is in the location string
  for (const [key, coords] of Object.entries(locationMap)) {
    if (locationLower.includes(key)) {
      return coords
    }
  }
  
  // Default to a central location in India if no match
  return { lat: 20.5937, lng: 78.9629 }
}

// Helper function to extract coordinates from product data - FIXED VERSION
const extractCoordinates = (product: any): {lat: number, lng: number} | null => {
  if (!product) return null
  
  // Check if product has farm_coordinates (PostGIS POINT format)
  if (product.farm_coordinates && typeof product.farm_coordinates === 'string') {
    try {
      // Parse PostGIS POINT format: "POINT(lng lat)"
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
  
  // Check if coordinates are stored in quality_metrics
  if (product.quality_metrics) {
    try {
      // First check if it's already an object
      if (typeof product.quality_metrics === 'object' && product.quality_metrics !== null) {
        // Check if it has location.coordinates
        if (product.quality_metrics.location?.coordinates) {
          const { lat, lng } = product.quality_metrics.location.coordinates
          if (typeof lat === 'number' && typeof lng === 'number') {
            return { lat, lng }
          }
        }
      } 
      // If it's a string, try to parse it as JSON
      else if (typeof product.quality_metrics === 'string') {
        // Check if it looks like JSON (starts with { or [)
        const trimmed = product.quality_metrics.trim()
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
          const metrics = JSON.parse(product.quality_metrics)
          if (metrics?.location?.coordinates) {
            const { lat, lng } = metrics.location.coordinates
            if (typeof lat === 'number' && typeof lng === 'number') {
              return { lat, lng }
            }
          }
        }
        // Otherwise it's just a grade string like "Grade A - Premium Quality", ignore silently
      }
    } catch (e) {
      // Silently fail - it's probably just a grade string
      // Don't log to avoid console spam
    }
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
  
  const [distributorStats, setDistributorStats] = useState([
    { 
      label: "Available Products", 
      value: "0", 
      icon: Package,
      color: "text-blue-400"
    },
    { 
      label: "Purchased Stock", 
      value: "0T", 
      icon: Warehouse,
      color: "text-green-400"
    },
    { 
      label: "Total Spent", 
      value: "₹0", 
      icon: DollarSign,
      color: "text-emerald-400"
    },
  ])
  
  const router = useRouter()
  const supabase = createClient()

  // State for map markers from actual product locations
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
    hasGPS: boolean
  }>>([])
  const [selectedMarker, setSelectedMarker] = useState<any>(null)

  // Product categories
  const productCategories = [
    "All",
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

  // Check if distributor is verified
  const isDistributorVerified = () => {
    return profile?.verified === true
  }

  // Prevent back button after logout
  useEffect(() => {
    // Push current state to history
    window.history.pushState(null, '', window.location.href)
    
    // Handle back button
    const handlePopState = () => {
      // Check if user is logged in
      const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          // If not logged in, redirect to login and replace history
          window.location.replace('/auth/login')
        } else {
          // If logged in, push state again to prevent back
          window.history.pushState(null, '', window.location.href)
        }
      }
      checkUser()
    }

    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [supabase.auth])

  // Load product locations from database - using REAL coordinates from farmer registrations
  const loadProductLocations = async () => {
    try {
      setMapLoading(true)
      const markers = []
      
      console.log('🟡 Loading product locations from database...')
      console.log('🟡 Total products:', farmerProducts.length)
      
      for (const product of farmerProducts) {
        if (product?.farm_location && product?.quantity > 0) {
          // Try to extract real coordinates from the product data
          const coords = extractCoordinates(product)
          
          if (coords) {
            // Use the real GPS coordinates from farmer registration
            markers.push({
              id: `farm-${product.id}`,
              lat: coords.lat,
              lng: coords.lng,
              name: product.farm_location || 'Unknown location',
              productName: product.product_name || 'Unknown product',
              productId: product.id,
              farmerId: product.farmer_id || '',
              type: 'farm' as const,
              status: 'available' as const,
              quantity: product.quantity || 0,
              price: product.price_per_quintal || 0,
              hasGPS: true
            })
            console.log(`✅ Added farm marker with GPS: ${product.product_name} at ${coords.lat}, ${coords.lng}`)
          } else {
            // Fallback: Use approximate location based on city name
            console.log(`⚠️ Product ${product.product_name} has no GPS coordinates, using approximate location`)
            
            try {
              const approxCoords = await geocodeLocation(product.farm_location)
              if (approxCoords) {
                markers.push({
                  id: `farm-${product.id}`,
                  lat: approxCoords.lat,
                  lng: approxCoords.lng,
                  name: product.farm_location,
                  productName: product.product_name,
                  productId: product.id,
                  farmerId: product.farmer_id || '',
                  type: 'farm' as const,
                  status: 'available' as const,
                  quantity: product.quantity,
                  price: product.price_per_quintal,
                  hasGPS: false
                })
              }
            } catch (geoError) {
              console.error('Geocoding failed for:', product.farm_location, geoError)
            }
          }
        }
      }
      
      // Add warehouse location (distributor's location) - ONLY ONE
      if (profile?.address) {
        try {
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
              type: 'warehouse' as const,
              status: 'active' as const,
              quantity: purchasedProducts.reduce((sum, p) => sum + (p.quantity_purchased || p.quantity || 0), 0),
              price: 0,
              hasGPS: false
            })
          }
        } catch (warehouseError) {
          console.error('Error geocoding warehouse location:', warehouseError)
        }
      }
      
      console.log(`🟢 Created ${markers.length} map markers (${markers.filter(m => m.hasGPS).length} with GPS)`)
      setMapMarkers(markers)
      
    } catch (error) {
      console.error('🔴 Error loading product locations:', error)
    } finally {
      setMapLoading(false)
    }
  }

  // Update markers when products or profile changes
  useEffect(() => {
    if (farmerProducts.length > 0) {
      loadProductLocations()
    }
  }, [farmerProducts, profile])

  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem('supabase.auth.token')
    }

    const checkAuth = async () => {
      try {
        sessionStorage.setItem('logout_time', Date.now().toString())
        
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) {
          router.replace("/auth/login")
          return
        }
        
        // Get user metadata which should contain the role
        const userRole = authUser.user_metadata?.role || 'distributor'
        
        // Only allow distributor role to access this dashboard
        if (userRole !== 'distributor') {
          console.log('🔴 Unauthorized role:', userRole)
          router.replace("/auth/login")
          return
        }
        
        setUser({
          ...authUser,
          role: userRole
        })
        
        // Now load profile and products
        await loadDistributorProfile(authUser.id, userRole)
        await loadFarmerProducts()
        await loadPurchasedProducts(authUser.id)
        
      } catch (error) {
        console.error('🔴 Auth check error:', error)
        router.replace("/auth/login")
      }
    }
    checkAuth()

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [router, supabase.auth])

  // Load distributor profile
  const loadDistributorProfile = async (userId: string, userRole: string) => {
    try {
      setProfileLoading(true)
      console.log('🟡 Loading distributor profile for user:', userId)

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError) {
        console.log('🟡 Database profile query error:', profileError.message)
        
        if (profileError.code === 'PGRST116') {
          console.log('🟡 No profile found, creating default')
          
          const simpleProfile = {
            id: userId,
            email: user?.email || "",
            role: userRole,
            phone: "",
            address: "",
            business_name: "Distributor Business",
            verified: false,
            created_at: new Date().toISOString()
          }
          
          const { data: newProfile, error: insertError } = await supabase
            .from('profiles')
            .insert([simpleProfile])
            .select()
            .single()

          if (insertError) {
            console.log('🟡 Could not create profile:', insertError.message)
            setProfile(simpleProfile)
            setProfileForm({
              phone: "",
              address: "",
              business_name: "Distributor Business"
            })
          } else {
            console.log('🟢 Profile created:', newProfile)
            setProfile(newProfile)
            setProfileForm({
              phone: newProfile.phone || "",
              address: newProfile.address || "",
              business_name: newProfile.business_name || ""
            })
          }
          return
        }
      } else if (profileData) {
        console.log('🟢 Profile loaded:', profileData)
        setProfile(profileData)
        setProfileForm({
          phone: profileData.phone || "",
          address: profileData.address || "",
          business_name: profileData.business_name || ""
        })
        return
      }

    } catch (error) {
      console.error('🔴 Error loading profile:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  // Update profile
  const updateProfile = async () => {
    if (!user?.id) {
      console.error('🔴 No user ID available for profile update')
      return
    }

    try {
      setProfileLoading(true)

      const profileData = {
        id: user.id,
        email: user.email,
        role: user.role,
        phone: profileForm.phone,
        address: profileForm.address,
        business_name: profileForm.business_name,
        verified: profile?.verified || false,
        updated_at: new Date().toISOString()
      }

      console.log('🟡 Updating profile with data:', profileData)

      const { data: updatedProfile, error } = await supabase
        .from('profiles')
        .upsert([profileData])
        .select()
        .single()

      if (error) {
        console.log('🟡 Database update failed:', error.message)
        alert('Profile update failed: ' + error.message)
        return
      }

      console.log('🟢 Profile updated in database:', updatedProfile)
      setProfile(updatedProfile)
      setIsEditingProfile(false)
      alert('Profile updated successfully!')

    } catch (error) {
      console.error('🔴 Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setProfileLoading(false)
    }
  }

  // Load ALL farmer products from database
  const loadFarmerProducts = async () => {
    try {
      setLoading(true)
      console.log('🟡 Loading ALL farmer products from database')

      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .gt('quantity', 0) // Only products with available stock
        .order('created_at', { ascending: false })

      if (error) {
        console.error('🔴 Products query error:', error)
        return
      }

      if (!products || products.length === 0) {
        console.log('🟡 No products found')
        setFarmerProducts([])
        return
      }

      console.log('🟢 Successfully loaded farmer products:', products.length)
      
      // Log products with GPS coordinates
      const productsWithGPS = products.filter(p => 
        p.farm_coordinates || 
        (p.quality_metrics && 
         typeof p.quality_metrics === 'object' && 
         p.quality_metrics.location?.coordinates)
      )
      
      console.log(`🟢 Products with GPS coordinates: ${productsWithGPS.length} of ${products.length}`)
      
      setFarmerProducts(products)

    } catch (error) {
      console.error('🔴 Critical error loading farmer products:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load purchased products
  const loadPurchasedProducts = async (distributorId: string) => {
    try {
      console.log('🟡 Loading purchased products for:', distributorId)
      
      const { data: purchases, error } = await supabase
        .from('purchases')
        .select(`
          *,
          product:product_id (
            id,
            product_name,
            category,
            quantity,
            price_per_quintal,
            batch_number,
            farm_location,
            quality_metrics,
            status
          )
        `)
        .eq('distributor_id', distributorId)
        .order('purchased_at', { ascending: false })

      if (error) {
        console.log('🟡 Purchases table query error:', error)
        return
      }

      console.log('🟢 Loaded purchases:', purchases?.length)
      setPurchasedProducts(purchases || [])

    } catch (error) {
      console.error('🔴 Error loading purchased products:', error)
    }
  }

  // Update stats
  useEffect(() => {
    updateDistributorStats(farmerProducts, purchasedProducts)
  }, [farmerProducts, purchasedProducts])

  const updateDistributorStats = (products: any[], purchases: any[]) => {
    const totalAvailableProducts = products.length
    
    let totalPurchasedStock = 0
    let totalSpent = 0
    
    purchases.forEach(item => {
      totalPurchasedStock += item.quantity_purchased || 0
      totalSpent += item.total_amount || 0
    })

    setDistributorStats([
      { 
        label: "Available Products", 
        value: totalAvailableProducts.toString(), 
        icon: Package,
        color: "text-blue-400"
      },
      { 
        label: "Total Stock", 
        value: products.reduce((sum, p) => sum + p.quantity, 0) + ' q',
        icon: Warehouse,
        color: "text-green-400"
      },
      { 
        label: "Total Spent", 
        value: totalSpent >= 100000 ? `₹${(totalSpent/100000).toFixed(1)}L` : 
               totalSpent >= 1000 ? `₹${(totalSpent/1000).toFixed(1)}k` : `₹${totalSpent}`,
        icon: DollarSign,
        color: "text-emerald-400"
      },
    ])
  }

  // Purchase product - with verification check
  const purchaseProduct = async (product: any) => {
    if (!isDistributorVerified()) {
      alert("❌ You need to be verified by the admin before purchasing products.")
      return
    }

    if (!user?.id) {
      alert("Please login first")
      return
    }

    if (purchaseQuantity <= 0 || purchaseQuantity > product.quantity) {
      alert(`Please enter a valid quantity (1-${product.quantity})`)
      return
    }

    try {
      setLoading(true)

      // Update product quantity
      const newQuantity = product.quantity - purchaseQuantity
      const { error: updateError } = await supabase
        .from('products')
        .update({
          quantity: newQuantity,
          current_owner: newQuantity > 0 ? 'Farmer/Distributor' : 'Distributor',
          status: newQuantity > 0 ? 'Partially Purchased' : 'Sold Out'
        })
        .eq('id', product.id)

      if (updateError) {
        console.error('🔴 Product update error:', updateError)
        alert(`Purchase failed: ${updateError.message}`)
        return
      }

      // Create purchase record
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert([{
          product_id: product.id,
          distributor_id: user.id,
          quantity_purchased: purchaseQuantity,
          price_per_quintal: product.price_per_quintal,
          total_amount: purchaseQuantity * product.price_per_quintal,
          status: 'Purchased',
          purchased_at: new Date().toISOString()
        }])

      if (purchaseError) {
        console.log('🟡 Purchase record creation failed:', purchaseError)
      }

      alert(`✅ Purchase Successful!\nProduct: ${product.product_name}\nQuantity: ${purchaseQuantity} quintals\nTotal: ₹${purchaseQuantity * product.price_per_quintal}`)
      
      // Reload data
      await loadFarmerProducts()
      await loadPurchasedProducts(user.id)
      setSelectedProduct(null)
      setPurchaseQuantity(1)

    } catch (error) {
      console.error('🔴 Purchase error:', error)
      alert("❌ Failed to purchase product")
    } finally {
      setLoading(false)
    }
  }

  // Track product
  const trackProductOnBlockchain = async () => {
    if (!trackingId.trim()) {
      alert("Please enter a product ID or batch number")
      return
    }

    try {
      setTrackingLoading(true)
      setTrackingResult(null)
      
      const cleanTrackingId = trackingId.trim()
      
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('batch_number', cleanTrackingId)
        .single()

      if (error) {
        const { data: productById } = await supabase
          .from('products')
          .select('*')
          .eq('id', cleanTrackingId)
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
      console.error('🔴 Tracking error:', error)
      alert(`❌ Error tracking product: ${error}`)
    } finally {
      setTrackingLoading(false)
    }
  }

  // Filter products
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
    try {
      // Clear all auth-related data
      await supabase.auth.signOut()
      
      // Clear local storage
      localStorage.removeItem('supabase.auth.token')
      localStorage.removeItem('supabase.auth.refreshToken')
      if (user?.id) {
        localStorage.removeItem(`distributor_profile_${user.id}`)
      }
      
      // Set logout flag in session storage
      sessionStorage.setItem('logout_time', Date.now().toString())
      sessionStorage.setItem('logged_out', 'true')
      
      // Clear history and redirect - this prevents going back
      window.location.replace('/auth/login')
      
    } catch (error) {
      console.error('🔴 Logout error:', error)
      window.location.replace('/auth/login')
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not specified'
    try {
      return new Date(dateString).toLocaleDateString('en-IN')
    } catch {
      return 'Invalid date'
    }
  }

  const getQualityGrade = (product: any) => {
    if (!product.quality_metrics) return null
    try {
      if (typeof product.quality_metrics === 'string') {
        // If it's a string like "Grade A - Premium Quality", return it directly
        if (product.quality_metrics.includes('Grade')) {
          return product.quality_metrics
        }
        // Try to parse as JSON
        const metrics = JSON.parse(product.quality_metrics)
        return metrics.grade || null
      }
      return product.quality_metrics.grade || null
    } catch {
      return null
    }
  }

  // Render verification banner
  const renderVerificationBanner = () => {
    if (isDistributorVerified()) {
      return (
        <div className="bg-green-900/30 border border-green-800 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-green-400 font-medium">✓ Verified Distributor</p>
            <p className="text-sm text-green-300/70">Your account is verified. You can purchase products.</p>
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
        <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Farm Locations Map - Real GPS Data
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded-full flex items-center gap-1">
                <Map className="h-3 w-3" />
                {mapLoading ? 'Loading...' : `${mapMarkers.length} Locations`}
              </span>
            </div>
          </div>
          
          {mapLoading ? (
            <div className="h-[500px] rounded-lg border border-gray-700 flex items-center justify-center bg-gray-800">
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

          {/* Map Stats */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800 rounded-lg">
              <h4 className="font-medium text-white mb-2">Active Farms</h4>
              <p className="text-2xl font-bold text-green-400">
                {mapMarkers.filter(m => m.type === 'farm').length}
              </p>
              <p className="text-sm text-gray-400">With available products</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <h4 className="font-medium text-white mb-2">GPS Verified</h4>
              <p className="text-2xl font-bold text-blue-400">
                {mapMarkers.filter(m => m.hasGPS).length}
              </p>
              <p className="text-sm text-gray-400">Exact farm locations</p>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg">
              <h4 className="font-medium text-white mb-2">Total Stock</h4>
              <p className="text-2xl font-bold text-yellow-400">
                {farmerProducts.reduce((sum, p) => sum + p.quantity, 0)} q
              </p>
              <p className="text-sm text-gray-400">Quintals available</p>
            </div>
          </div>

          {/* Selected Marker Info */}
          {selectedMarker && selectedMarker.type === 'farm' && (
            <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-blue-500/30">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  {selectedMarker.productName}
                </h4>
                <div className="flex gap-2">
                  {selectedMarker.hasGPS && (
                    <span className="text-xs bg-blue-900 text-blue-400 px-2 py-1 rounded-full flex items-center gap-1">
                      <Crosshair className="h-3 w-3" />
                      GPS Verified
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">Location</p>
                  <p className="text-white">{selectedMarker.name}</p>
                </div>
                <div>
                  <p className="text-gray-400">Available</p>
                  <p className="text-white">{selectedMarker.quantity} quintals</p>
                </div>
                <div>
                  <p className="text-gray-400">Price</p>
                  <p className="text-white">₹{selectedMarker.price}/quintal</p>
                </div>
                {selectedMarker.hasGPS && (
                  <div>
                    <p className="text-gray-400">Coordinates</p>
                    <p className="text-white text-xs">
                      {selectedMarker.lat.toFixed(6)}, {selectedMarker.lng.toFixed(6)}
                    </p>
                  </div>
                )}
              </div>
              {isDistributorVerified() && (
                <Button
                  onClick={() => {
                    const product = farmerProducts.find(p => p.id === selectedMarker.productId)
                    if (product) setSelectedProduct(product)
                  }}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Purchase from this Farm
                </Button>
              )}
            </div>
          )}

          {/* Map Legend */}
          <div className="mt-6 p-4 bg-gray-800/50 rounded-lg">
            <h5 className="font-medium text-white mb-3">Map Legend</h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-300">Farm (GPS Verified)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm text-gray-300">Farm (Approx)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
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
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-white">KrishiSetu</h1>
              <p className="text-sm text-gray-400">Distributor Panel</p>
            </div>
          </div>
        </div>
        
        <nav className="p-4">
          <div className="space-y-2">
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
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === item.id
                    ? "bg-blue-600 text-white shadow-sm"
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
              Profile
            </h3>
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="text-gray-500 hover:text-white"
              disabled={profileLoading}
            >
              {isEditingProfile ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </button>
          </div>

          {profileLoading ? (
            <div className="text-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500 mx-auto" />
            </div>
          ) : isEditingProfile ? (
            <div className="space-y-3">
              <input
                type="text"
                value={profileForm.business_name}
                onChange={(e) => setProfileForm(prev => ({ ...prev, business_name: e.target.value }))}
                placeholder="Business Name"
                className="w-full p-2 text-sm bg-gray-800 border border-gray-700 rounded text-white"
              />
              <input
                type="text"
                value={profileForm.phone}
                onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone"
                className="w-full p-2 text-sm bg-gray-800 border border-gray-700 rounded text-white"
              />
              <textarea
                value={profileForm.address}
                onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Address"
                rows={2}
                className="w-full p-2 text-sm bg-gray-800 border border-gray-700 rounded text-white"
              />
              <Button onClick={updateProfile} size="sm" className="w-full bg-blue-600">
                <Save className="h-3 w-3 mr-1" /> Save
              </Button>
            </div>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="text-white truncate">{profile?.business_name || user?.email}</p>
              {profile?.phone && <p className="text-gray-400">{profile.phone}</p>}
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  profile?.verified ? 'bg-green-900 text-green-400' : 'bg-yellow-900 text-yellow-400'
                }`}>
                  {profile?.verified ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Section with Logout Button */}
        <div className="p-4 border-t border-gray-800 mt-4">
          <div className="flex items-center gap-3 p-3">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium">
              <User className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {profile?.business_name || user?.email || 'Distributor'}
              </p>
              <p className="text-xs text-gray-400 capitalize">{user?.role || profile?.role || 'distributor'} Account</p>
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
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-white">
                {activeTab === "dashboard" && "Dashboard"}
                {activeTab === "marketplace" && "Farm Products"}
                {activeTab === "my-purchases" && "My Purchases"}
                {activeTab === "tracking" && "Tracking"}
                {activeTab === "routes" && "Farm Locations"}
                {activeTab === "retailers" && "Retailers"}
                {activeTab === "revenue" && "Revenue"}
              </h1>
              <p className="text-sm text-gray-400">
                {farmerProducts.length} products available • {mapMarkers.filter(m => m.hasGPS).length} GPS verified locations
              </p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 bg-black">
          {loading && <div className="fixed top-0 left-0 w-full h-1 bg-blue-500 z-50 animate-pulse" />}

          {/* Verification Banner */}
          {renderVerificationBanner()}

          {activeTab === "dashboard" && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {distributorStats.map((stat, index) => (
                  <div key={index} className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                    <div className="flex justify-between">
                      <div>
                        <p className="text-sm text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                      </div>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Products List */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Available Products ({farmerProducts.length})
                </h3>
                {farmerProducts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No products available</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {farmerProducts.slice(0, 5).map((product) => {
                      const hasGPS = extractCoordinates(product) !== null
                      return (
                        <div key={product.id} className="p-3 bg-gray-800 rounded-lg">
                          <div className="flex justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white">{product.product_name}</p>
                                {hasGPS && (
                                  <span className="text-xs bg-blue-900 text-blue-400 px-2 py-0.5 rounded-full">
                                    GPS
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-400">
                                {product.quantity} q • ₹{product.price_per_quintal}/q
                              </p>
                              <p className="text-xs text-gray-500">{product.farm_location}</p>
                            </div>
                            <button
                              onClick={() => setSelectedProduct(product)}
                              disabled={!isDistributorVerified()}
                              className={`px-3 py-1 rounded text-sm ${
                                isDistributorVerified() 
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                                  : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                              }`}
                            >
                              Buy
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "marketplace" && (
            <div className="space-y-6">
              {/* Search and Filter */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      className="w-full pl-10 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select
                    className="p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {productCategories.map(cat => (
                      <option key={cat} value={cat.toLowerCase()}>{cat}</option>
                    ))}
                  </select>
                </div>

                {/* Verification warning for unverified distributors */}
                {!isDistributorVerified() && (
                  <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-800 rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                      <div>
                        <p className="text-yellow-400 font-medium">Verification Required</p>
                        <p className="text-sm text-yellow-300/70">
                          You need to be verified by the admin before you can purchase products.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Products Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product) => {
                    const qualityGrade = getQualityGrade(product)
                    const hasGPS = extractCoordinates(product) !== null
                    
                    return (
                      <div key={product.id} className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-white">{product.product_name}</h3>
                          {hasGPS && (
                            <span className="text-xs bg-blue-900 text-blue-400 px-2 py-1 rounded-full flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              GPS
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mb-1">Category: {product.category}</p>
                        <p className="text-sm text-gray-400 mb-1">Quantity: {product.quantity} q</p>
                        <p className="text-sm text-gray-400 mb-1">Price: ₹{product.price_per_quintal}/q</p>
                        <p className="text-sm text-gray-400 mb-3">Location: {product.farm_location}</p>
                        {qualityGrade && (
                          <span className="text-xs px-2 py-1 bg-green-900 text-green-400 rounded-full">
                            {qualityGrade}
                          </span>
                        )}
                        <Button
                          onClick={() => setSelectedProduct(product)}
                          className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={!isDistributorVerified()}
                        >
                          {!isDistributorVerified() ? 'Verification Required' : 'Purchase'}
                        </Button>
                      </div>
                    )
                  })}
                </div>

                {filteredProducts.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No products found</p>
                )}
              </div>

              {/* Purchase Modal */}
              {selectedProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-lg font-semibold text-white mb-4">Purchase {selectedProduct.product_name}</h3>
                    <div className="space-y-4">
                      <p className="text-gray-400">Available: {selectedProduct.quantity} quintals</p>
                      <p className="text-gray-400">Price: ₹{selectedProduct.price_per_quintal}/quintal</p>
                      <div>
                        <label className="text-sm text-gray-400">Quantity (quintals)</label>
                        <input
                          type="number"
                          min="1"
                          max={selectedProduct.quantity}
                          value={purchaseQuantity}
                          onChange={(e) => setPurchaseQuantity(Number(e.target.value))}
                          className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white mt-1"
                        />
                      </div>
                      <p className="text-xl font-bold text-white">
                        Total: ₹{purchaseQuantity * selectedProduct.price_per_quintal}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => purchaseProduct(selectedProduct)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={loading}
                        >
                          {loading ? 'Processing...' : 'Confirm Purchase'}
                        </Button>
                        <Button
                          onClick={() => setSelectedProduct(null)}
                          className="flex-1 bg-gray-700 hover:bg-gray-600 text-white"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "my-purchases" && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">My Purchases</h3>
              {purchasedProducts.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No purchases yet</p>
              ) : (
                <div className="space-y-3">
                  {purchasedProducts.map((item) => (
                    <div key={item.id} className="p-4 bg-gray-800 rounded-lg">
                      <p className="font-medium text-white">{item.product?.product_name}</p>
                      <p className="text-sm text-gray-400">
                        {item.quantity_purchased} q • ₹{item.total_amount}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(item.purchased_at).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "tracking" && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Track Product</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Batch Number or Product ID"
                  className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg text-white"
                  value={trackingId}
                  onChange={(e) => setTrackingId(e.target.value)}
                />
                <Button onClick={trackProductOnBlockchain} className="bg-blue-600 text-white">
                  Track
                </Button>
              </div>
              {trackingResult && (
                <div className="mt-6 p-4 bg-gray-800 rounded-lg">
                  <h4 className="font-semibold text-white mb-3">Product Details</h4>
                  <p className="text-gray-400">Name: {trackingResult.product_name}</p>
                  <p className="text-gray-400">Batch: {trackingResult.batch_number}</p>
                  <p className="text-gray-400">Owner: {trackingResult.current_owner}</p>
                  <p className="text-gray-400">Status: {trackingResult.status}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "routes" && renderRoutesSection()}

          {activeTab === "retailers" && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 text-center py-8">
              <Users className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Retailer Network</h2>
              <p className="text-gray-400">Coming soon</p>
            </div>
          )}

          {activeTab === "revenue" && (
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6 text-center py-8">
              <DollarSign className="h-16 w-16 text-blue-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Revenue Analytics</h2>
              <p className="text-gray-400">Coming soon</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}