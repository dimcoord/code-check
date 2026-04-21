import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { createClient } from '@/utils/supabase/server'
import { updateStatus } from "@/app/actions/update-status"

export default async function SubmissionsPage() {
  const supabase = createClient()

  try {
    await updateStatus()
  } catch (error) {
    console.error('Failed to refresh submission statuses', error)
  }
  
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, profiles(*)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Submissions</h2>
        <p className="text-muted-foreground">
          Review your previous code submissions.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Problem</TableHead>
            <TableHead>Language</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Runtime</TableHead>
            <TableHead>Submitted At</TableHead>
            <TableHead className="text-right">Review</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {submissions?.map((submission) => (
            <TableRow key={submission.id}>
              <TableCell className="font-medium">{submission.problem}</TableCell>
              <TableCell>{submission.language == '76' ? 'C++' : 'C'}</TableCell>
              <TableCell>
                <Badge
                  variant={
                    submission.status === "Accepted" ? "success" : 
                    submission.status === "In Queue" || submission.status === "Processing" ? "default" : "destructive"
                  }
                >
                  {submission.status}
                </Badge>
              </TableCell>
              <TableCell>{submission.runtime}</TableCell>
              <TableCell>{new Date(submission.created_at).toLocaleString()}</TableCell>
              <TableCell className="text-right">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/dashboard/submissions/${submission.id}`}>
                    Review
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

