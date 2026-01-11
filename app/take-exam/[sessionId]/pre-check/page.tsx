"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { getAvailableExams } from "@/lib/api/exam-session"
import type { ExamSession } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  CheckCircle2,
  XCircle,
  Camera,
  Mic,
  Monitor,
  Wifi,
  Shield,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
} from "lucide-react"

type CheckStatus = "pending" | "checking" | "passed" | "failed"

interface SystemCheck {
  id: string
  label: string
  icon: React.ElementType
  status: CheckStatus
  message?: string
}

export default function ExamPreCheckPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const { t } = useI18n()
  const videoRef = useRef<HTMLVideoElement>(null)

  const [exam, setExam] = useState<ExamSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [agreementChecked, setAgreementChecked] = useState(false)
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([
    { id: "browser", label: t("preCheck.browserCheck"), icon: Monitor, status: "pending" },
    { id: "connection", label: t("preCheck.connectionCheck"), icon: Wifi, status: "pending" },
    { id: "camera", label: t("preCheck.cameraCheck"), icon: Camera, status: "pending" },
    { id: "microphone", label: t("preCheck.microphoneCheck"), icon: Mic, status: "pending" },
  ])
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)

  useEffect(() => {
    loadExam()
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [sessionId])

  async function loadExam() {
    try {
      const exams = await getAvailableExams()
      const found = exams.find((e) => e.id === sessionId)
      if (found) {
        setExam(found)
      } else {
        toast.error("Exam session not found")
        router.push("/my-exams")
      }
    } catch (error) {
      toast.error("Failed to load exam")
    } finally {
      setLoading(false)
    }
  }

  function updateCheck(id: string, status: CheckStatus, message?: string) {
    setSystemChecks((prev) => prev.map((check) => (check.id === id ? { ...check, status, message } : check)))
  }

  async function runSystemChecks() {
    // Reset all checks
    setSystemChecks((prev) => prev.map((check) => ({ ...check, status: "pending", message: undefined })))

    // Browser check
    updateCheck("browser", "checking")
    await new Promise((r) => setTimeout(r, 500))
    const isModernBrowser = "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices
    updateCheck(
      "browser",
      isModernBrowser ? "passed" : "failed",
      isModernBrowser ? undefined : t("preCheck.browserFailed"),
    )

    // Connection check
    updateCheck("connection", "checking")
    await new Promise((r) => setTimeout(r, 800))
    const isOnline = navigator.onLine
    updateCheck("connection", isOnline ? "passed" : "failed", isOnline ? undefined : t("preCheck.connectionFailed"))

    // Camera check
    if (exam?.requiresProctoring) {
      updateCheck("camera", "checking")
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        setCameraStream(stream)
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
        updateCheck("camera", "passed")
      } catch (error) {
        updateCheck("camera", "failed", t("preCheck.cameraFailed"))
      }

      // Microphone check
      updateCheck("microphone", "checking")
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop())
        updateCheck("microphone", "passed")
      } catch (error) {
        updateCheck("microphone", "failed", t("preCheck.microphoneFailed"))
      }
    } else {
      // Skip camera/mic checks if no proctoring
      updateCheck("camera", "passed")
      updateCheck("microphone", "passed")
    }
  }

  useEffect(() => {
    if (exam) {
      runSystemChecks()
    }
  }, [exam])

  const allChecksPassed = systemChecks.every((check) => check.status === "passed")
  const hasFailedChecks = systemChecks.some((check) => check.status === "failed")
  const isChecking = systemChecks.some((check) => check.status === "checking")

  function handleStartExam() {
    if (!allChecksPassed || !agreementChecked) return

    // Stop camera stream before navigating
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop())
    }

    router.push(`/take-exam/${sessionId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!exam) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">{t("preCheck.title")}</h1>
          <p className="text-muted-foreground">{exam.examTitle}</p>
        </div>

        {/* Exam Info Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              {t("preCheck.examInfo")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3 text-center">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">{exam.durationMinutes}</p>
                <p className="text-sm text-muted-foreground">{t("common.minutes")}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">
                  {exam.requiresProctoring ? t("common.yes") : t("common.no")}
                </p>
                <p className="text-sm text-muted-foreground">{t("myExams.proctored")}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-foreground">
                  {exam.requiresIdVerification ? t("common.yes") : t("common.no")}
                </p>
                <p className="text-sm text-muted-foreground">{t("myExams.idRequired")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Checks */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {t("preCheck.systemChecks")}
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={runSystemChecks} disabled={isChecking}>
                <RefreshCw className={`h-4 w-4 me-2 ${isChecking ? "animate-spin" : ""}`} />
                {t("preCheck.recheck")}
              </Button>
            </div>
            <CardDescription>{t("preCheck.systemChecksDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemChecks.map((check) => (
              <div
                key={check.id}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  check.status === "passed"
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : check.status === "failed"
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-border bg-muted/30"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background">
                  <check.icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{check.label}</p>
                  {check.message && <p className="text-sm text-destructive">{check.message}</p>}
                </div>
                <div>
                  {check.status === "checking" && <LoadingSpinner size="sm" />}
                  {check.status === "passed" && <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                  {check.status === "failed" && <XCircle className="h-5 w-5 text-destructive" />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Camera Preview */}
        {exam.requiresProctoring && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                {t("preCheck.cameraPreview")}
              </CardTitle>
              <CardDescription>{t("preCheck.cameraPreviewDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Agreement */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t("preCheck.agreement")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-2">
              <p>{t("preCheck.agreementText1")}</p>
              <ul className="list-disc list-inside space-y-1 ps-2">
                <li>{t("preCheck.rule1")}</li>
                <li>{t("preCheck.rule2")}</li>
                <li>{t("preCheck.rule3")}</li>
                <li>{t("preCheck.rule4")}</li>
              </ul>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Checkbox
                id="agreement"
                checked={agreementChecked}
                onCheckedChange={(checked) => setAgreementChecked(checked === true)}
              />
              <Label htmlFor="agreement" className="cursor-pointer">
                {t("preCheck.agreementCheckbox")}
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push("/my-exams")}>
            {t("common.cancel")}
          </Button>
          <Button size="lg" disabled={!allChecksPassed || !agreementChecked || isChecking} onClick={handleStartExam}>
            {t("preCheck.startExam")}
            <ArrowRight className="h-4 w-4 ms-2" />
          </Button>
        </div>

        {hasFailedChecks && <p className="text-center text-sm text-destructive">{t("preCheck.fixIssues")}</p>}
      </div>
    </div>
  )
}
