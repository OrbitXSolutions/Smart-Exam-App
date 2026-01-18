import { apiClient } from "@/lib/api-client"
import type {
  Exam,
  ExamSection,
  ExamTopic,
  ExamQuestion,
  ExamInstruction,
  ExamAccessPolicy,
  PagedResult,
} from "@/lib/types"
import { ExamType } from "@/lib/types"

// ============ MOCK DATA ============
const mockExams: Exam[] = [
  {
    id: 1,
    departmentId: 1,
    departmentNameEn: "IT Department",
    departmentNameAr: "قسم تقنية المعلومات",
    examType: ExamType.Fixed,
    titleEn: "IT Fundamentals Certification Exam",
    titleAr: "اختبار شهادة أساسيات تقنية المعلومات",
    descriptionEn: "Covers fundamental IT concepts including networking, databases, and programming.",
    descriptionAr: "يغطي المفاهيم الأساسية لتقنية المعلومات بما في ذلك الشبكات وقواعد البيانات والبرمجة.",
    startAt: "2024-02-01T09:00:00Z",
    endAt: "2024-02-01T12:00:00Z",
    durationMinutes: 120,
    maxAttempts: 2,
    shuffleQuestions: true,
    shuffleOptions: true,
    passScore: 70,
    isPublished: false,
    isActive: true,
    createdDate: new Date().toISOString(),
    updatedDate: null,
    sectionsCount: 2,
    questionsCount: 20,
    totalPoints: 40,
    sections: [],
    instructions: [],
    accessPolicy: null,
  },
  {
    id: 2,
    departmentId: 1,
    departmentNameEn: "IT Department",
    departmentNameAr: "قسم تقنية المعلومات",
    examType: ExamType.Flex,
    titleEn: "Programming Basics Quiz",
    titleAr: "اختبار أساسيات البرمجة",
    descriptionEn: "A quick quiz on programming fundamentals.",
    descriptionAr: "اختبار سريع على أساسيات البرمجة.",
    startAt: "2024-03-01T00:00:00Z",
    endAt: "2024-03-31T23:59:59Z",
    durationMinutes: 60,
    maxAttempts: 3,
    shuffleQuestions: true,
    shuffleOptions: true,
    passScore: 60,
    isPublished: true,
    isActive: true,
    createdDate: new Date().toISOString(),
    updatedDate: null,
    sectionsCount: 1,
    questionsCount: 10,
    totalPoints: 20,
    sections: [],
    instructions: [],
    accessPolicy: null,
  },
]

const mockSections: ExamSection[] = [
  {
    id: 1,
    examId: 1,
    titleEn: "Section 1: Networking Fundamentals",
    titleAr: "القسم الأول: أساسيات الشبكات",
    descriptionEn: "Tests knowledge of basic networking concepts.",
    descriptionAr: "يختبر معرفة مفاهيم الشبكات الأساسية.",
    order: 1,
    durationMinutes: 40,
    totalPointsOverride: null,
    createdDate: new Date().toISOString(),
    topicsCount: 2,
    questionsCount: 10,
    totalPoints: 20,
    topics: [],
    questions: [],
  },
]

// ============ EXAM CRUD ============
export async function getExams(params?: { pageNumber?: number; pageSize?: number }): Promise<PagedResult<Exam>> {
  const response = await apiClient.get<any>("/Assessment/exams", null)

  // Handle paginated response
  if (response && response.items) {
    return response as PagedResult<Exam>
  }

  // Handle array response
  if (Array.isArray(response)) {
    return {
      items: response,
      totalCount: response.length,
      pageNumber: params?.pageNumber || 1,
      pageSize: params?.pageSize || 10,
      totalPages: Math.ceil(response.length / (params?.pageSize || 10)),
    }
  }

  // Fallback to mock data
  return {
    items: mockExams,
    totalCount: mockExams.length,
    pageNumber: params?.pageNumber || 1,
    pageSize: params?.pageSize || 10,
    totalPages: Math.ceil(mockExams.length / (params?.pageSize || 10)),
  }
}

