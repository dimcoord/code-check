import Link from "next/link"
import { ArrowRight, Code2, Trophy, Users } from 'lucide-react'

import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <div className="relative isolate">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Master Your Coding Skills
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Practice coding, submit your solutions, and improve your programming skills. Join our community of developers and start your coding journey today.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button asChild size="lg">
              <Link href="/register">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/problems">
                View Problems
              </Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="mt-8 sm:mt-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto grid max-w-lg grid-cols-1 items-center gap-6 sm:max-w-xl sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
            <div className="flex items-center gap-x-4 rounded-xl bg-muted p-6">
              <Code2 className="h-12 w-12" />
              <div>
                <h3 className="font-semibold">Multiple Languages</h3>
                <p className="text-sm text-muted-foreground">Python, JavaScript, and more</p>
              </div>
            </div>
            <div className="flex items-center gap-x-4 rounded-xl bg-muted p-6">
              <Trophy className="h-12 w-12" />
              <div>
                <h3 className="font-semibold">Instant Feedback</h3>
                <p className="text-sm text-muted-foreground">Real-time code evaluation</p>
              </div>
            </div>
            <div className="flex items-center gap-x-4 rounded-xl bg-muted p-6">
              <Users className="h-12 w-12" />
              <div>
                <h3 className="font-semibold">Active Community</h3>
                <p className="text-sm text-muted-foreground">Learn from others</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

