import Link from "next/link"
import { Code2 } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto max-w-7xl overflow-hidden px-6 py-20 sm:py-24 lg:px-8">
        <nav className="-mb-6 columns-2 sm:flex sm:justify-center sm:space-x-12" aria-label="Footer">
          <div className="pb-6">
            <Link href="/about" className="text-sm leading-6 text-muted-foreground hover:text-foreground">
              About
            </Link>
          </div>
          <div className="pb-6">
            <Link href="/blog" className="text-sm leading-6 text-muted-foreground hover:text-foreground">
              Blog
            </Link>
          </div>
          <div className="pb-6">
            <Link href="/careers" className="text-sm leading-6 text-muted-foreground hover:text-foreground">
              Careers
            </Link>
          </div>
          <div className="pb-6">
            <Link href="/pricing" className="text-sm leading-6 text-muted-foreground hover:text-foreground">
              Pricing
            </Link>
          </div>
        </nav>
        <div className="mt-10 flex justify-center items-center space-x-2">
          <Code2 className="h-6 w-6" />
          <p className="text-sm leading-5 text-muted-foreground">
            &copy; {new Date().getFullYear()} CodeJudge. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