export async function getExam(id: string | number): Promise<Exam> {
  const response = await apiClient.get<any>(`/Assessment/exams/${id}`, null)

  if (response && response.id) {
    return response as Exam
  }

  // Fallback to mock
  const numId = typeof id === "string" ? Number.parseInt(id) : id
  return mockExams.find((e) => e.id === numId) || mockExams[0]
}

export interface CreateExamParams {
  departmentId: number
  examType: ExamType
  titleEn: string
  titleAr: string
  descriptionEn?: string
  descriptionAr?: string
  startAt: string
  endAt: string
  durationMinutes: number
  maxAttempts: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  passScore: number
  isActive: boolean
}

export async function createExam(data: CreateExamParams): Promise<Exam> {
  const response = await apiClient.post<any>("/Assessment/exams", data, null)

  if (response && response.id) {
    return response as Exam
  }

  // Fallback mock
  const newExam: Exam = {
    id: Date.now(),
    ...data,
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    isPublished: false,
    createdDate: new Date().toISOString(),
    updatedDate: null,
    sectionsCount: 0,
    questionsCount: 0,
    totalPoints: 0,
    sections: [],
    instructions: [],
    accessPolicy: null,
  }
  return newExam
}

export async function updateExam(id: string | number, data: Partial<CreateExamParams>): Promise<Exam> {
  const response = await apiClient.put<any>(`/Assessment/exams/${id}`, data, null)

  if (response && response.id) {
    return response as Exam
  }

  const numId = typeof id === "string" ? Number.parseInt(id) : id
  const existing = mockExams.find((e) => e.id === numId) || mockExams[0]
  return { ...existing, ...data, updatedDate: new Date().toISOString() }
}

export async function deleteExam(id: string | number): Promise<void> {
  await apiClient.delete<void>(`/Assessment/exams/${id}`, undefined)
}

export async function publishExam(id: string | number): Promise<boolean> {
  const response = await apiClient.post<any>(`/Assessment/exams/${id}/publish`, undefined, null)
  return response === true || (response && response.success)
}

export async function unpublishExam(id: string | number): Promise<boolean> {
  const response = await apiClient.post<any>(`/Assessment/exams/${id}/unpublish`, undefined, null)
  return response === true || (response && response.success)
}

export async function validateExam(
  id: string | number,
): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
  const response = await apiClient.get<any>(`/Assessment/exams/${id}/validate`, null)

  if (response) {
    return {
      isValid: response.isValid ?? true,
      errors: response.errors ?? [],
      warnings: response.warnings ?? [],
    }
  }

  return { isValid: true, errors: [], warnings: [] }
}

// ============ SECTIONS ============
export async function getExamSections(examId: string | number): Promise<ExamSection[]> {
  const response = await apiClient.get<any>(`/Assessment/exams/${examId}/sections`, null)

  if (Array.isArray(response)) {
    return response as ExamSection[]
  }

  if (response && response.items) {
    return response.items as ExamSection[]
  }

  return mockSections.filter((s) => s.examId === Number(examId))
}

export interface CreateSectionParams {
  titleEn: string
  titleAr: string
  descriptionEn?: string
  descriptionAr?: string
  order: number
  durationMinutes?: number
  totalPointsOverride?: number
}

export async function createExamSection(examId: string | number, data: CreateSectionParams): Promise<ExamSection> {
  const response = await apiClient.post<any>(`/Assessment/exams/${examId}/sections`, data, null)

  if (response && response.id) {
    return response as ExamSection
  }

  // Fallback mock
  return {
    id: Date.now(),
    examId: Number(examId),
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    order: data.order,
    durationMinutes: data.durationMinutes || null,
    totalPointsOverride: data.totalPointsOverride || null,
    createdDate: new Date().toISOString(),
    topicsCount: 0,
    questionsCount: 0,
    totalPoints: 0,
    topics: [],
    questions: [],
  }
}

