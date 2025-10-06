"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Leaf } from "lucide-react"

export default function RegisterSuccessPage() {
  const router = useRouter()

  // Auto-redirect to login after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/auth/login")
    }, 5000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-background dark flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center gap-2 text-xl font-bold">
            <div className="p-2 rounded-lg bg-primary/10">
              <Leaf className="h-6 w-6 text-primary" />
            </div>
            <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              KrishiSetu
            </span>
          </Link>

          <Card className="bg-card/50 backdrop-blur border-border">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-emerald-500/10 w-fit">
                <CheckCircle className="h-12 w-12 text-emerald-400" />
              </div>
              <CardTitle className="text-2xl">Registration Successful!</CardTitle>
              <CardDescription>Check your email to confirm your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground text-center leading-relaxed">
                We’ve sent a confirmation email to your inbox. Please verify your email address before signing in.
              </p>

              {/* Login Button */}
              <Link href="/auth/login" className="block">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  Go to Login
                </Button>
              </Link>

              {/* Resend Link */}
              <p className="text-center text-sm mt-2">
                Didn’t get the email?{" "}
                <Link href="/auth/resend-verification" className="text-primary underline underline-offset-4">
                  Resend Verification
                </Link>
              </p>

              {/* Auto Redirect Notice */}
              <p className="text-center text-xs text-muted-foreground mt-2">
                You’ll be redirected to login in 5 seconds...
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
