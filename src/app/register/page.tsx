"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BirdieLogo } from "@/components/icons/BirdieLogo"

export default function RegisterPage() {
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Registration failed")
        return
      }

      router.push("/login?registered=true")
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#0a0a0a]">
      <Card className="w-full max-w-md border-white/10 bg-white/[0.03] backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-center gap-1 mb-2">
            <BirdieLogo className="w-12 h-12" />
            <span className="text-2xl font-bold"><span className="text-sky-300">Bird</span><span className="text-amber-400">ie</span></span>
          </div>
          <CardTitle className="text-white text-center">Create an account</CardTitle>
          <CardDescription className="text-center">Get started with Birdie for free</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-500/15 border border-red-500/20 p-3 text-sm text-red-400">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-gray-300">Name (optional)</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-emerald-500/50"
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:from-emerald-400 hover:to-cyan-400" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Register"}
            </Button>
            <div className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-emerald-400 hover:text-emerald-300 hover:underline">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
