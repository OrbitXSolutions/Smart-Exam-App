import { apiClient } from "@/lib/api-client"
import type { Exam, ExamSection, ExamQuestion, ExamSchedule, ExamCandidate, PagedResult } from "@/lib/types"
import type {
  CreateExamParams,
  UpdateExamParams,
  CreateExamSectionParams,
  UpdateExamSectionParams,
  AddQuestionToSectionParams,
  CreateExamScheduleParams,
  UpdateExamScheduleParams,
  AssignCandidatesParams,
  PaginationParams,
} from "@/lib/types/api-params"
import { mockExams, mockSections, mockSchedules } from "@/lib/mock-data"

// Exam CRUD
export async function getExams(params?: PaginationParams): Promise<PagedResult<Exam>> {
  try {
    return await apiClient.get<PagedResult<Exam>>("/api/exams", params)
  } catch {
    return {
      items: mockExams,
      totalCount: mockExams.length,
      pageNumber: 1,
      pageSize: 10,
      totalPages: 1,
    }
  }
}

export async function getExam(id: string): Promise<Exam> {
  try {
    return await apiClient.get<Exam>(`/api/exams/${id}`)
  } catch {
    const exam = mockExams.find((e) => e.id === id)
    if (!exam) throw new Error("Exam not found")
    return exam
  }
}

export async function createExam(data: CreateExamParams): Promise<Exam> {
  try {
    return await apiClient.post<Exam>("/api/exams", data)
  } catch {
    const newExam: Exam = {
      id: crypto.randomUUID(),
      ...data,
      status: "Draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "current-user",
      sections: [],
    }
    mockExams.push(newExam)
    return newExam
  }
}

export async function updateExam(id: string, data: UpdateExamParams): Promise<Exam> {
  try {
    return await apiClient.put<Exam>(`/api/exams/${id}`, data)
  } catch {
    const index = mockExams.findIndex((e) => e.id === id)
    if (index === -1) throw new Error("Exam not found")
    mockExams[index] = { ...mockExams[index], ...data, updatedAt: new Date().toISOString() }
    return mockExams[index]
  }
}

export async function deleteExam(id: string): Promise<void> {
  try {
    await apiClient.delete(`/api/exams/${id}`)
  } catch {
    const index = mockExams.findIndex((e) => e.id === id)
    if (index !== -1) mockExams.splice(index, 1)
  }
}

export async function publishExam(id: string): Promise<Exam> {
  try {
    return await apiClient.post<Exam>(`/api/exams/${id}/publish`)
  } catch {
    const exam = mockExams.find((e) => e.id === id)
    if (!exam) throw new Error("Exam not found")
    exam.status = "Published"
    return exam
  }
}

export async function archiveExam(id: string): Promise<Exam> {
  try {
    return await apiClient.post<Exam>(`/api/exams/${id}/archive`)
  } catch {
    const exam = mockExams.find((e) => e.id === id)
    if (!exam) throw new Error("Exam not found")
    exam.status = "Archived"
    return exam
  }
}

// Exam Sections
export async function getExamSections(examId: string): Promise<ExamSection[]> {
  try {
    return await apiClient.get<ExamSection[]>(`/api/exams/${examId}/sections`)
  } catch {
    return mockSections.filter((s) => s.examId === examId)
  }
}

export async function createExamSection(examId: string, data: CreateExamSectionParams): Promise<ExamSection> {
  try {
    return await apiClient.post<ExamSection>(`/api/exams/${examId}/sections`, data)
  } catch {
    const newSection: ExamSection = {
      id: crypto.randomUUID(),
      examId,
      ...data,
      order: mockSections.filter((s) => s.examId === examId).length + 1,
      questions: [],
    }
    mockSections.push(newSection)
    return newSection
  }
}

export async function updateExamSection(
  examId: string,
  sectionId: string,
  data: UpdateExamSectionParams,
): Promise<ExamSection> {
  try {
    return await apiClient.put<ExamSection>(`/api/exams/${examId}/sections/${sectionId}`, data)
  } catch {
    const index = mockSections.findIndex((s) => s.id === sectionId)
    if (index === -1) throw new Error("Section not found")
    mockSections[index] = { ...mockSections[index], ...data }
    return mockSections[index]
  }
}

