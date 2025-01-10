export interface Submission {
    id: string
    problem: string
    language: string
    status: "Accepted" | "Wrong Answer" | "Time Limit Exceeded" | "Runtime Error"
    runtime: string
    submittedAt: string
    code: string
  }
  
  