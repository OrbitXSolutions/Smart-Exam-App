"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getAvailableExams } from "@/lib/api/exam-session"
import type { ExamSession } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import { ArrowLeft, PlayCircle, Clock, FileText, AlertTriangle, Shield, Monitor, Camera, Wifi } from "lucide-react"

export default function ExamInstructionsPage() {
  const { id } = useParams<{ id: string }>()
  const { t } = useI18n()
  const router = useRouter()
  const [exam, setExam] = useState<ExamSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    loadExam()
  }, [id])

  async function loadExam() {
    try {
      const exams = await getAvailableExams()
      const found = exams.find((e) => e.id === id)
      if (!found) throw new Error("Exam not found")
      setExam(found)
    } catch (error) {
      toast.error("Failed to load exam")
      router.push("/my-exams")
    } finally {
      setLoading(false)
    }
  }

  function handleStartExam() {
    if (!agreed) {
      toast.error("Please agree to the terms before starting")
      return
    }
    router.push(`/take-exam/${id}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!exam) return null

  const instructions = [
    {
      icon: Clock,
      title: t("instructions.timeLimit"),
      description: t("instructions.timeLimitDesc", { minutes: exam.durationMinutes }),
    },
    {
      icon: Monitor,
      title: t("instructions.fullscreen"),
      description: t("instructions.fullscreenDesc"),
    },
    {
      icon: Wifi,
      title: t("instructions.connection"),
      description: t("instructions.connectionDesc"),
    },
    {
      icon: FileText,
      title: t("instructions.answers"),
      description: t("instructions.answersDesc"),
    },
  ]

  const warnings = [
    t("instructions.warning1"),
    t("instructions.warning2"),
    t("instructions.warning3"),
    t("instructions.warning4"),
  ]

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center">
          <Button variant="ghost" size="icon" asChild className="me-4">
            <Link href="/my-exams">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="font-semibold">{exam.examTitle}</h1>
            <p className="text-sm text-muted-foreground">{exam.examCode}</p>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-3xl">
        <div className="space-y-6">
          {/* Exam Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("instructions.examInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Clock className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t("instructions.duration")}</p>
                    <p className="font-medium">
                      {exam.durationMinutes} {t("common.minutes")}
                    </p>
                  </div>
                </div>
                {exam.requiresProctoring && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Camera className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t("instructions.proctoring")}</p>
                      <p className="font-medium">{t("instructions.proctoringEnabled")}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>{t("instructions.beforeYouBegin")}</CardTitle>
              <CardDescription>{t("instructions.readCarefully")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {instructions.map((item, index) => (
                <div key={index} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Warnings */}
          <Card className="border-amber-500/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-5 w-5" />
                {t("instructions.importantWarnings")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Security Notice */}
          {exam.requiresProctoring && (
            <Card className="border-blue-500/50 bg-blue-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Shield className="h-5 w-5" />
                  {t("instructions.securityNotice")}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p>{t("instructions.securityDesc1")}</p>
                <p>{t("instructions.securityDesc2")}</p>
              </CardContent>
            </Card>
          )}

          {/* Agreement and Start */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Checkbox id="agree" checked={agreed} onCheckedChange={(checked) => setAgreed(checked === true)} />
                <label htmlFor="agree" className="text-sm cursor-pointer">
                  {t("instructions.agreement")}
                </label>
              </div>
              <Button className="w-full" size="lg" disabled={!agreed} onClick={handleStartExam}>
                <PlayCircle className="h-5 w-5 me-2" />
                {t("instructions.startExam")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
