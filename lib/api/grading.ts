import { apiClient } from "@/lib/api-client"
import type { ExamSubmission, GradingResult, ManualGrade } from "@/lib/types"

// Get submissions pending grading
export async function getSubmissionsPendingGrading(params?: {
  examId?: string
  scheduleId?: string
  page?: number
  pageSize?: number
}): Promise<{ items: ExamSubmission[]; totalCount: number }> {
  try {
    return await apiClient.get("/api/grading/pending", params)
  } catch {
    return {
      items: [
        {
          id: "sub-1",
          attemptId: "attempt-1",
          candidateId: "cand-1",
          candidateName: "Ahmed Hassan",
          candidateEmail: "ahmed@example.com",
          examId: "exam-1",
          examTitle: "Mathematics Final Exam",
          scheduleId: "sch-1",
          submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          status: "PendingManualGrading",
          autoScore: 75,
          manualQuestionsCount: 3,
          gradedQuestionsCount: 0,
          totalQuestions: 25,
        },
        {
          id: "sub-2",
          attemptId: "attempt-2",
          candidateId: "cand-2",
          candidateName: "Sara Ali",
          candidateEmail: "sara@example.com",
          examId: "exam-1",
          examTitle: "Mathematics Final Exam",
          scheduleId: "sch-1",
          submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          status: "PendingManualGrading",
          autoScore: 82,
          manualQuestionsCount: 3,
          gradedQuestionsCount: 1,
          totalQuestions: 25,
        },
        {
          id: "sub-3",
          attemptId: "attempt-3",
          candidateId: "cand-3",
          candidateName: "Mohammed Khalid",
          candidateEmail: "mohammed@example.com",
          examId: "exam-2",
          examTitle: "Physics Midterm",
          scheduleId: "sch-2",
          submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          status: "PendingManualGrading",
          autoScore: 68,
          manualQuestionsCount: 5,
          gradedQuestionsCount: 3,
          totalQuestions: 20,
        },
      ],
      totalCount: 3,
    }
  }
}

// Get submission details for grading
export async function getSubmissionForGrading(submissionId: string): Promise<GradingResult> {
  try {
    return await apiClient.get(`/api/grading/submissions/${submissionId}`)
  } catch {
    return {
      id: submissionId,
      candidateName: "Ahmed Hassan",
      candidateEmail: "ahmed@example.com",
      examTitle: "Mathematics Final Exam",
      submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      status: "PendingManualGrading",
      autoScore: 75,
      finalScore: null,
      totalPoints: 100,
      earnedPoints: 75,
      passingScore: 70,
      passed: null,
      sections: [
        {
          id: "sec-1",
          title: "Multiple Choice",
          questions: [
            {
              id: "q1",
              questionId: "question-1",
              body: "What is the derivative of x² + 3x + 2?",
              type: "MultipleChoice",
              points: 5,
              earnedPoints: 5,
              isAutoGraded: true,
              candidateAnswer: { selectedOptionIds: ["opt1"], textAnswer: null },
              correctAnswer: { optionIds: ["opt1"], text: "2x + 3" },
              isCorrect: true,
            },
            {
              id: "q2",
              questionId: "question-2",
              body: "Which of the following is the integral of sin(x)?",
              type: "MultipleChoice",
              points: 5,
              earnedPoints: 0,
              isAutoGraded: true,
              candidateAnswer: { selectedOptionIds: ["opt6"], textAnswer: null },
              correctAnswer: { optionIds: ["opt5"], text: "-cos(x) + C" },
              isCorrect: false,
            },
          ],
        },
        {
          id: "sec-2",
          title: "Short Answer",
          questions: [
            {
              id: "q6",
              questionId: "question-6",
              body: "Explain the Fundamental Theorem of Calculus in your own words.",
              type: "ShortAnswer",
              points: 15,
              earnedPoints: null,
              isAutoGraded: false,
              needsManualGrading: true,
              candidateAnswer: {
                selectedOptionIds: null,
                textAnswer:
                  "The Fundamental Theorem of Calculus connects differentiation and integration. It states that if F is an antiderivative of f on [a,b], then the definite integral of f from a to b equals F(b) - F(a). This means we can evaluate definite integrals by finding antiderivatives.",
              },
              correctAnswer: null,
              rubric:
                "Full points for explaining both parts of the theorem with correct understanding of antiderivatives and definite integrals.",
              isCorrect: null,
            },
            {
              id: "q7",
              questionId: "question-7",
              body: "Derive the formula for the area of a circle using integration.",
              type: "Essay",
              points: 20,
              earnedPoints: null,
              isAutoGraded: false,
              needsManualGrading: true,
              candidateAnswer: {
                selectedOptionIds: null,
                textAnswer:
                  "To derive the area of a circle, we can integrate in polar coordinates. The area element is r dr dθ. For a circle of radius R, we integrate r from 0 to R and θ from 0 to 2π.\n\nA = ∫₀²π ∫₀ᴿ r dr dθ\n= ∫₀²π [r²/2]₀ᴿ dθ\n= ∫₀²π (R²/2) dθ\n= (R²/2)[θ]₀²π\n= (R²/2)(2π)\n= πR²\n\nTherefore, the area of a circle is πR².",
              },
              correctAnswer: null,
              rubric:
                "Award points for: correct setup (5pts), proper integration (10pts), correct final answer (5pts). Partial credit for alternative valid methods.",
              isCorrect: null,
            },
          ],
        },
      ],
    }
  }
}