export async function updateExamSection(
  sectionId: string | number,
  data: Partial<CreateSectionParams>,
): Promise<ExamSection> {
  const response = await apiClient.put<any>(`/Assessment/sections/${sectionId}`, data, null)

  if (response && response.id) {
    return response as ExamSection
  }

  const existing = mockSections.find((s) => s.id === Number(sectionId)) || mockSections[0]
  return { ...existing, ...data }
}

export async function deleteExamSection(sectionId: string | number): Promise<void> {
  await apiClient.delete<void>(`/Assessment/sections/${sectionId}`, undefined)
}

export async function reorderSections(examId: string | number, sectionIds: number[]): Promise<void> {
  await apiClient.post<void>(`/Assessment/exams/${examId}/sections/reorder`, { sectionIds }, undefined)
}

// ============ TOPICS ============
export async function getSectionTopics(sectionId: string | number): Promise<ExamTopic[]> {
  const response = await apiClient.get<any>(`/Assessment/sections/${sectionId}/topics`, null)

  if (Array.isArray(response)) {
    return response as ExamTopic[]
  }

  if (response && response.items) {
    return response.items as ExamTopic[]
  }

  return []
}

export interface CreateTopicParams {
  titleEn: string
  titleAr: string
  descriptionEn?: string
  descriptionAr?: string
  order: number
}

export async function createTopic(sectionId: string | number, data: CreateTopicParams): Promise<ExamTopic> {
  const response = await apiClient.post<any>(`/Assessment/sections/${sectionId}/topics`, data, null)

  if (response && response.id) {
    return response as ExamTopic
  }

  // Fallback mock
  return {
    id: Date.now(),
    examSectionId: Number(sectionId),
    titleEn: data.titleEn,
    titleAr: data.titleAr,
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    order: data.order,
    createdDate: new Date().toISOString(),
    questionsCount: 0,
    totalPoints: 0,
    questions: [],
  }
}

export async function updateTopic(topicId: string | number, data: Partial<CreateTopicParams>): Promise<ExamTopic> {
  const response = await apiClient.put<any>(`/Assessment/topics/${topicId}`, data, null)

  if (response && response.id) {
    return response as ExamTopic
  }

  return {
    id: Number(topicId),
    examSectionId: 1,
    titleEn: data.titleEn || "",
    titleAr: data.titleAr || "",
    descriptionEn: data.descriptionEn || null,
    descriptionAr: data.descriptionAr || null,
    order: data.order || 1,
    createdDate: new Date().toISOString(),
    questionsCount: 0,
    totalPoints: 0,
    questions: [],
  }
}

export async function deleteTopic(topicId: string | number): Promise<void> {
  await apiClient.delete<void>(`/Assessment/topics/${topicId}`, undefined)
}

export async function reorderTopics(sectionId: string | number, topicIds: number[]): Promise<void> {
  await apiClient.post<void>(`/Assessment/sections/${sectionId}/topics/reorder`, { topicIds }, undefined)
}

// ============ QUESTIONS ============
export async function getSectionQuestions(sectionId: string | number): Promise<ExamQuestion[]> {
  const response = await apiClient.get<any>(`/Assessment/sections/${sectionId}/questions`, null)

  if (Array.isArray(response)) {
    return response as ExamQuestion[]
  }

  if (response && response.items) {
    return response.items as ExamQuestion[]
  }

  return []
}

export async function getTopicQuestions(topicId: string | number): Promise<ExamQuestion[]> {
  const response = await apiClient.get<any>(`/Assessment/topics/${topicId}/questions`, null)

  if (Array.isArray(response)) {
    return response as ExamQuestion[]
  }

  if (response && response.items) {
    return response.items as ExamQuestion[]
  }

  return []
}

export interface AddQuestionParams {
  questionId: number
  order?: number
  pointsOverride?: number
  isRequired?: boolean
}

