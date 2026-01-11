"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getExam, getExamSections, getExamSchedules, publishExam, archiveExam } from "@/lib/api/exams"
import type { Exam, ExamSection, ExamSchedule } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { StatusBadge } from "@/components/ui/status-badge"
import { toast } from "sonner"
import {
  ArrowLeft,
  Pencil,
  LayoutList,
  Calendar,
  Users,
  Clock,
  Target,
  Shield,
  FileText,
  Send,
  Archive,
  Plus,
  CheckCircle2,
  XCircle,
} from "lucide-react"

export default function ExamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { t, dir } = useI18n()
  const [exam, setExam] = useState<Exam | null>(null)
  const [sections, setSections] = useState<ExamSection[]>([])
  const [schedules, setSchedules] = useState<ExamSchedule[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExamData()
  }, [id])

  async function loadExamData() {
    try {
      setLoading(true)
      const [examData, sectionsData, schedulesData] = await Promise.all([
        getExam(id),
        getExamSections(id),
        getExamSchedules(id),
      ])
      setExam(examData)
      setSections(sectionsData)
      setSchedules(schedulesData)
    } catch (error) {
      toast.error("Failed to load exam")
    } finally {
      setLoading(false)
    }
  }

  async function handlePublish() {
    if (!exam) return
    try {
      await publishExam(exam.id)
      toast.success("Exam published successfully")
      loadExamData()
    } catch (error) {
      toast.error("Failed to publish exam")
    }
  }

  async function handleArchive() {
    if (!exam) return
    try {
      await archiveExam(exam.id)
      toast.success("Exam archived successfully")
      loadExamData()
    } catch (error) {
      toast.error("Failed to archive exam")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Exam not found</p>
      </div>
    )
  }

  const totalQuestions = sections.reduce((acc, s) => acc + (s.questions?.length || 0), 0)
  const totalPoints = sections.reduce(
    (acc, s) => acc + (s.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0),
    0,
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/exams">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{exam.title}</h1>
              <StatusBadge status={exam.status} />
            </div>
            {exam.code && <p className="text-muted-foreground mt-1">{exam.code}</p>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {exam.status === "Draft" && (
            <Button onClick={handlePublish}>
              <Send className="h-4 w-4 me-2" />
              {t("exams.publish")}
            </Button>
          )}
          {exam.status === "Published" && (
            <Button variant="outline" onClick={handleArchive}>
              <Archive className="h-4 w-4 me-2" />
              {t("exams.archive")}
            </Button>
          )}
          <Button variant="outline" asChild>
            <Link href={`/exams/${id}/edit`}>
              <Pencil className="h-4 w-4 me-2" />
              {t("common.edit")}
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/exams/${id}/builder`}>
              <LayoutList className="h-4 w-4 me-2" />
              {t("exams.builder")}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("exams.totalQuestions")}</p>
              <p className="text-2xl font-bold">{totalQuestions}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <Target className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("exams.totalPoints")}</p>
              <p className="text-2xl font-bold">{totalPoints}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <Clock className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("exams.duration")}</p>
              <p className="text-2xl font-bold">{exam.durationMinutes} min</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <Target className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t("exams.passingScore")}</p>
              <p className="text-2xl font-bold">{exam.passingScore}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">{t("common.overview")}</TabsTrigger>
          <TabsTrigger value="sections">{t("exams.sections")}</TabsTrigger>
          <TabsTrigger value="schedules">{t("exams.schedules")}</TabsTrigger>
          <TabsTrigger value="settings">{t("common.settings")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("common.description")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{exam.description || t("exams.noDescription")}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>{t("exams.instructions")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {exam.instructions || t("exams.noInstructions")}
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sections" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("exams.sections")}</h2>
            <Button asChild size="sm">
              <Link href={`/exams/${id}/builder`}>
                <Plus className="h-4 w-4 me-2" />
                {t("exams.addSection")}
              </Link>
            </Button>
          </div>
          {sections.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <LayoutList className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">{t("exams.noSections")}</p>
                <Button className="mt-4" asChild>
                  <Link href={`/exams/${id}/builder`}>{t("exams.addSection")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {sections.map((section, index) => (
                <Card key={section.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{section.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {section.questions?.length || 0} {t("questions.title").toLowerCase()}
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/exams/${id}/builder`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("exams.schedules")}</h2>
            <Button asChild size="sm">
              <Link href={`/exams/${id}/schedules/create`}>
                <Plus className="h-4 w-4 me-2" />
                {t("exams.addSchedule")}
              </Link>
            </Button>
          </div>
          {schedules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">{t("exams.noSchedules")}</p>
                <Button className="mt-4" asChild>
                  <Link href={`/exams/${id}/schedules/create`}>{t("exams.addSchedule")}</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {schedules.map((schedule) => (
                <Card key={schedule.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <Calendar className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">{schedule.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(schedule.startTime).toLocaleString()} -{" "}
                          {new Date(schedule.endTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{schedule.candidateCount}</span>
                      </div>
                      <StatusBadge status={schedule.status} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {t("exams.timingSettings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("exams.duration")}</span>
                  <span className="font-medium">{exam.durationMinutes} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("exams.passingScore")}</span>
                  <span className="font-medium">{exam.passingScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t("exams.maxAttempts")}</span>
                  <span className="font-medium">{exam.maxAttempts || 1}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t("exams.securitySettings")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("exams.requireProctoring")}</span>
                  {exam.requireProctoring ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("exams.requireIdVerification")}</span>
                  {exam.requireIdVerification ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("exams.preventTabSwitching")}</span>
                  {exam.preventTabSwitching ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">{t("exams.shuffleQuestions")}</span>
                  {exam.shuffleQuestions ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
