import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/matches")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 via-blue-50 to-green-50">
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjMDBhYTUwIiBzdHJva2Utd2lkdGg9IjEiIG9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-40"></div>

      <div className="text-center space-y-8 max-w-4xl mx-auto relative z-10 px-4">
        {/* Hero Section */}
        <div className="space-y-4">
          <div className="inline-block animate-bounce">
            <div className="text-5xl md:text-7xl mb-4">🏸</div>
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Badminton Scorer
          </h1>
          <p className="text-lg md:text-2xl text-gray-700 max-w-2xl mx-auto font-medium">
            Professional Match Scoring & Management System
          </p>
          <p className="text-base md:text-lg text-gray-600 max-w-xl mx-auto">
            Following Official BWF Rules & Regulations
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12">
          <Card className="bg-white/80 backdrop-blur border-green-200 hover:shadow-xl transition-all hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">📊</div>
              <h3 className="font-bold text-lg mb-2 text-gray-800">Live Scoring</h3>
              <p className="text-sm text-gray-600">Real-time match scoring with BWF rules</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur border-blue-200 hover:shadow-xl transition-all hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">🏆</div>
              <h3 className="font-bold text-lg mb-2 text-gray-800">Tournaments</h3>
              <p className="text-sm text-gray-600">Organize and manage tournaments</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur border-green-200 hover:shadow-xl transition-all hover:scale-105">
            <CardContent className="p-6 text-center">
              <div className="text-4xl mb-3">👥</div>
              <h3 className="font-bold text-lg mb-2 text-gray-800">Player Stats</h3>
              <p className="text-sm text-gray-600">Track player performance & ratings</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
          <Link href="/login" className="w-full sm:w-auto">
            <Button size="lg" className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all text-base md:text-lg px-6 md:px-8 py-4 md:py-6">
              🚀 Get Started
            </Button>
          </Link>
          <Link href="/register" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full border-2 border-green-600 text-green-700 hover:bg-green-50 text-base md:text-lg px-6 md:px-8 py-4 md:py-6 shadow-lg hover:shadow-xl transition-all">
              📝 Register
            </Button>
          </Link>
        </div>
      </div>
    </main>
  )
}
