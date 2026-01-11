"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getAvailableExams } from "@/lib/api/exam-session"
import type { ExamSession } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import { Clock, Calendar, PlayCircle, CheckCircle2, FileText, Shield, Camera, MapPin } from "lucide-react"

export default function MyExamsPage() {
  const { t, locale } = useI18n()
  const [exams, setExams] = useState<ExamSession[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExams()
  }, [])

  async function loadExams() {
    try {
      setLoading(true)
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

  function formatDateTime(dateString: string) {
    const date = new Date(dateString)
    return date.toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  function getTimeUntil(dateString: string) {
    const now = new Date()
    const target = new Date(dateString)
    const diff = target.getTime() - now.getTime()

    if (diff < 0) return null

    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 24) {
      const days = Math.floor(hours / 24)
      return `${days} ${t("common.days")}`
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  function canStartExam(exam: ExamSession) {
    const now = new Date()
    const start = new Date(exam.startTime)
    const end = new Date(exam.endTime)
    return now >= start && now <= end
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("myExams.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("myExams.subtitle")}</p>
      </div>

      {/* Active exams alert */}
      {activeExams.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <PlayCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{t("myExams.activeExam")}</h3>
              <p className="text-sm text-muted-foreground">
                {t("myExams.activeExamDesc", { count: activeExams.length })}
              </p>
            </div>
            <Button asChild>
              <Link href={`/take-exam/${activeExams[0].id}`}>{t("myExams.continue")}</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList>
          <TabsTrigger value="upcoming" className="gap-2">
            <Calendar className="h-4 w-4" />
            {t("myExams.upcoming")} ({upcomingExams.length})
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2">
            <PlayCircle className="h-4 w-4" />
            {t("myExams.active")} ({activeExams.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {t("myExams.completed")} ({completedExams.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-4">
          {upcomingExams.length === 0 ? (
            <EmptyState icon={Calendar} title={t("myExams.noUpcoming")} description={t("myExams.noUpcomingDesc")} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingExams.map((exam) => {
                const timeUntil = getTimeUntil(exam.startTime)
                const canStart = canStartExam(exam)

                return (
                  <Card key={exam.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{exam.examTitle}</CardTitle>
                          <CardDescription>{exam.examCode}</CardDescription>
                        </div>
                        {timeUntil && (
                          <Badge variant="secondary" className="shrink-0">
                            {t("myExams.startsIn")} {timeUntil}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
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
                        {exam.scheduleName && (
                          <div className="flex items-center gap-2 text-muted-foreground col-span-2">
                            <MapPin className="h-4 w-4" />
                            <span>{exam.scheduleName}</span>
                          </div>
                        )}
                      </div>

                      {/* Requirements */}
                      <div className="flex flex-wrap gap-2">
                        {exam.requiresProctoring && (
                          <Badge variant="outline" className="gap-1">
                            <Camera className="h-3 w-3" />
                            {t("myExams.proctored")}
                          </Badge>
                        )}
                        {exam.requiresIdVerification && (
                          <Badge variant="outline" className="gap-1">
                            <Shield className="h-3 w-3" />
                            {t("myExams.idRequired")}
                          </Badge>
                        )}
                      </div>

                      <Button className="w-full" disabled={!canStart} asChild={canStart}>
                        {canStart ? (
                          <Link href={`/take-exam/${exam.id}/pre-check`}>
                            <PlayCircle className="h-4 w-4 me-2" />
                            {t("myExams.startExam")}
                          </Link>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 me-2" />
                            {t("myExams.notYetAvailable")}
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

        <TabsContent value="active" className="space-y-4">
          {activeExams.length === 0 ? (
            <EmptyState icon={PlayCircle} title={t("myExams.noActive")} description={t("myExams.noActiveDesc")} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {activeExams.map((exam) => (
                <Card key={exam.id} className="overflow-hidden border-primary">
                  <CardHeader className="pb-3 bg-primary/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{exam.examTitle}</CardTitle>
                        <CardDescription>{exam.examCode}</CardDescription>
                      </div>
                      <Badge className="bg-primary shrink-0">{t("status.inProgress")}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {exam.durationMinutes} {t("common.minutes")}
                        </span>
                      </div>
                    </div>
                    <Button className="w-full" asChild>
                      <Link href={`/take-exam/${exam.id}`}>
                        <PlayCircle className="h-4 w-4 me-2" />
                        {t("myExams.continue")}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {completedExams.length === 0 ? (
            <EmptyState
              icon={CheckCircle2}
              title={t("myExams.noCompleted")}
              description={t("myExams.noCompletedDesc")}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {completedExams.map((exam) => (
                <Card key={exam.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{exam.examTitle}</CardTitle>
                        <CardDescription>{exam.examCode}</CardDescription>
                      </div>
                      {exam.passed !== undefined && (
                        <Badge variant={exam.passed ? "default" : "destructive"}>
                          {exam.passed ? t("myExams.passed") : t("myExams.failed")}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {t("myExams.completedOn")} {formatDateTime(exam.endTime)}
                      </span>
                      {exam.score !== undefined && (
                        <span className="text-2xl font-bold text-foreground">{exam.score}%</span>
                      )}
                    </div>
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href={`/results/${exam.id}`}>
                        <FileText className="h-4 w-4 me-2" />
                        {t("myExams.viewResults")}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
