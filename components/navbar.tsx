"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Leaf } from "lucide-react"

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm border-b border-white/10">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <div className="p-2 rounded-lg bg-emerald-500/10">
              <Leaf className="h-6 w-6 text-emerald-400" />
            </div>
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              KrishiSetu
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/about">
              <Button variant="ghost" size="sm" className="text-white hover:text-emerald-400 hover:bg-white/10">
                About Us
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" size="sm" className="text-white hover:text-teal-400 hover:bg-white/10">
                Contact Us
              </Button>
            </Link>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/auth/login">
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 bg-transparent"
              >
                Login
              </Button>
            </Link>
            <Link href="/auth/register">
              <Button
                size="sm"
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
              >
                Register
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
