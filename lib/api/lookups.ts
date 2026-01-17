import { apiClient } from "@/lib/api-client"

// Types
export interface QuestionCategory {
  id: number
  nameEn: string
  nameAr: string
  createdDate?: string
  updatedDate?: string | null
  isDeleted?: boolean
}

export interface QuestionType {
  id: number
  nameEn: string
  nameAr: string
  createdDate?: string
  updatedDate?: string | null
  isDeleted?: boolean
}

export interface PaginatedResponse<T> {
  items: T[]
  pageNumber: number
  pageSize: number
  totalCount: number
  totalPages: number
  hasPreviousPage?: boolean
  hasNextPage?: boolean
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data: T
  errors: string[]
}

// Mock Data for fallback
const MOCK_CATEGORIES: QuestionCategory[] = [
  { id: 1, nameEn: "Mathematics", nameAr: "الرياضيات", createdDate: "2024-01-01T00:00:00Z" },
  { id: 2, nameEn: "Science", nameAr: "العلوم", createdDate: "2024-01-01T00:00:00Z" },
  { id: 3, nameEn: "Geography", nameAr: "الجغرافيا", createdDate: "2024-01-01T00:00:00Z" },
  { id: 4, nameEn: "History", nameAr: "التاريخ", createdDate: "2024-01-01T00:00:00Z" },
  { id: 5, nameEn: "Computer Science", nameAr: "علوم الحاسوب", createdDate: "2024-01-01T00:00:00Z" },
  { id: 6, nameEn: "English", nameAr: "اللغة الإنجليزية", createdDate: "2024-01-01T00:00:00Z" },
]

const MOCK_TYPES: QuestionType[] = [
  { id: 1, nameEn: "MCQ Single", nameAr: "اختيار من متعدد (إجابة واحدة)", createdDate: "2024-01-01T00:00:00Z" },
  { id: 2, nameEn: "MCQ Multi", nameAr: "اختيار من متعدد (إجابات متعددة)", createdDate: "2024-01-01T00:00:00Z" },
  { id: 3, nameEn: "True/False", nameAr: "صح/خطأ", createdDate: "2024-01-01T00:00:00Z" },
  { id: 4, nameEn: "Short Answer", nameAr: "إجابة قصيرة", createdDate: "2024-01-01T00:00:00Z" },
  { id: 5, nameEn: "Essay", nameAr: "مقالي", createdDate: "2024-01-01T00:00:00Z" },
  { id: 6, nameEn: "Numeric", nameAr: "رقمي", createdDate: "2024-01-01T00:00:00Z" },
]

// Question Categories API
export async function getQuestionCategories(params?: {
  search?: string
  includeDeleted?: boolean
  pageNumber?: number
  pageSize?: number
}): Promise<PaginatedResponse<QuestionCategory>> {
  const queryParams = new URLSearchParams()
  if (params?.search) queryParams.append("search", params.search)
  if (params?.includeDeleted) queryParams.append("includeDeleted", "true")
  queryParams.append("pageNumber", String(params?.pageNumber || 1))
  queryParams.append("pageSize", String(params?.pageSize || 100))

  const mockResponse: PaginatedResponse<QuestionCategory> = {
    items: MOCK_CATEGORIES,
    pageNumber: 1,
    pageSize: 100,
    totalCount: MOCK_CATEGORIES.length,
    totalPages: 1,
  }

  try {
    const result = await apiClient.get<PaginatedResponse<QuestionCategory>>(
      `/Lookups/question-categories?${queryParams.toString()}`,
      mockResponse,
    )

    if (result && typeof result === "object" && "items" in result) {
      return result
    }

    return mockResponse
  } catch (error) {
    console.error("getQuestionCategories error:", error)
    return mockResponse
  }
}

export async function getQuestionCategoryById(id: number): Promise<QuestionCategory | null> {
  const mockCategory = MOCK_CATEGORIES.find((c) => c.id === id) || null

  const result = await apiClient.get<ApiResponse<QuestionCategory>>(`/Lookups/question-categories/${id}`, mockCategory)

  if (result && typeof result === "object" && "nameEn" in result) {
    return result as QuestionCategory
  }
  if (result && typeof result === "object" && "data" in result && result.data) {
    return result.data
  }
  return mockCategory
}