// Submit manual grade
export async function submitManualGrade(submissionId: string, questionId: string, grade: ManualGrade): Promise<void> {
  try {
    await apiClient.post(`/api/grading/submissions/${submissionId}/questions/${questionId}/grade`, grade)
  } catch {
    // Mock - grade saved
  }
}

// Finalize grading
export async function finalizeGrading(submissionId: string): Promise<{ finalScore: number; passed: boolean }> {
  try {
    return await apiClient.post(`/api/grading/submissions/${submissionId}/finalize`)
  } catch {
    return { finalScore: 85, passed: true }
  }
}

// Get exam results/analytics
export async function getExamResults(
  examId: string,
  scheduleId?: string,
): Promise<{
  summary: {
    totalCandidates: number
    completed: number
    pending: number
    averageScore: number
    passRate: number
    highestScore: number
    lowestScore: number
  }
  candidates: Array<{
    id: string
    name: string
    email: string
    score: number | null
    status: string
    submittedAt: string | null
    passed: boolean | null
  }>
}> {
  try {
    return await apiClient.get(`/api/exams/${examId}/results`, { scheduleId })
  } catch {
    return {
      summary: {
        totalCandidates: 45,
        completed: 42,
        pending: 3,
        averageScore: 78.5,
        passRate: 84,
        highestScore: 98,
        lowestScore: 45,
      },
      candidates: [
        {
          id: "c1",
          name: "Ahmed Hassan",
          email: "ahmed@example.com",
          score: 92,
          status: "Graded",
          submittedAt: new Date().toISOString(),
          passed: true,
        },
        {
          id: "c2",
          name: "Sara Ali",
          email: "sara@example.com",
          score: 88,
          status: "Graded",
          submittedAt: new Date().toISOString(),
          passed: true,
        },
        {
          id: "c3",
          name: "Mohammed Khalid",
          email: "mohammed@example.com",
          score: 76,
          status: "Graded",
          submittedAt: new Date().toISOString(),
          passed: true,
        },
        {
          id: "c4",
          name: "Fatima Ahmed",
          email: "fatima@example.com",
          score: 65,
          status: "Graded",
          submittedAt: new Date().toISOString(),
          passed: false,
        },
        {
          id: "c5",
          name: "Omar Youssef",
          email: "omar@example.com",
          score: null,
          status: "PendingGrading",
          submittedAt: new Date().toISOString(),
          passed: null,
        },
      ],
    }
  }
}
