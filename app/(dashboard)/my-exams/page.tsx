"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import {
  getAvailableExams,
  type CandidateExam,
  type QuickAction,
  ExamType,
  MOCK_AVAILABLE_EXAMS,
  MOCK_DASHBOARD,
} from "@/lib/api/candidate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import {
  Clock,
  Calendar,
  PlayCircle,
  CheckCircle2,
  FileText,
  Shield,
  Camera,
  Award,
  ArrowRight,
} from "lucide-react"

// Helper function to get localized field
function getLocalizedField<T extends Record<string, unknown>>(
  obj: T,
  fieldBase: string,
  language: string
): string {
  const field = language === "ar" ? `${fieldBase}Ar` : `${fieldBase}En`
  const fallback = language === "ar" ? `${fieldBase}En` : `${fieldBase}Ar`
  return (obj[field] as string) || (obj[fallback] as string) || ""
}

export default function MyExamsPage() {
  const { t, language } = useI18n()
  const [exams, setExams] = useState<CandidateExam[]>([])
  const [activeAttempts, setActiveAttempts] = useState<QuickAction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExams()
  }, [])

  async function loadExams() {
    try {
      setLoading(true)
      
      // Single API call to get all available exams
      const response = await getAvailableExams()
      console.log("[v0] Loaded exams:", response?.length || 0)
      setExams(response || [])
      
      // Active attempts will come from actual API data, not mock
      setActiveAttempts([])
    } catch (error) {
      console.log("[v0] API error, using mock data:", error)
      // Fallback to mock data for exams only
      setExams(MOCK_AVAILABLE_EXAMS)
      setActiveAttempts([])
    } finally {
      setLoading(false)
    }
  }

  // Categorize exams based on timing
  const now = new Date()
  
  const upcomingExams = exams.filter((exam) => {
    if (!exam.startAt) return false
    return new Date(exam.startAt) > now
  })

  const activeExams = exams.filter((exam) => {
    const start = exam.startAt ? new Date(exam.startAt) : new Date(0)
    const end = exam.endAt ? new Date(exam.endAt) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
    return now >= start && now <= end
  })

  const completedExams = exams.filter((exam) => {
    return exam.myAttempts !== null && exam.myAttempts > 0 && exam.myBestIsPassed !== null
  })

  function formatDateTime(dateString: string | null) {
    if (!dateString) return "-"
    const date = new Date(dateString)
    return date.toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  function getTimeUntil(dateString: string | null) {
    if (!dateString) return null
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

  function canStartExam(exam: CandidateExam) {
    const start = exam.startAt ? new Date(exam.startAt) : new Date(0)
    const end = exam.endAt ? new Date(exam.endAt) : new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
    
    // Check timing
    if (now < start || now > end) return false
    
    // Check attempts remaining
    if (exam.myAttempts !== null && exam.myAttempts >= exam.maxAttempts) return false
    
    return true
  }

  function getAttemptsRemaining(exam: CandidateExam) {
    const used = exam.myAttempts || 0
    return Math.max(0, exam.maxAttempts - used)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("myExams.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("myExams.subtitle")}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Calendar className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingExams.length}</p>
              <p className="text-sm text-muted-foreground">{t("myExams.upcoming")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <PlayCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeExams.length}</p>
              <p className="text-sm text-muted-foreground">{t("myExams.active")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
              <Award className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{completedExams.length}</p>
              <p className="text-sm text-muted-foreground">{t("myExams.completed")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active exam in progress alert */}
      {activeAttempts.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <PlayCircle className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{t("myExams.activeExam")}</h3>
              <p className="text-sm text-muted-foreground">
                {getLocalizedField(activeAttempts[0], "examTitle", language)}
              </p>
            </div>
            <Button asChild>
              <Link href={`/take-exam/${activeAttempts[0].examId}`}>
                {t("myExams.continue")}
                <ArrowRight className="h-4 w-4 ms-2" />
              </Link>
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
                const timeUntil = getTimeUntil(exam.startAt)

                return (
                  <Card key={exam.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{getLocalizedField(exam, "title", language)}</CardTitle>
                          <CardDescription>{getLocalizedField(exam, "description", language)}</CardDescription>
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
                          <span>{formatDateTime(exam.startAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {exam.durationMinutes} {t("common.minutes")}
                          </span>
                        </div>
                      </div>

                      {/* Exam info */}
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{exam.totalQuestions} {t("common.questions")}</span>
                        <span>-</span>
                        <span>{exam.totalPoints} {t("common.points")}</span>
                        <span>-</span>
                        <span>{t("exams.passScore")}: {exam.passScore}</span>
                      </div>

                      <Button className="w-full" disabled variant="secondary">
                        <Clock className="h-4 w-4 me-2" />
                        {t("myExams.notYetAvailable")}
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
              {activeExams.map((exam) => {
                const canStart = canStartExam(exam)
                const attemptsRemaining = getAttemptsRemaining(exam)

                return (
                  <Card key={exam.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{getLocalizedField(exam, "title", language)}</CardTitle>
                          <CardDescription>{getLocalizedField(exam, "description", language)}</CardDescription>
                        </div>
                        <Badge className="bg-emerald-500 shrink-0">{t("myExams.availableNow")}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {exam.durationMinutes} {t("common.minutes")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Award className="h-4 w-4" />
                          <span>
                            {exam.myAttempts || 0}/{exam.maxAttempts} {t("myExams.attempts")}
                          </span>
                        </div>
                      </div>

                      {/* Exam info */}
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{exam.totalQuestions} {t("common.questions")}</span>
                        <span>-</span>
                        <span>{exam.totalPoints} {t("common.points")}</span>
                        <span>-</span>
                        <span>{t("exams.passScore")}: {exam.passScore}</span>
                      </div>

                      {/* My status if attempted */}
                      {exam.myAttempts !== null && exam.myAttempts > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant={exam.myBestIsPassed ? "default" : "secondary"}>
                            {exam.myBestIsPassed ? t("myExams.passed") : t("myExams.notPassed")}
                          </Badge>
                          <span className="text-muted-foreground">
                            ({exam.myAttempts} {t("myExams.attempts")})
                          </span>
                        </div>
                      )}

                      <Button className="w-full" disabled={!canStart} asChild={canStart}>
                        {canStart ? (
                          <Link href={`/take-exam/${exam.id}/instructions`}>
                            <PlayCircle className="h-4 w-4 me-2" />
                            {t("myExams.startExam")}
                          </Link>
                        ) : (
                          <>
                            <Clock className="h-4 w-4 me-2" />
                            {attemptsRemaining === 0 ? t("myExams.noAttemptsLeft") : t("myExams.notYetAvailable")}
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
                        <CardTitle className="text-lg">{getLocalizedField(exam, "title", language)}</CardTitle>
                        <CardDescription>
                          {exam.myAttempts} {t("myExams.attempts")}
                        </CardDescription>
                      </div>
                      <Badge variant={exam.myBestIsPassed ? "default" : "destructive"}>
                        {exam.myBestIsPassed ? t("myExams.passed") : t("myExams.failed")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span>{exam.totalQuestions} {t("questions.title")}</span>
                      <span>-</span>
                      <span>{exam.totalPoints} {t("common.points")}</span>
                      <span>-</span>
                      <span>{t("exams.passScore")}: {exam.passScore}</span>
                    </div>
                    <Button variant="outline" className="w-full bg-transparent" asChild>
                      <Link href={`/my-results`}>
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
