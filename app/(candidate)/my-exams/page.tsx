"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { useAuth } from "@/lib/auth/context"
import { getAvailableExams } from "@/lib/api/exam-session"
import type { ExamSession } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import {
  Calendar,
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  LogOut,
  Shield,
  Award as IdCard,
} from "lucide-react"

export default function MyExamsPage() {
  const { t, dir } = useI18n()
  const { user, logout } = useAuth()
  const [exams, setExams] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExams()
  }, [])

  async function loadExams() {
    try {
      const data = await getAvailableExams()
      setExams(data)
    } catch (error) {
      toast.error("Failed to load exams")
    } finally {
      setLoading(false)
    }
  }

  const upcomingExams = exams.filter((e) => e.status === "Scheduled")
  const activeExams = exams.filter((e) => e.status === "InProgress")
  const completedExams = exams.filter((e) => e.status === "Completed" || e.status === "Submitted")

  function formatDateTime(dateStr: string) {
    return new Date(dateStr).toLocaleString()
  }

  function getTimeUntilStart(startTime: string) {
    const diff = new Date(startTime).getTime() - Date.now()
    if (diff <= 0) return null

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes} minutes`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
              E
            </div>
            <span className="text-lg font-semibold">ExamPro</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-end">
              <p className="text-sm font-medium">{user?.fullName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t("candidate.myExams")}</h1>
          <p className="text-muted-foreground mt-2">{t("candidate.myExamsDesc")}</p>
        </div>

        {/* Active Exams Alert */}
        {activeExams.length > 0 && (
          <Card className="mb-6 border-amber-500/50 bg-amber-500/5">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-medium">{t("candidate.examInProgress")}</p>
                  <p className="text-sm text-muted-foreground">{activeExams[0].examTitle}</p>
                </div>
              </div>
              <Button asChild>
                <Link href={`/take-exam/${activeExams[0].id}`}>
                  <PlayCircle className="h-4 w-4 me-2" />
                  {t("candidate.continue")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming" className="gap-2">
              <Calendar className="h-4 w-4" />
              {t("candidate.upcoming")} ({upcomingExams.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              {t("candidate.completed")} ({completedExams.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="space-y-4">
            {upcomingExams.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={t("candidate.noUpcoming")}
                description={t("candidate.noUpcomingDesc")}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingExams.map((exam) => {
                  const timeUntil = getTimeUntilStart(exam.startTime)
                  const canStart = !timeUntil

                  return (
                    <Card key={exam.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{exam.examTitle}</CardTitle>
                            <CardDescription>{exam.examCode}</CardDescription>
                          </div>
                          {canStart ? (
                            <Badge className="bg-emerald-500">{t("candidate.readyToStart")}</Badge>
                          ) : (
                            <Badge variant="secondary">{t("candidate.scheduled")}</Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDateTime(exam.startTime)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {exam.durationMinutes} {t("common.minutes")}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {exam.requiresProctoring && (
                            <Badge variant="outline" className="gap-1">
                              <Shield className="h-3 w-3" />
                              {t("candidate.proctored")}
                            </Badge>
                          )}
                          {exam.requiresIdVerification && (
                            <Badge variant="outline" className="gap-1">
                              <IdCard className="h-3 w-3" />
                              {t("candidate.idRequired")}
                            </Badge>
                          )}
                        </div>

                        {timeUntil && (
                          <p className="text-sm text-muted-foreground">
                            {t("candidate.startsIn", { time: timeUntil })}
                          </p>
                        )}

                        <Button className="w-full" disabled={!canStart} asChild={canStart}>
                          {canStart ? (
                            <Link href={`/take-exam/${exam.id}/instructions`}>
                              <PlayCircle className="h-4 w-4 me-2" />
                              {t("candidate.startExam")}
                            </Link>
                          ) : (
                            <>
                              <Clock className="h-4 w-4 me-2" />
                              {t("candidate.notYetAvailable")}
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedExams.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={t("candidate.noCompleted")}
                description={t("candidate.noCompletedDesc")}
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {completedExams.map((exam) => (
                  <Card key={exam.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{exam.examTitle}</CardTitle>
                          <CardDescription>{exam.examCode}</CardDescription>
                        </div>
                        {exam.passed !== undefined && (
                          <Badge className={exam.passed ? "bg-emerald-500" : "bg-red-500"}>
                            {exam.passed ? t("candidate.passed") : t("candidate.failed")}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(exam.endTime)}</span>
                        </div>
                        {exam.score !== undefined && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-lg">{exam.score}%</span>
                          </div>
                        )}
                      </div>
                      <Button variant="outline" className="w-full bg-transparent" asChild>
                        <Link href={`/results/${exam.id}`}>
                          <FileText className="h-4 w-4 me-2" />
                          {t("candidate.viewResults")}
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
