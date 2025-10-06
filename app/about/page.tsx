import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Target, Eye, Award, Users } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background dark">
      <Navbar />

      <main className="pt-24 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-white">About KrishiSetu</h1>
            <p className="text-xl text-gray-400 leading-relaxed">
              Building the future of agricultural supply chain management
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <Card className="bg-card/50 backdrop-blur border-border">
              <CardContent className="p-8 space-y-4">
                <div className="p-3 rounded-lg bg-emerald-500/10 w-fit">
                  <Target className="h-8 w-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Our Mission</h2>
                <p className="text-gray-400 leading-relaxed">
                  To empower farmers and agricultural stakeholders with blockchain technology, ensuring transparency,
                  trust, and fair practices throughout the supply chain.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur border-border">
              <CardContent className="p-8 space-y-4">
                <div className="p-3 rounded-lg bg-teal-500/10 w-fit">
                  <Eye className="h-8 w-8 text-teal-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Our Vision</h2>
                <p className="text-gray-400 leading-relaxed">
                  To create a world where every agricultural product can be traced from farm to table, building consumer
                  confidence and supporting sustainable farming practices.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Story Section */}
          <Card className="mb-16 bg-card/50 backdrop-blur border-border">
            <CardContent className="p-8 space-y-6">
              <h2 className="text-3xl font-bold text-white">Our Story</h2>
              <div className="space-y-4 text-gray-400 leading-relaxed">
                <p>
                  KrishiSetu was born from a simple observation: the agricultural supply chain lacked transparency,
                  leading to mistrust between farmers, suppliers, and consumers. We saw farmers struggling to get fair
                  prices, consumers worried about product authenticity, and suppliers facing challenges in quality
                  verification.
                </p>
                <p>
                  Leveraging blockchain technology, we created a platform that records every transaction and movement in
                  the supply chain. From the moment a seed is planted to when the product reaches the consumer, every
                  step is documented, verified, and accessible to all stakeholders.
                </p>
                <p>
                  Today, KrishiSetu serves thousands of farmers, suppliers, and consignees across India, helping them
                  build trust, reduce fraud, and create a more efficient agricultural ecosystem.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Values */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-center mb-8 text-white">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur border-border">
                <CardContent className="p-6 space-y-3">
                  <Award className="h-6 w-6 text-emerald-400" />
                  <h3 className="text-xl font-semibold text-white">Transparency</h3>
                  <p className="text-gray-400 leading-relaxed">
                    We believe in complete openness and honesty in all supply chain operations
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border">
                <CardContent className="p-6 space-y-3">
                  <Users className="h-6 w-6 text-teal-400" />
                  <h3 className="text-xl font-semibold text-white">Empowerment</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Giving farmers and suppliers the tools they need to succeed in modern markets
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border">
                <CardContent className="p-6 space-y-3">
                  <Target className="h-6 w-6 text-indigo-400" />
                  <h3 className="text-xl font-semibold text-white">Innovation</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Continuously improving our platform with cutting-edge technology
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur border-border">
                <CardContent className="p-6 space-y-3">
                  <Eye className="h-6 w-6 text-purple-400" />
                  <h3 className="text-xl font-semibold text-white">Sustainability</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Promoting eco-friendly practices and responsible resource management
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
