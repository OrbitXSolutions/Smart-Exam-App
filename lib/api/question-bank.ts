// Question Bank API functions
import { apiClient, type ApiResponse, type PaginatedResponse } from "@/lib/api-client"
import type { Question, QuestionCategory, QuestionType, QuestionOption, QuestionAttachment } from "@/lib/types"
import type { GetQuestionsParams, CreateQuestionRequest, UpdateQuestionRequest } from "@/lib/types/api-params"
import { mockQuestions, mockQuestionCategories, mockQuestionTypes } from "@/lib/mock-data"

// Build query string from params
function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value))
    }
  })
  const queryString = searchParams.toString()
  return queryString ? `?${queryString}` : ""
}

// Questions
export async function getQuestions(params: GetQuestionsParams = {}): Promise<ApiResponse<PaginatedResponse<Question>>> {
  const queryString = buildQueryString(params)
  return apiClient.get<PaginatedResponse<Question>>(`/api/QuestionBank/questions${queryString}`, {
    items: mockQuestions,
    pageNumber: params.pageNumber || 1,
    pageSize: params.pageSize || 10,
    totalCount: mockQuestions.length,
    totalPages: Math.ceil(mockQuestions.length / (params.pageSize || 10)),
    hasPreviousPage: (params.pageNumber || 1) > 1,
    hasNextPage: (params.pageNumber || 1) < Math.ceil(mockQuestions.length / (params.pageSize || 10)),
  })
}

export async function getQuestionById(id: number): Promise<ApiResponse<Question>> {
  const mockQuestion = mockQuestions.find((q) => q.id === id) || mockQuestions[0]
  return apiClient.get<Question>(`/api/QuestionBank/questions/${id}`, mockQuestion)
}

export async function createQuestion(data: CreateQuestionRequest): Promise<ApiResponse<Question>> {
  return apiClient.post<Question>("/api/QuestionBank/questions", data, {
    id: Date.now(),
    ...data,
    questionTypeName: mockQuestionTypes.find((t) => t.id === data.questionTypeId)?.nameEn || "Multiple Choice",
    questionCategoryName: mockQuestionCategories.find((c) => c.id === data.questionCategoryId)?.nameEn || "General",
    difficultyLevelName: ["Easy", "Medium", "Hard"][data.difficultyLevel],
    createdDate: new Date().toISOString(),
    updatedDate: null,
    isDeleted: false,
    attachments: [],
    options: data.options.map((opt, idx) => ({
      ...opt,
      id: Date.now() + idx,
      questionId: Date.now(),
      createdDate: new Date().toISOString(),
    })),
  })
}

export async function updateQuestion(id: number, data: UpdateQuestionRequest): Promise<ApiResponse<Question>> {
  const existing = mockQuestions.find((q) => q.id === id) || mockQuestions[0]
  return apiClient.put<Question>(`/api/QuestionBank/questions/${id}`, data, {
    ...existing,
    ...data,
    questionTypeName: mockQuestionTypes.find((t) => t.id === data.questionTypeId)?.nameEn || existing.questionTypeName,
    questionCategoryName:
      mockQuestionCategories.find((c) => c.id === data.questionCategoryId)?.nameEn || existing.questionCategoryName,
    difficultyLevelName: ["Easy", "Medium", "Hard"][data.difficultyLevel],
    updatedDate: new Date().toISOString(),
  })
}

export async function deleteQuestion(id: number): Promise<ApiResponse<boolean>> {
  return apiClient.delete<boolean>(`/api/QuestionBank/questions/${id}`, true)
}

export async function toggleQuestionStatus(id: number): Promise<ApiResponse<boolean>> {
  return apiClient.patch<boolean>(`/api/QuestionBank/questions/${id}/toggle-status`, undefined, true)
}

// Question Options
export async function getQuestionOptions(questionId: number): Promise<ApiResponse<QuestionOption[]>> {
  const question = mockQuestions.find((q) => q.id === questionId)
  return apiClient.get<QuestionOption[]>(`/api/QuestionBank/questions/${questionId}/options`, question?.options || [])
}

