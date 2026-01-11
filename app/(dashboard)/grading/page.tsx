"use client"

import { useState } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import type { ExamSubmission } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { Search, ClipboardCheck, Clock, User, FileText, ChevronRight } from "lucide-react"

const MOCK_SUBMISSIONS: ExamSubmission[] = [
  {
    id: "sub-1",
    examId: "1",
    examTitle: "Mathematics Final Exam",
    candidateId: "c1",
    candidateName: "Ahmed Hassan",
    candidateEmail: "ahmed@example.com",
    submittedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    autoScore: 75,
    manualQuestionsCount: 5,
    gradedQuestionsCount: 2,
  },
  {
    id: "sub-2",
    examId: "1",
    examTitle: "Mathematics Final Exam",
    candidateId: "c2",
    candidateName: "Sara Ali",
    candidateEmail: "sara@example.com",
    submittedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    autoScore: 82,
    manualQuestionsCount: 5,
    gradedQuestionsCount: 0,
  },
  {
    id: "sub-3",
    examId: "2",
    examTitle: "Physics Midterm",
    candidateId: "c3",
    candidateName: "Mohammed Khalid",
    candidateEmail: "mohammed@example.com",
    submittedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    autoScore: 68,
    manualQuestionsCount: 3,
    gradedQuestionsCount: 3,
  },
  {
    id: "sub-4",
    examId: "4",
    examTitle: "English Literature Quiz",
    candidateId: "c4",
    candidateName: "Fatima Omar",
    candidateEmail: "fatima@example.com",
    submittedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    autoScore: 90,
    manualQuestionsCount: 2,
    gradedQuestionsCount: 1,
  },
]

export default function GradingPage() {
  const { t, dir, language } = useI18n()
  const [submissions] = useState<ExamSubmission[]>(MOCK_SUBMISSIONS)
  const [searchQuery, setSearchQuery] = useState("")
  const [examFilter, setExamFilter] = useState<string>("all")

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString(language === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  function getTimeSince(dateString: string) {
    const diff = Date.now() - new Date(dateString).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return "Just now"
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  const filteredSubmissions = submissions.filter((sub) => {
    const matchesSearch =
      (sub.candidateName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.candidateEmail || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.examTitle || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesExam = examFilter === "all" || sub.examId === examFilter
    return matchesSearch && matchesExam
  })

  const examOptions = [...new Map(submissions.map((s) => [s.examId, s.examTitle])).entries()]

  return (
    <div className="space-y-6 p-6">
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("grading.candidate")}</TableHead>
                    <TableHead>{t("grading.exam")}</TableHead>
                    <TableHead>{t("grading.progress")}</TableHead>
                    <TableHead>{t("grading.autoScore")}</TableHead>
                    <TableHead>{t("grading.waiting")}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSubmissions.map((sub) => {
                    const progress =
                      sub.manualQuestionsCount > 0 ? (sub.gradedQuestionsCount / sub.manualQuestionsCount) * 100 : 100
                    return (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{sub.candidateName}</p>
                              <p className="text-sm text-muted-foreground">{sub.candidateEmail}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{sub.examTitle}</p>
                            <p className="text-sm text-muted-foreground">{formatDateTime(sub.submittedAt)}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5 min-w-[120px]">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                {sub.gradedQuestionsCount}/{sub.manualQuestionsCount}
                              </span>
                              <span className="font-medium">{Math.round(progress)}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            {sub.autoScore}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                            <Clock className="h-4 w-4" />
                            <span>{getTimeSince(sub.submittedAt)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/grading/${sub.id}`}>
                              {t("grading.grade")}
                              <ChevronRight className={`h-4 w-4 ms-1 ${dir === "rtl" ? "rotate-180" : ""}`} />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
