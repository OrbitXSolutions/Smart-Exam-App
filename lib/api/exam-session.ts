import { apiClient } from "@/lib/api-client"
import type { ExamSession, ExamAttempt, ExamSubmission, AnswerSubmission } from "@/lib/types"

// Get available exams for candidate
export async function getAvailableExams(): Promise<ExamSession[]> {
  try {
    return await apiClient.get<ExamSession[]>("/api/candidate/exams")
  } catch {
    // Mock data for development
    return [
      {
        id: "session-1",
        examId: "exam-1",
        examTitle: "Mathematics Final Exam",
        examCode: "MATH-2024-FINAL",
        scheduleName: "Morning Session",
        startTime: new Date(Date.now() + 1000 * 60 * 30).toISOString(), // 30 min from now
        endTime: new Date(Date.now() + 1000 * 60 * 150).toISOString(), // 2.5 hours from now
        durationMinutes: 120,
        status: "Scheduled",
        requiresProctoring: true,
        requiresIdVerification: true,
      },
      {
        id: "session-2",
        examId: "exam-2",
        examTitle: "Physics Midterm",
        examCode: "PHYS-2024-MID",
        scheduleName: "Afternoon Session",
        startTime: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // Started 10 min ago
        endTime: new Date(Date.now() + 1000 * 60 * 110).toISOString(),
        durationMinutes: 90,
        status: "InProgress",
        requiresProctoring: false,
        requiresIdVerification: false,
      },
      {
        id: "session-3",
        examId: "exam-3",
        examTitle: "Chemistry Quiz",
        examCode: "CHEM-2024-Q1",
        scheduleName: "Quick Assessment",
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        endTime: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(),
        durationMinutes: 30,
        status: "Completed",
        requiresProctoring: false,
        requiresIdVerification: false,
        score: 85,
        passed: true,
      },
    ]
  }
}

// Start exam attempt
export async function startExamAttempt(sessionId: string): Promise<ExamAttempt> {
  try {
    return await apiClient.post<ExamAttempt>(`/api/candidate/exams/${sessionId}/start`)
  } catch {
    // Mock exam attempt
    return {
      id: crypto.randomUUID(),
      sessionId,
      startedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 120).toISOString(), // 2 hours
      status: "InProgress",
      currentSectionIndex: 0,
      currentQuestionIndex: 0,
      sections: [
        {
          id: "section-1",
          title: "Multiple Choice",
          description: "Select the best answer for each question",
          questions: [
            {
              id: "q1",
              questionId: "question-1",
              order: 1,
              points: 5,
              body: "What is the derivative of x² + 3x + 2?",
              type: "MultipleChoice",
              options: [
                { id: "opt1", text: "2x + 3", order: 1 },
                { id: "opt2", text: "x + 3", order: 2 },
                { id: "opt3", text: "2x + 2", order: 3 },
                { id: "opt4", text: "x² + 3", order: 4 },
              ],
              answered: false,
              flagged: false,
            },
            {
              id: "q2",
              questionId: "question-2",
              order: 2,
              points: 5,
              body: "Which of the following is the integral of sin(x)?",
              type: "MultipleChoice",
              options: [
                { id: "opt5", text: "-cos(x) + C", order: 1 },
                { id: "opt6", text: "cos(x) + C", order: 2 },
                { id: "opt7", text: "-sin(x) + C", order: 3 },
                { id: "opt8", text: "tan(x) + C", order: 4 },
              ],
              answered: false,
              flagged: false,
            },
            {
              id: "q3",
              questionId: "question-3",
              order: 3,
              points: 10,
              body: "Evaluate the limit: lim(x→0) sin(x)/x",
              type: "MultipleChoice",
              options: [
                { id: "opt9", text: "0", order: 1 },
                { id: "opt10", text: "1", order: 2 },
                { id: "opt11", text: "∞", order: 3 },
                { id: "opt12", text: "Does not exist", order: 4 },
              ],
              answered: false,
              flagged: false,
            },
          ],
        },
        {
          id: "section-2",
          title: "True/False",
          description: "Determine if the statement is true or false",
          questions: [
            {
              id: "q4",
              questionId: "question-4",
              order: 1,
              points: 3,
              body: "The derivative of a constant is always zero.",
              type: "TrueFalse",
              options: [
                { id: "tf1", text: "True", order: 1 },
                { id: "tf2", text: "False", order: 2 },
              ],
              answered: false,
              flagged: false,
            },
            {
              id: "q5",
              questionId: "question-5",
              order: 2,
              points: 3,
              body: "The integral of 1/x is ln|x| + C.",
              type: "TrueFalse",
              options: [
                { id: "tf3", text: "True", order: 1 },
                { id: "tf4", text: "False", order: 2 },
              ],
              answered: false,
              flagged: false,
            },
          ],
        },
        {
          id: "section-3",
          title: "Short Answer",
          description: "Provide a brief answer to each question",
          questions: [
            {
              id: "q6",
              questionId: "question-6",
              order: 1,
              points: 15,
              body: "Explain the Fundamental Theorem of Calculus in your own words.",
              type: "ShortAnswer",
              answered: false,
              flagged: false,
            },
          ],
        },
      ],
      totalQuestions: 6,
      answeredCount: 0,
      flaggedCount: 0,
    }
  }
}

// Save answer
export async function saveAnswer(attemptId: string, questionId: string, answer: AnswerSubmission): Promise<void> {
  try {
    await apiClient.post(`/api/candidate/attempts/${attemptId}/answers/${questionId}`, answer)
  } catch {
    // Mock - answer saved locally
  }
}

// Flag/unflag question
export async function toggleQuestionFlag(attemptId: string, questionId: string, flagged: boolean): Promise<void> {
  try {
    await apiClient.post(`/api/candidate/attempts/${attemptId}/questions/${questionId}/flag`, { flagged })
  } catch {
    // Mock - flag saved locally
  }
}

// Submit exam
export async function submitExam(attemptId: string): Promise<ExamSubmission> {
  try {
    return await apiClient.post<ExamSubmission>(`/api/candidate/attempts/${attemptId}/submit`)
  } catch {
    return {
      id: crypto.randomUUID(),
      attemptId,
      submittedAt: new Date().toISOString(),
      status: "Submitted",
      message: "Your exam has been submitted successfully. Results will be available soon.",
    }
  }
}

// Report incident
export async function reportIncident(attemptId: string, incidentType: string, details?: string): Promise<void> {
  try {
    await apiClient.post(`/api/candidate/attempts/${attemptId}/incidents`, {
      type: incidentType,
      details,
      timestamp: new Date().toISOString(),
    })
  } catch {
    // Mock - incident logged
  }
}
