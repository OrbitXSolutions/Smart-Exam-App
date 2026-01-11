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
  return apiClient.get<PagedResult<Exam>>("/api/exams", {
    items: mockExams,
    totalCount: mockExams.length,
    pageNumber: params?.pageNumber || 1,
    pageSize: params?.pageSize || 10,
    totalPages: Math.ceil(mockExams.length / (params?.pageSize || 10)),
  })
}

export async function getExam(id: string): Promise<Exam> {
  const numId = Number.parseInt(id)
  const mockExam = mockExams.find((e) => e.id === numId) || mockExams[0]
  return apiClient.get<Exam>(`/api/exams/${id}`, mockExam)
}

export async function createExam(data: CreateExamParams): Promise<Exam> {
  const newExam: Exam = {
    id: Date.now(),
    ...data,
    titleEn: data.titleEn || "",
    titleAr: data.titleAr || "",
    isPublished: false,
    isActive: true,
    createdDate: new Date().toISOString(),
    updatedDate: null,
    sectionsCount: 0,
    questionsCount: 0,
    totalPoints: 0,
    sections: [],
    instructions: [],
  }
  return apiClient.post<Exam>("/api/exams", data, newExam)
}

export async function updateExam(id: string, data: UpdateExamParams): Promise<Exam> {
  const numId = Number.parseInt(id)
  const existing = mockExams.find((e) => e.id === numId) || mockExams[0]
  return apiClient.put<Exam>(`/api/exams/${id}`, data, {
    ...existing,
    ...data,
    updatedDate: new Date().toISOString(),
  })
}

export async function deleteExam(id: string): Promise<void> {
  return apiClient.delete<void>(`/api/exams/${id}`, undefined)
}

export async function publishExam(id: string): Promise<Exam> {
  const numId = Number.parseInt(id)
  const exam = mockExams.find((e) => e.id === numId) || mockExams[0]
  return apiClient.post<Exam>(`/api/exams/${id}/publish`, undefined, {
    ...exam,
    isPublished: true,
  })
}

export async function archiveExam(id: string): Promise<Exam> {
  const numId = Number.parseInt(id)
  const exam = mockExams.find((e) => e.id === numId) || mockExams[0]
  return apiClient.post<Exam>(`/api/exams/${id}/archive`, undefined, {
    ...exam,
    isActive: false,
  })
}

// Exam Sections
export async function getExamSections(examId: string): Promise<ExamSection[]> {
  const numId = Number.parseInt(examId)
  return apiClient.get<ExamSection[]>(
    `/api/exams/${examId}/sections`,
    mockSections.filter((s) => s.examId === numId),
  )
}

export async function createExamSection(examId: string, data: CreateExamSectionParams): Promise<ExamSection> {
  const numExamId = Number.parseInt(examId)
  const newSection: ExamSection = {
    id: Date.now(),
    examId: numExamId,
    titleEn: data.titleEn || "",
    titleAr: data.titleAr || "",
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    order: mockSections.filter((s) => s.examId === numExamId).length,
    durationMinutes: data.durationMinutes || null,
    totalPointsOverride: null,
    createdDate: new Date().toISOString(),
    questionsCount: 0,
    totalPoints: 0,
    questions: [],
  }
  return apiClient.post<ExamSection>(`/api/exams/${examId}/sections`, data, newSection)
}

export async function updateExamSection(
  examId: string,
  sectionId: string,
  data: UpdateExamSectionParams,
): Promise<ExamSection> {
  const numSectionId = Number.parseInt(sectionId)
  const existing = mockSections.find((s) => s.id === numSectionId) || mockSections[0]
  return apiClient.put<ExamSection>(`/api/exams/${examId}/sections/${sectionId}`, data, {
    ...existing,
    ...data,
  })
}

export async function deleteExamSection(examId: string, sectionId: string): Promise<void> {
  return apiClient.delete<void>(`/api/exams/${examId}/sections/${sectionId}`, undefined)
}

export async function addQuestionToSection(
  examId: string,
  sectionId: string,
  data: AddQuestionToSectionParams,
): Promise<ExamQuestion> {
  const newQuestion: ExamQuestion = {
    id: Date.now(),
    sectionId: Number.parseInt(sectionId),
    questionId: data.questionId,
    order: data.order || 0,
    points: data.points,
  }
  return apiClient.post<ExamQuestion>(`/api/exams/${examId}/sections/${sectionId}/questions`, data, newQuestion)
}

export async function removeQuestionFromSection(examId: string, sectionId: string, questionId: string): Promise<void> {
  return apiClient.delete<void>(`/api/exams/${examId}/sections/${sectionId}/questions/${questionId}`, undefined)
}

export async function reorderSectionQuestions(examId: string, sectionId: string, questionIds: string[]): Promise<void> {
  return apiClient.put<void>(`/api/exams/${examId}/sections/${sectionId}/questions/reorder`, { questionIds }, undefined)
}

// Exam Schedules
export async function getExamSchedules(examId: string): Promise<ExamSchedule[]> {
  const numId = Number.parseInt(examId)
  return apiClient.get<ExamSchedule[]>(
    `/api/exams/${examId}/schedules`,
    mockSchedules.filter((s) => s.examId === numId),
  )
}

export async function createExamSchedule(examId: string, data: CreateExamScheduleParams): Promise<ExamSchedule> {
  const newSchedule: ExamSchedule = {
    id: Date.now(),
    examId: Number.parseInt(examId),
    startAt: data.startAt,
    endAt: data.endAt,
    location: data.location || null,
    capacity: data.capacity || null,
    registeredCount: 0,
    isActive: true,
  }
  return apiClient.post<ExamSchedule>(`/api/exams/${examId}/schedules`, data, newSchedule)
}

export async function updateExamSchedule(
  examId: string,
  scheduleId: string,
  data: UpdateExamScheduleParams,
): Promise<ExamSchedule> {
  const numScheduleId = Number.parseInt(scheduleId)
  const existing = mockSchedules.find((s) => s.id === numScheduleId) || mockSchedules[0]
  return apiClient.put<ExamSchedule>(`/api/exams/${examId}/schedules/${scheduleId}`, data, {
    ...existing,
    ...data,
  })
}

export async function deleteExamSchedule(examId: string, scheduleId: string): Promise<void> {
  return apiClient.delete<void>(`/api/exams/${examId}/schedules/${scheduleId}`, undefined)
}

// Candidate Assignment
export async function getScheduleCandidates(examId: string, scheduleId: string): Promise<ExamCandidate[]> {
  return apiClient.get<ExamCandidate[]>(`/api/exams/${examId}/schedules/${scheduleId}/candidates`, [])
}

export async function assignCandidates(
  examId: string,
  scheduleId: string,
  data: AssignCandidatesParams,
): Promise<void> {
  return apiClient.post<void>(`/api/exams/${examId}/schedules/${scheduleId}/candidates`, data, undefined)
}

export async function removeCandidateFromSchedule(
  examId: string,
  scheduleId: string,
  candidateId: string,
): Promise<void> {
  return apiClient.delete<void>(`/api/exams/${examId}/schedules/${scheduleId}/candidates/${candidateId}`, undefined)
}

export async function sendInvitations(examId: string, scheduleId: string): Promise<void> {
  return apiClient.post<void>(`/api/exams/${examId}/schedules/${scheduleId}/send-invitations`, undefined, undefined)
}
