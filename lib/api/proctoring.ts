import { apiClient } from "@/lib/api-client"
import type { Incident, LiveSession } from "@/lib/types"

// Mock data for live sessions
const MOCK_SESSIONS: LiveSession[] = [
  {
    id: "session-1",
    candidateId: "cand-1",
    candidateName: "Ahmed Hassan",
    examTitle: "Mathematics Final Exam",
    startedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    timeRemaining: 75,
    status: "Active",
    incidentCount: 0,
    flagged: false,
    lastActivity: new Date(Date.now() - 1000 * 30).toISOString(),
  },
  {
    id: "session-2",
    candidateId: "cand-2",
    candidateName: "Sara Ali",
    examTitle: "Mathematics Final Exam",
    startedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    timeRemaining: 90,
    status: "Active",
    incidentCount: 2,
    flagged: true,
    lastActivity: new Date(Date.now() - 1000 * 60).toISOString(),
  },
  {
    id: "session-3",
    candidateId: "cand-3",
    candidateName: "Mohammed Khalid",
    examTitle: "Physics Midterm",
    startedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    timeRemaining: 75,
    status: "Active",
    incidentCount: 1,
    flagged: false,
    lastActivity: new Date(Date.now() - 1000 * 120).toISOString(),
  },
  {
    id: "session-4",
    candidateId: "cand-4",
    candidateName: "Fatima Ahmed",
    examTitle: "Physics Midterm",
    startedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    timeRemaining: 70,
    status: "Active",
    incidentCount: 0,
    flagged: false,
    lastActivity: new Date(Date.now() - 1000 * 45).toISOString(),
  },
]

// Get live proctoring sessions
export async function getLiveSessions(): Promise<LiveSession[]> {
  try {
    const response = await apiClient.get("/api/proctoring/sessions")
    // Ensure we always return an array
    if (Array.isArray(response)) {
      return response
    }
    if (response?.items && Array.isArray(response.items)) {
      return response.items
    }
    if (response?.data && Array.isArray(response.data)) {
      return response.data
    }
    // If no valid array found, return mock data
    return MOCK_SESSIONS
  } catch {
    return MOCK_SESSIONS
  }
}

// Get session details
export async function getSessionDetails(sessionId: string): Promise<{
  session: LiveSession
  incidents: Incident[]
  screenshots: Array<{ id: string; timestamp: string; url: string }>
}> {
  try {
    return await apiClient.get(`/api/proctoring/sessions/${sessionId}`)
  } catch {
    return {
      session: {
        id: sessionId,
        candidateId: "cand-2",
        candidateName: "Sara Ali",
        examTitle: "Mathematics Final Exam",
        startedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        timeRemaining: 90,
        status: "Active",
        incidentCount: 2,
        flagged: true,
        lastActivity: new Date().toISOString(),
      },
      incidents: [
        {
          id: "inc-1",
          sessionId,
          type: "TabSwitch",
          severity: "Medium",
          description: "Candidate switched to another tab",
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          reviewed: false,
        },
        {
          id: "inc-2",
          sessionId,
          type: "FaceNotDetected",
          severity: "High",
          description: "Face not detected for 10 seconds",
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          reviewed: false,
        },
      ],
      screenshots: [
        {
          id: "ss-1",
          timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          url: "/webcam-screenshot-exam-candidate.jpg",
        },
        {
          id: "ss-2",
          timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
          url: "/webcam-screenshot-studying.jpg",
        },
        {
          id: "ss-3",
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          url: "/webcam-screenshot-looking-away.jpg",
        },
        {
          id: "ss-4",
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          url: "/webcam-screenshot-writing.jpg",
        },
      ],
    }
  }
}

// Get all incidents
export async function getIncidents(params?: {
  sessionId?: string
  severity?: string
  reviewed?: boolean
  page?: number
  pageSize?: number
}): Promise<{ items: Incident[]; totalCount: number }> {
  try {
    return await apiClient.get("/api/proctoring/incidents", params)
  } catch {
    return {
      items: [
        {
          id: "inc-1",
          sessionId: "session-2",
          candidateName: "Sara Ali",
          examTitle: "Mathematics Final Exam",
          type: "TabSwitch",
          severity: "Medium",
          description: "Candidate switched to another tab",
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          reviewed: false,
        },
        {
          id: "inc-2",
          sessionId: "session-2",
          candidateName: "Sara Ali",
          examTitle: "Mathematics Final Exam",
          type: "FaceNotDetected",
          severity: "High",
          description: "Face not detected for 10 seconds",
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
          reviewed: false,
        },
        {
          id: "inc-3",
          sessionId: "session-3",
          candidateName: "Mohammed Khalid",
          examTitle: "Physics Midterm",
          type: "MultiplePersons",
          severity: "Critical",
          description: "Multiple persons detected in frame",
          timestamp: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
          reviewed: true,
          reviewedBy: "Admin User",
          reviewNotes: "False positive - reflection in mirror",
        },
        {
          id: "inc-4",
          sessionId: "session-1",
          candidateName: "Ahmed Hassan",
          examTitle: "Mathematics Final Exam",
          type: "AudioDetected",
          severity: "Low",
          description: "Background audio detected",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          reviewed: true,
          reviewedBy: "Admin User",
          reviewNotes: "Ambient noise, no cheating detected",
        },
      ],
      totalCount: 4,
    }
  }
}

// Review incident
export async function reviewIncident(
  incidentId: string,
  review: { action: "dismiss" | "flag" | "terminate"; notes: string },
): Promise<void> {
  try {
    await apiClient.post(`/api/proctoring/incidents/${incidentId}/review`, review)
  } catch {
    // Mock - review saved
  }
}

// Flag session
export async function flagSession(sessionId: string, flagged: boolean): Promise<void> {
  try {
    await apiClient.post(`/api/proctoring/sessions/${sessionId}/flag`, { flagged })
  } catch {
    // Mock
  }
}

// Terminate session
export async function terminateSession(sessionId: string, reason: string): Promise<void> {
  try {
    await apiClient.post(`/api/proctoring/sessions/${sessionId}/terminate`, { reason })
  } catch {
    // Mock
  }
}

// Send warning to candidate
export async function sendWarning(sessionId: string, message: string): Promise<void> {
  try {
    await apiClient.post(`/api/proctoring/sessions/${sessionId}/warning`, { message })
  } catch {
    // Mock
  }
}
