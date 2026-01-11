import { apiClient } from "@/lib/api-client"
import type { User, AuditLog } from "@/lib/types"

// User Management
export async function getUsers(params?: {
  search?: string
  role?: string
  isActive?: boolean
  page?: number
  pageSize?: number
}): Promise<{ items: User[]; totalCount: number }> {
  try {
    return await apiClient.get("/api/users", params)
  } catch {
    return {
      items: [
        {
          id: "user-1",
          email: "admin@examproctored.com",
          fullNameEn: "System Administrator",
          fullNameAr: "مسؤول النظام",
          role: "Admin" as any,
          isActive: true,
          createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
        },
        {
          id: "user-2",
          email: "instructor@examproctored.com",
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
          email: "proctor@examproctored.com",
          fullNameEn: "Mohammed Khalid",
          fullNameAr: "محمد خالد",
          role: "ProctorReviewer" as any,
          isActive: true,
          createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
        },
        {
          id: "user-5",
          email: "auditor@examproctored.com",
          fullNameEn: "Fatima Ahmed",
          fullNameAr: "فاطمة أحمد",
          role: "Auditor" as any,
          isActive: false,
          createdDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
        },
      ],
      totalCount: 5,
    }
  }
}

export async function getUserById(id: string): Promise<User> {
  try {
    return await apiClient.get(`/api/users/${id}`)
  } catch {
    return {
      id,
      email: "user@example.com",
      fullNameEn: "Sample User",
      fullNameAr: "مستخدم نموذجي",
      role: "Candidate" as any,
      isActive: true,
      createdDate: new Date().toISOString(),
    }
  }
}

export async function createUser(data: {
  email: string
  fullNameEn: string
  fullNameAr: string
  role: string
  password: string
}): Promise<User> {
  return await apiClient.post("/api/users", data)
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
  return await apiClient.put(`/api/users/${id}`, data)
}

export async function deleteUser(id: string): Promise<void> {
  await apiClient.delete(`/api/users/${id}`)
}

export async function resetUserPassword(id: string): Promise<{ temporaryPassword: string }> {
  return await apiClient.post(`/api/users/${id}/reset-password`, {})
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
  try {
    return await apiClient.get("/api/audit-logs", params)
  } catch {
    return {
      items: [
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
        {
          id: 4,
          actorId: "user-1",
          actorName: "System Administrator",
          actorType: "User",
          action: "Delete",
          entityName: "User",
          entityId: "user-99",
          correlationId: null,
          tenantId: null,
          source: "Web",
          channel: "Dashboard",
          outcome: "Success",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0",
          timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          details: JSON.stringify({ reason: "Account deactivation request" }),
        },
        {
          id: 5,
          actorId: "system",
          actorName: "System",
          actorType: "System",
          action: "AutoGrade",
          entityName: "GradingSession",
          entityId: "gs-12",
          correlationId: null,
          tenantId: null,
          source: "Background",
          channel: "GradingService",
          outcome: "Success",
          ipAddress: null,
          userAgent: null,
          timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          details: JSON.stringify({ questionsGraded: 25, autoScore: 78 }),
        },
      ],
      totalCount: 5,
    }
  }
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

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    return await apiClient.get("/api/settings")
  } catch {
    return {
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
  }
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<SystemSettings> {
  return await apiClient.put("/api/settings", settings)
}