export async function addQuestionToSection(sectionId: string | number, data: AddQuestionParams): Promise<ExamQuestion> {
  const response = await apiClient.post<any>(`/Assessment/sections/${sectionId}/questions`, data, null)

  if (response && response.id) {
    return response as ExamQuestion
  }

  return {
    id: Date.now(),
    examId: 1,
    examSectionId: Number(sectionId),
    examTopicId: null,
    questionId: data.questionId,
    order: data.order || 1,
    points: data.pointsOverride || 1,
    isRequired: data.isRequired ?? true,
    createdDate: new Date().toISOString(),
    questionBody: "Question",
    questionTypeName: "MCQ_Single",
    difficultyLevelName: "Medium",
    originalPoints: 1,
  }
}

export async function addQuestionToTopic(topicId: string | number, data: AddQuestionParams): Promise<ExamQuestion> {
  const response = await apiClient.post<any>(`/Assessment/topics/${topicId}/questions`, data, null)

  if (response && response.id) {
    return response as ExamQuestion
  }

  return {
    id: Date.now(),
    examId: 1,
    examSectionId: 1,
    examTopicId: Number(topicId),
    questionId: data.questionId,
    order: data.order || 1,
    points: data.pointsOverride || 1,
    isRequired: data.isRequired ?? true,
    createdDate: new Date().toISOString(),
    questionBody: "Question",
    questionTypeName: "MCQ_Single",
    difficultyLevelName: "Medium",
    originalPoints: 1,
  }
}

export interface BulkAddQuestionsParams {
  questionIds: number[]
  useOriginalPoints?: boolean
  markAsRequired?: boolean
}

export async function bulkAddQuestionsToSection(
  sectionId: string | number,
  data: BulkAddQuestionsParams,
): Promise<ExamQuestion[]> {
  const response = await apiClient.post<any>(`/Assessment/sections/${sectionId}/questions/bulk`, data, null)

  if (Array.isArray(response)) {
    return response as ExamQuestion[]
  }

  if (response && response.items) {
    return response.items as ExamQuestion[]
  }

  return []
}

export async function bulkAddQuestionsToTopic(
  topicId: string | number,
  data: BulkAddQuestionsParams,
): Promise<ExamQuestion[]> {
  const response = await apiClient.post<any>(`/Assessment/topics/${topicId}/questions/bulk`, data, null)

  if (Array.isArray(response)) {
    return response as ExamQuestion[]
  }

  if (response && response.items) {
    return response.items as ExamQuestion[]
  }

  return []
}

export async function updateExamQuestion(
  examQuestionId: string | number,
  data: { order?: number; pointsOverride?: number; isRequired?: boolean },
): Promise<ExamQuestion> {
  const response = await apiClient.put<any>(`/Assessment/exam-questions/${examQuestionId}`, data, null)

  if (response && response.id) {
    return response as ExamQuestion
  }

  return {
    id: Number(examQuestionId),
    examId: 1,
    examSectionId: 1,
    examTopicId: null,
    questionId: 1,
    order: data.order || 1,
    points: data.pointsOverride || 1,
    isRequired: data.isRequired ?? true,
    createdDate: new Date().toISOString(),
    questionBody: "Question",
    questionTypeName: "MCQ_Single",
    difficultyLevelName: "Medium",
    originalPoints: 1,
  }
}

export async function removeExamQuestion(examQuestionId: string | number): Promise<void> {
  await apiClient.delete<void>(`/Assessment/exam-questions/${examQuestionId}`, undefined)
}

export async function reorderSectionQuestions(sectionId: string | number, questionIds: number[]): Promise<void> {
  await apiClient.post<void>(`/Assessment/sections/${sectionId}/questions/reorder`, { questionIds }, undefined)
}

// ============ INSTRUCTIONS ============
export async function getExamInstructions(examId: string | number): Promise<ExamInstruction[]> {
  const response = await apiClient.get<any>(`/Assessment/exams/${examId}/instructions`, null)

  if (Array.isArray(response)) {
    return response as ExamInstruction[]
  }

  return []
}

