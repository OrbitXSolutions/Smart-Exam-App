"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getSubmissionsPendingGrading } from "@/lib/api/grading"
import type { ExamSubmission } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DataTable, type Column } from "@/components/ui/data-table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { toast } from "sonner"
import { Search, ClipboardCheck, Clock, User, FileText, ChevronRight } from "lucide-react"

export default function GradingPage() {
  const { t, dir, locale } = useI18n()
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [examFilter, setExamFilter] = useState<string>("all")

  useEffect(() => {
    loadSubmissions()
  }, [])

  async function loadSubmissions() {
    try {
      setLoading(true)
      const result = await getSubmissionsPendingGrading()
      setSubmissions(result.items)
    } catch (error) {
      toast.error("Failed to load submissions")
    } finally {
      setLoading(false)
    }
  }

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  function getTimeSince(dateString: string) {
    const diff = Date.now() - new Date(dateString).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return t("grading.justNow")
    if (hours < 24) return t("grading.hoursAgo", { hours })
    const days = Math.floor(hours / 24)
    return t("grading.daysAgo", { days })
  }

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      sub.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.examTitle.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesExam = examFilter === "all" || sub.examId === examFilter
    return matchesSearch && matchesExam
  })

  const examOptions = [...new Map(submissions.map((s) => [s.examId, s.examTitle])).entries()]

  const columns: Column<ExamSubmission>[] = [
    {
      key: "candidate",
      header: t("grading.candidate"),
      render: (sub) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="font-medium">{sub.candidateName}</p>
            <p className="text-sm text-muted-foreground">{sub.candidateEmail}</p>
          </div>
        </div>
      ),
    },
    {
      key: "exam",
      header: t("grading.exam"),
      render: (sub) => (
        <div>
          <p className="font-medium">{sub.examTitle}</p>
          <p className="text-sm text-muted-foreground">{formatDateTime(sub.submittedAt)}</p>
        </div>
      ),
    },
    {
      key: "progress",
      header: t("grading.progress"),
      render: (sub) => {
        const progress =
          sub.manualQuestionsCount > 0 ? (sub.gradedQuestionsCount / sub.manualQuestionsCount) * 100 : 100
        return (
          <div className="space-y-1.5 min-w-[120px]">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {sub.gradedQuestionsCount}/{sub.manualQuestionsCount}
              </span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )
      },
    },
    {
      key: "autoScore",
      header: t("grading.autoScore"),
      render: (sub) => (
        <Badge variant="secondary" className="font-mono">
          {sub.autoScore}%
        </Badge>
      ),
    },
    {
      key: "waiting",
      header: t("grading.waiting"),
      render: (sub) => (
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
          <Clock className="h-4 w-4" />
          <span>{getTimeSince(sub.submittedAt)}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (sub) => (
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/grading/${sub.id}`}>
            {t("grading.grade")}
            <ChevronRight className={`h-4 w-4 ms-1 ${dir === "rtl" ? "rotate-180" : ""}`} />
          </Link>
        </Button>
      ),
    },
  ]

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
        <h1 className="text-2xl font-bold text-foreground">{t("grading.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("grading.subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-500/10">
              <ClipboardCheck className="h-6 w-6 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{submissions.length}</p>
              <p className="text-sm text-muted-foreground">{t("grading.pendingGrading")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10">
              <FileText className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {submissions.reduce((acc, s) => acc + (s.manualQuestionsCount - s.gradedQuestionsCount), 0)}
              </p>
              <p className="text-sm text-muted-foreground">{t("grading.questionsToGrade")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{examOptions.length}</p>
              <p className="text-sm text-muted-foreground">{t("grading.examsWithPending")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("grading.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={examFilter} onValueChange={setExamFilter}>
              <SelectTrigger className="w-full sm:w-[220px]">
                <SelectValue placeholder={t("grading.filterByExam")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {examOptions.map(([id, title]) => (
                  <SelectItem key={id} value={id}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredSubmissions.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title={t("grading.noSubmissions")}
              description={t("grading.noSubmissionsDesc")}
            />
          ) : (
            <DataTable columns={columns} data={filteredSubmissions} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