export async function deleteExamSection(examId: string, sectionId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/exams/${examId}/sections/${sectionId}`)
  } catch {
    const index = mockSections.findIndex((s) => s.id === sectionId)
    if (index !== -1) mockSections.splice(index, 1)
  }
}

export async function addQuestionToSection(
  examId: string,
  sectionId: string,
  data: AddQuestionToSectionParams,
): Promise<ExamQuestion> {
  try {
    return await apiClient.post<ExamQuestion>(`/api/exams/${examId}/sections/${sectionId}/questions`, data)
  } catch {
    const newQuestion: ExamQuestion = {
      id: crypto.randomUUID(),
      sectionId,
      questionId: data.questionId,
      order: data.order || 1,
      points: data.points,
    }
    return newQuestion
  }
}

export async function removeQuestionFromSection(examId: string, sectionId: string, questionId: string): Promise<void> {
  await apiClient.delete(`/api/exams/${examId}/sections/${sectionId}/questions/${questionId}`)
}

export async function reorderSectionQuestions(examId: string, sectionId: string, questionIds: string[]): Promise<void> {
  await apiClient.put(`/api/exams/${examId}/sections/${sectionId}/questions/reorder`, {
    questionIds,
  })
}

// Exam Schedules
export async function getExamSchedules(examId: string): Promise<ExamSchedule[]> {
  try {
    return await apiClient.get<ExamSchedule[]>(`/api/exams/${examId}/schedules`)
  } catch {
    return mockSchedules.filter((s) => s.examId === examId)
  }
}

export async function createExamSchedule(examId: string, data: CreateExamScheduleParams): Promise<ExamSchedule> {
  try {
    return await apiClient.post<ExamSchedule>(`/api/exams/${examId}/schedules`, data)
  } catch {
    const newSchedule: ExamSchedule = {
      id: crypto.randomUUID(),
      examId,
      ...data,
      status: "Scheduled",
      candidateCount: 0,
    }
    mockSchedules.push(newSchedule)
    return newSchedule
  }
}

export async function updateExamSchedule(
  examId: string,
  scheduleId: string,
  data: UpdateExamScheduleParams,
): Promise<ExamSchedule> {
  try {
    return await apiClient.put<ExamSchedule>(`/api/exams/${examId}/schedules/${scheduleId}`, data)
  } catch {
    const index = mockSchedules.findIndex((s) => s.id === scheduleId)
    if (index === -1) throw new Error("Schedule not found")
    mockSchedules[index] = { ...mockSchedules[index], ...data }
    return mockSchedules[index]
  }
}

export async function deleteExamSchedule(examId: string, scheduleId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/exams/${examId}/schedules/${scheduleId}`)
  } catch {
    const index = mockSchedules.findIndex((s) => s.id === scheduleId)
    if (index !== -1) mockSchedules.splice(index, 1)
  }
}

// Candidate Assignment
export async function getScheduleCandidates(examId: string, scheduleId: string): Promise<ExamCandidate[]> {
  try {
    return await apiClient.get<ExamCandidate[]>(`/api/exams/${examId}/schedules/${scheduleId}/candidates`)
  } catch {
    return []
  }
}

export async function assignCandidates(
  examId: string,
  scheduleId: string,
  data: AssignCandidatesParams,
): Promise<void> {
  await apiClient.post(`/api/exams/${examId}/schedules/${scheduleId}/candidates`, data)
}

export async function removeCandidateFromSchedule(
  examId: string,
  scheduleId: string,
  candidateId: string,
): Promise<void> {
  await apiClient.delete(`/api/exams/${examId}/schedules/${scheduleId}/candidates/${candidateId}`)
}

export async function sendInvitations(examId: string, scheduleId: string): Promise<void> {
  await apiClient.post(`/api/exams/${examId}/schedules/${scheduleId}/send-invitations`)
}