export async function createQuestionCategory(data: {
  nameEn: string
  nameAr: string
}): Promise<ApiResponse<QuestionCategory>> {
  const result = await apiClient.post<ApiResponse<QuestionCategory>>("/Lookups/question-categories", data, {
    success: true,
    message: "Category created successfully",
    data: { id: Date.now(), ...data },
    errors: [],
  })
  return result
}

export async function updateQuestionCategory(
  id: number,
  data: { nameEn: string; nameAr: string },
): Promise<ApiResponse<QuestionCategory>> {
  const result = await apiClient.put<ApiResponse<QuestionCategory>>(`/Lookups/question-categories/${id}`, data, {
    success: true,
    message: "Category updated successfully",
    data: { id, ...data },
    errors: [],
  })
  return result
}

export async function deleteQuestionCategory(id: number): Promise<ApiResponse<boolean>> {
  const result = await apiClient.delete<ApiResponse<boolean>>(`/Lookups/question-categories/${id}`, {
    success: true,
    message: "Category deleted successfully",
    data: true,
    errors: [],
  })
  return result
}

// Question Types API
export async function getQuestionTypes(params?: {
  search?: string
  includeDeleted?: boolean
  pageNumber?: number
  pageSize?: number
}): Promise<PaginatedResponse<QuestionType>> {
  const queryParams = new URLSearchParams()
  if (params?.search) queryParams.append("search", params.search)
  if (params?.includeDeleted) queryParams.append("includeDeleted", "true")
  queryParams.append("pageNumber", String(params?.pageNumber || 1))
  queryParams.append("pageSize", String(params?.pageSize || 100))

  const mockResponse: PaginatedResponse<QuestionType> = {
    items: MOCK_TYPES,
    pageNumber: 1,
    pageSize: 100,
    totalCount: MOCK_TYPES.length,
    totalPages: 1,
  }

  try {
    const result = await apiClient.get<PaginatedResponse<QuestionType>>(
      `/Lookups/question-types?${queryParams.toString()}`,
      mockResponse,
    )

    if (result && typeof result === "object" && "items" in result) {
      return result
    }

    return mockResponse
  } catch (error) {
    console.error("getQuestionTypes error:", error)
    return mockResponse
  }
}

export async function getQuestionTypeById(id: number): Promise<QuestionType | null> {
  const mockType = MOCK_TYPES.find((t) => t.id === id) || null

  const result = await apiClient.get<ApiResponse<QuestionType>>(`/Lookups/question-types/${id}`, mockType)

  if (result && typeof result === "object" && "nameEn" in result) {
    return result as QuestionType
  }
  if (result && typeof result === "object" && "data" in result && result.data) {
    return result.data
  }
  return mockType
}

export async function createQuestionType(data: {
  nameEn: string
  nameAr: string
}): Promise<ApiResponse<QuestionType>> {
  const result = await apiClient.post<ApiResponse<QuestionType>>("/Lookups/question-types", data, {
    success: true,
    message: "Type created successfully",
    data: { id: Date.now(), ...data },
    errors: [],
  })
  return result
}

export async function updateQuestionType(
  id: number,
  data: { nameEn: string; nameAr: string },
): Promise<ApiResponse<QuestionType>> {
  const result = await apiClient.put<ApiResponse<QuestionType>>(`/Lookups/question-types/${id}`, data, {
    success: true,
    message: "Type updated successfully",
    data: { id, ...data },
    errors: [],
  })
  return result
}

export async function deleteQuestionType(id: number): Promise<ApiResponse<boolean>> {
  const result = await apiClient.delete<ApiResponse<boolean>>(`/Lookups/question-types/${id}`, {
    success: true,
    message: "Type deleted successfully",
    data: true,
    errors: [],
  })
  return result
}
