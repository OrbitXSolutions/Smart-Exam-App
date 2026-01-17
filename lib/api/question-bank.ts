// Question Bank API functions
import { apiClient, type ApiResponse, type PaginatedResponse } from "@/lib/api-client"
import type { Question, QuestionOption, QuestionAttachment } from "@/lib/types"
import type { GetQuestionsParams, CreateQuestionRequest, UpdateQuestionRequest } from "@/lib/types/api-params"
import { mockQuestions } from "@/lib/mock-data"

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
  return apiClient.get<PaginatedResponse<Question>>(`/QuestionBank/questions${queryString}`, {
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
  return apiClient.get<Question>(`/QuestionBank/questions/${id}`, mockQuestion)
}

export async function createQuestion(data: CreateQuestionRequest): Promise<ApiResponse<Question>> {
  return apiClient.post<Question>("/QuestionBank/questions", data, {
    id: Date.now(),
    ...data,
    questionTypeName: "Multiple Choice",
    questionCategoryName: "General",
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
  return apiClient.put<Question>(`/QuestionBank/questions/${id}`, data, {
    ...existing,
    ...data,
    difficultyLevelName: ["Easy", "Medium", "Hard"][data.difficultyLevel],
    updatedDate: new Date().toISOString(),
  })
}

export async function deleteQuestion(id: number): Promise<ApiResponse<boolean>> {
  return apiClient.delete<boolean>(`/QuestionBank/questions/${id}`, true)
}

export async function toggleQuestionStatus(id: number): Promise<ApiResponse<boolean>> {
  return apiClient.patch<boolean>(`/QuestionBank/questions/${id}/toggle-status`, undefined, true)
}

// Question Options
export async function getQuestionOptions(questionId: number): Promise<ApiResponse<QuestionOption[]>> {
  const question = mockQuestions.find((q) => q.id === questionId)
  return apiClient.get<QuestionOption[]>(`/QuestionBank/questions/${questionId}/options`, question?.options || [])
}

export async function addQuestionOption(
  questionId: number,
  data: Omit<QuestionOption, "id" | "questionId" | "createdDate">,
): Promise<ApiResponse<QuestionOption>> {
  return apiClient.post<QuestionOption>(`/QuestionBank/questions/${questionId}/options`, data, {
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
  return apiClient.put<QuestionOption>(`/QuestionBank/options/${optionId}`, data, {
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
  return apiClient.delete<boolean>(`/QuestionBank/options/${optionId}`, true)
}

// Question Attachments
export async function getQuestionAttachments(questionId: number): Promise<ApiResponse<QuestionAttachment[]>> {
  const question = mockQuestions.find((q) => q.id === questionId)
  return apiClient.get<QuestionAttachment[]>(
    `/QuestionBank/questions/${questionId}/attachments`,
    question?.attachments || [],
  )
}

export async function addQuestionAttachment(
  questionId: number,
  data: Omit<QuestionAttachment, "id" | "questionId" | "createdDate">,
): Promise<ApiResponse<QuestionAttachment>> {
  return apiClient.post<QuestionAttachment>(`/QuestionBank/questions/${questionId}/attachments`, data, {
    id: Date.now(),
    questionId,
    createdDate: new Date().toISOString(),
    ...data,
  })
}

export async function deleteQuestionAttachment(attachmentId: number): Promise<ApiResponse<boolean>> {
  return apiClient.delete<boolean>(`/QuestionBank/attachments/${attachmentId}`, true)
}