export interface CreateInstructionParams {
  contentEn: string
  contentAr: string
  order: number
}

export async function createInstruction(
  examId: string | number,
  data: CreateInstructionParams,
): Promise<ExamInstruction> {
  const response = await apiClient.post<any>(`/Assessment/exams/${examId}/instructions`, data, null)

  if (response && response.id) {
    return response as ExamInstruction
  }

  return {
    id: Date.now(),
    examId: Number(examId),
    contentEn: data.contentEn,
    contentAr: data.contentAr,
    order: data.order,
    createdDate: new Date().toISOString(),
  }
}

export async function updateInstruction(
  instructionId: string | number,
  data: Partial<CreateInstructionParams>,
): Promise<ExamInstruction> {
  const response = await apiClient.put<any>(`/Assessment/instructions/${instructionId}`, data, null)

  if (response && response.id) {
    return response as ExamInstruction
  }

  return {
    id: Number(instructionId),
    examId: 1,
    contentEn: data.contentEn || "",
    contentAr: data.contentAr || "",
    order: data.order || 1,
    createdDate: new Date().toISOString(),
  }
}

export async function deleteInstruction(instructionId: string | number): Promise<void> {
  await apiClient.delete<void>(`/Assessment/instructions/${instructionId}`, undefined)
}

// ============ ACCESS POLICY ============
export async function getAccessPolicy(examId: string | number): Promise<ExamAccessPolicy | null> {
  const response = await apiClient.get<any>(`/Assessment/exams/${examId}/access-policy`, null)

  if (response && response.id) {
    return response as ExamAccessPolicy
  }

  return null
}

export interface SaveAccessPolicyParams {
  isPublic: boolean
  accessCode?: string
  restrictToAssignedCandidates?: boolean
}

export async function saveAccessPolicy(
  examId: string | number,
  data: SaveAccessPolicyParams,
): Promise<ExamAccessPolicy> {
  const response = await apiClient.put<any>(`/Assessment/exams/${examId}/access-policy`, data, null)

  if (response && response.id) {
    return response as ExamAccessPolicy
  }

  return {
    id: Date.now(),
    examId: Number(examId),
    isPublic: data.isPublic,
    accessCode: data.accessCode || null,
    restrictToAssignedCandidates: data.restrictToAssignedCandidates ?? false,
    createdDate: new Date().toISOString(),
    updatedDate: null,
  }
}

// ============ EXAM SCHEDULES (MOCK) ============
export interface ExamSchedule {
  id: number
  examId: number
  name: string
  startTime: string
  endTime: string
  candidateCount: number
  status: string
}

export async function getExamSchedules(examId: string | number): Promise<ExamSchedule[]> {
  // Schedules API not yet implemented - return empty array
  return []
}

export interface CreateExamScheduleParams {
  name: string
  startTime: string
  endTime: string
  candidateIds?: number[]
}

export async function createExamSchedule(
  examId: string | number,
  data: CreateExamScheduleParams
): Promise<ExamSchedule> {
  // Schedules API not yet implemented - return mock
  return {
    id: Date.now(),
    examId: Number(examId),
    name: data.name,
    startTime: data.startTime,
    endTime: data.endTime,
    candidateCount: data.candidateIds?.length || 0,
    status: "Scheduled",
  }
}

// ============ ARCHIVE EXAM ============
export async function archiveExam(id: string | number): Promise<boolean> {
  // Archive = toggle status to inactive
  const response = await apiClient.post<any>(`/Assessment/exams/${id}/toggle-status`, undefined, null)
  return response === true || (response && response.success)
}

// ============ REMOVE QUESTION FROM SECTION ============
export async function removeQuestionFromSection(
  examId: string | number,
  sectionId: string | number,
  examQuestionId: string | number
): Promise<void> {
  await apiClient.delete<void>(`/Assessment/exam-questions/${examQuestionId}`, undefined)
}
