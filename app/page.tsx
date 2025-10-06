import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Leaf, Shield, TrendingUp, Users, CheckCircle, QrCode } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-background to-teal-500/5" />
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h1 className="text-5xl md:text-6xl font-bold leading-tight text-balance text-white">
              Revolutionizing Agricultural{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Supply Chain
              </span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed text-pretty max-w-2xl mx-auto">
              Track every step of your agricultural products journey with blockchain-powered transparency and trust
            </p>
            <div className="flex flex-wrap gap-4 justify-center pt-4">
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                >
                  Get Started
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Why Choose KrishiSetu?</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Empowering farmers, suppliers, and consumers with cutting-edge blockchain technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-card/50 backdrop-blur border-border hover:border-emerald-500/50 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 rounded-lg bg-emerald-500/10 w-fit">
                  <Shield className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Blockchain Security</h3>
                <p className="text-gray-400 leading-relaxed">
                  Immutable records ensure complete transparency and prevent fraud in the supply chain
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border hover:border-teal-500/50 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 rounded-lg bg-teal-500/10 w-fit">
                  <QrCode className="h-6 w-6 text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">QR Code Tracking</h3>
                <p className="text-gray-400 leading-relaxed">
                  Scan and track products instantly from farm to consumer with unique QR codes
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border hover:border-indigo-500/50 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 rounded-lg bg-indigo-500/10 w-fit">
                  <TrendingUp className="h-6 w-6 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Real-Time Analytics</h3>
                <p className="text-gray-400 leading-relaxed">
                  Monitor supply chain performance with live data and actionable insights
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border hover:border-purple-500/50 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 rounded-lg bg-purple-500/10 w-fit">
                  <Users className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Multi-Role Access</h3>
                <p className="text-gray-400 leading-relaxed">
                  Tailored dashboards for farmers, suppliers, and consignees with role-based permissions
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border hover:border-emerald-500/50 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 rounded-lg bg-emerald-500/10 w-fit">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Quality Verification</h3>
                <p className="text-gray-400 leading-relaxed">
                  Automated quality checks and certifications at every stage of the supply chain
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border hover:border-teal-500/50 transition-all">
              <CardContent className="p-6 space-y-4">
                <div className="p-3 rounded-lg bg-teal-500/10 w-fit">
                  <Leaf className="h-6 w-6 text-teal-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Sustainable Farming</h3>
                <p className="text-gray-400 leading-relaxed">
                  Promote eco-friendly practices and track sustainability metrics throughout the chain
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
            <CardContent className="p-12 text-center space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to Transform Your Supply Chain?</h2>
              <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                Join thousands of farmers and suppliers already using KrishiSetu to build trust and transparency
              </p>
              <Link href="/auth/register">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                >
                  Start Your Journey
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  )
}
