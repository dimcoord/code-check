import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/utils/supabase/server"

type SubmissionDetail = {
  id: string
  problem: string
  language: string
  status: string
  runtime: string
  code: string
  token?: string | null
  created_at: string
  profiles?: {
    username?: string | null
    email?: string | null
    bio?: string | null
  } | null
}

function getStatusVariant(status: string) {
  if (status === "Accepted") return "success"
  if (status === "In Queue" || status === "Processing") return "default"
  return "destructive"
}

function getLanguageLabel(language: string) {
  if (language === "76") return "C++"
  return language
}

export default async function SubmissionReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    notFound()
  }

  const { data: submission, error } = await supabase
    .from("submissions")
    .select("*, profiles(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single<SubmissionDetail>()

  if (error || !submission) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Submission Review</h2>
          <p className="text-muted-foreground">
            Inspect the code, runtime, and evaluation status for this submission.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard/submissions">Back to submissions</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>{submission.problem}</CardTitle>
            <CardDescription>
              Submitted on {new Date(submission.created_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant={getStatusVariant(submission.status)}>
                {submission.status}
              </Badge>
              <Badge variant="outline">{getLanguageLabel(submission.language)}</Badge>
              <Badge variant="outline">{submission.runtime}</Badge>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Source Code</p>
              <pre className="overflow-x-auto rounded-lg border bg-muted/40 p-4 text-sm leading-6">
                <code>{submission.code}</code>
              </pre>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Submission Details</CardTitle>
            <CardDescription>
              Metadata returned from the code runner and your account profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Submission ID</p>
              <p className="font-medium">{submission.id}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Token</p>
              <p className="font-medium break-all">{submission.token ?? "Unavailable"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-muted-foreground">Profile</p>
              <p className="font-medium">{submission.profiles?.username ?? "Unknown"}</p>
              <p className="text-muted-foreground break-all">{submission.profiles?.email ?? "Unknown"}</p>
            </div>
            {submission.profiles?.bio ? (
              <div className="space-y-1">
                <p className="text-muted-foreground">Bio</p>
                <p className="leading-6">{submission.profiles.bio}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}