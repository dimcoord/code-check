'use client'

import { useState } from "react"
import CodeMirror from "@uiw/react-codemirror"
import { cpp } from "@codemirror/lang-cpp"
import { vscodeDark } from "@uiw/codemirror-theme-vscode"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { submitCode } from "@/app/actions/submit-code"
import { useToast } from "@/hooks/use-toast"

const languages = [
  { value: "76", label: "C++", extension: cpp },
]

export default function SubmitPage() {
  const [code, setCode] = useState("")
  const [language, setLanguage] = useState(languages[0])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)
      await submitCode(code, language.value, "Sample Problem")
      toast({
        title: "Success",
        description: "Your code has been submitted successfully.",
      })
      router.push('/dashboard/submissions')
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit code. Please try again.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Submit Code</h2>
        <p className="text-muted-foreground">
          Write your code and submit it for evaluation.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Code Editor</CardTitle>
          <CardDescription>
            Select your preferred language and write your code below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select
            value={language.value}
            onValueChange={(value) =>
              setLanguage(languages.find((l) => l.value === value)!)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="rounded-md border">
            <CodeMirror
              value={code}
              height="400px"
              theme={vscodeDark}
              extensions={[language.extension()]}
              onChange={(value) => setCode(value)}
            />
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Code"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

