import { apiClient } from "@/lib/api-client"
import type { User, AuditLog } from "@/lib/types"

const mockUsers: User[] = [
  {
    id: "user-1",
    email: "admin@smartexam.com",
    fullNameEn: "System Administrator",
    fullNameAr: "مسؤول النظام",
    role: "Admin" as any,
    isActive: true,
    createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
  },
  {
    id: "user-2",
    email: "instructor@smartexam.com",
    fullNameEn: "Dr. Ahmed Hassan",
    fullNameAr: "د. أحمد حسن",
    role: "Instructor" as any,
    isActive: true,
    createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
  },
  {
    id: "user-3",
    email: "sara.ali@example.com",
    fullNameEn: "Sara Ali",
    fullNameAr: "سارة علي",
    role: "Candidate" as any,
    isActive: true,
    createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
  },
  {
    id: "user-4",
    email: "proctor@smartexam.com",
    fullNameEn: "Mohammed Khalid",
    fullNameAr: "محمد خالد",
    role: "ProctorReviewer" as any,
    isActive: true,
    createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
  },
  {
    id: "user-5",
    email: "auditor@smartexam.com",
    fullNameEn: "Fatima Ahmed",
    fullNameAr: "فاطمة أحمد",
    role: "Auditor" as any,
    isActive: false,
    createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
  },
]

const mockAuditLogsData: AuditLog[] = [
  {
    id: 1,
    actorId: "user-1",
    actorName: "System Administrator",
    actorType: "User",
    action: "Create",
    entityName: "Exam",
    entityId: "exam-1",
    correlationId: null,
    tenantId: null,
    source: "Web",
    channel: "Dashboard",
    outcome: "Success",
    ipAddress: "192.168.1.100",
    userAgent: "Mozilla/5.0",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    details: JSON.stringify({ examTitle: "Mathematics Final Exam" }),
  },
  {
    id: 2,
    actorId: "user-2",
    actorName: "Dr. Ahmed Hassan",
    actorType: "User",
    action: "Update",
    entityName: "Question",
    entityId: "q-15",
    correlationId: null,
    tenantId: null,
    source: "Web",
    channel: "Dashboard",
    outcome: "Success",
    ipAddress: "192.168.1.101",
    userAgent: "Mozilla/5.0",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    details: JSON.stringify({ field: "body", oldValue: "...", newValue: "..." }),
  },
  {
    id: 3,
    actorId: "user-3",
    actorName: "Sara Ali",
    actorType: "User",
    action: "Submit",
    entityName: "Attempt",
    entityId: "attempt-42",
    correlationId: null,
    tenantId: null,
    source: "Web",
    channel: "ExamPortal",
    outcome: "Success",
    ipAddress: "10.0.0.55",
    userAgent: "Chrome/120",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    details: JSON.stringify({ examId: "exam-1", score: 85 }),
  },
]

// User Management
export async function getUsers(params?: {
  search?: string
  role?: string
  isActive?: boolean
  page?: number
  pageSize?: number
}): Promise<{ items: User[]; totalCount: number }> {
  return apiClient.get("/api/users", {
    items: mockUsers,
    totalCount: mockUsers.length,
  })
}

export async function getUserById(id: string): Promise<User> {
  const mockUser = mockUsers.find((u) => u.id === id) || mockUsers[0]
  return apiClient.get(`/api/users/${id}`, mockUser)
}

export async function createUser(data: {
  email: string
  fullNameEn: string
  fullNameAr: string
  role: string
  password: string
}): Promise<User> {
  const newUser: User = {
    id: `user-${Date.now()}`,
    email: data.email,
    fullNameEn: data.fullNameEn,
    fullNameAr: data.fullNameAr,
    role: data.role as any,
    isActive: true,
    createdDate: new Date().toISOString(),
  }
  return apiClient.post("/api/users", data, newUser)
}

export async function updateUser(
  id: string,
  data: {
    fullNameEn?: string
    fullNameAr?: string
    role?: string
    isActive?: boolean
  },
): Promise<User> {
  const existing = mockUsers.find((u) => u.id === id) || mockUsers[0]
  return apiClient.put(`/api/users/${id}`, data, { ...existing, ...data })
}

export async function deleteUser(id: string): Promise<void> {
  return apiClient.delete(`/api/users/${id}`, undefined)
}

export async function resetUserPassword(id: string): Promise<{ temporaryPassword: string }> {
  return apiClient.post(`/api/users/${id}/reset-password`, {}, { temporaryPassword: "TempPass123!" })
}

// Audit Logs
export async function getAuditLogs(params?: {
  actorId?: string
  action?: string
  entityName?: string
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}): Promise<{ items: AuditLog[]; totalCount: number }> {
  return apiClient.get("/api/audit-logs", {
    items: mockAuditLogsData,
    totalCount: mockAuditLogsData.length,
  })
}

// System Settings
export interface SystemSettings {
  maintenanceMode: boolean
  allowRegistration: boolean
  defaultProctorMode: string
  maxFileUploadMb: number
  sessionTimeoutMinutes: number
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
  }
}

const defaultSettings: SystemSettings = {
  maintenanceMode: false,
  allowRegistration: true,
  defaultProctorMode: "Soft",
  maxFileUploadMb: 10,
  sessionTimeoutMinutes: 120,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },
}

export async function getSystemSettings(): Promise<SystemSettings> {
  return apiClient.get("/api/settings", defaultSettings)
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
  return apiClient.put("/api/settings", settings, { ...defaultSettings, ...settings })
}