export async function addQuestionOption(
  questionId: number,
  data: Omit<QuestionOption, "id" | "questionId" | "createdDate">,
): Promise<ApiResponse<QuestionOption>> {
  return apiClient.post<QuestionOption>(`/api/QuestionBank/questions/${questionId}/options`, data, {
    id: Date.now(),
    questionId,
    createdDate: new Date().toISOString(),
    ...data,
  })
}

export async function updateQuestionOption(
  optionId: number,
  data: Partial<QuestionOption>,
): Promise<ApiResponse<QuestionOption>> {
  return apiClient.put<QuestionOption>(`/api/QuestionBank/options/${optionId}`, data, {
    id: optionId,
    questionId: 1,
    text: "",
    isCorrect: false,
    order: 0,
    attachmentPath: null,
    createdDate: new Date().toISOString(),
    ...data,
  })
}

export async function deleteQuestionOption(optionId: number): Promise<ApiResponse<boolean>> {
  return apiClient.delete<boolean>(`/api/QuestionBank/options/${optionId}`, true)
}

// Question Attachments
export async function getQuestionAttachments(questionId: number): Promise<ApiResponse<QuestionAttachment[]>> {
  const question = mockQuestions.find((q) => q.id === questionId)
  return apiClient.get<QuestionAttachment[]>(
    `/api/QuestionBank/questions/${questionId}/attachments`,
    question?.attachments || [],
  )
}

export async function addQuestionAttachment(
  questionId: number,
  data: Omit<QuestionAttachment, "id" | "questionId" | "createdDate">,
): Promise<ApiResponse<QuestionAttachment>> {
  return apiClient.post<QuestionAttachment>(`/api/QuestionBank/questions/${questionId}/attachments`, data, {
    id: Date.now(),
    questionId,
    createdDate: new Date().toISOString(),
    ...data,
  })
}

export async function deleteQuestionAttachment(attachmentId: number): Promise<ApiResponse<boolean>> {
  return apiClient.delete<boolean>(`/api/QuestionBank/attachments/${attachmentId}`, true)
}

// Categories
export async function getQuestionCategories(
  params: { search?: string; pageNumber?: number; pageSize?: number } = {},
): Promise<ApiResponse<PaginatedResponse<QuestionCategory>>> {
  const queryString = buildQueryString(params)
  return apiClient.get<PaginatedResponse<QuestionCategory>>(`/api/Lookups/question-categories${queryString}`, {
    items: mockQuestionCategories,
    pageNumber: params.pageNumber || 1,
    pageSize: params.pageSize || 100,
    totalCount: mockQuestionCategories.length,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  })
}

export async function createQuestionCategory(data: {
  nameEn: string
  nameAr: string
}): Promise<ApiResponse<QuestionCategory>> {
  return apiClient.post<QuestionCategory>("/api/Lookups/question-categories", data, {
    id: Date.now(),
    ...data,
    createdDate: new Date().toISOString(),
    updatedDate: null,
    isDeleted: false,
  })
}

export async function updateQuestionCategory(
  id: number,
  data: { nameEn: string; nameAr: string },
): Promise<ApiResponse<QuestionCategory>> {
  return apiClient.put<QuestionCategory>(`/api/Lookups/question-categories/${id}`, data, {
    id,
    ...data,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
    isDeleted: false,
  })
}

export async function deleteQuestionCategory(id: number): Promise<ApiResponse<boolean>> {
  return apiClient.delete<boolean>(`/api/Lookups/question-categories/${id}`, true)
}

// Types
export async function getQuestionTypes(
  params: { search?: string; pageNumber?: number; pageSize?: number } = {},
): Promise<ApiResponse<PaginatedResponse<QuestionType>>> {
  const queryString = buildQueryString(params)
  return apiClient.get<PaginatedResponse<QuestionType>>(`/api/Lookups/question-types${queryString}`, {
    items: mockQuestionTypes,
    pageNumber: params.pageNumber || 1,
    pageSize: params.pageSize || 100,
    totalCount: mockQuestionTypes.length,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  })
}
