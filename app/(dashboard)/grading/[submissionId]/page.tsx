"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getSubmissionForGrading, submitManualGrade, finalizeGrading } from "@/lib/api/grading"
import type { GradingResult, GradingQuestion } from "@/lib/types/grading"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import { ArrowLeft, CheckCircle2, Clock, User, Save, Send, FileText, ChevronLeft, ChevronRight } from "lucide-react"

interface GradeState {
  points: number
  feedback: string
  saved: boolean
}

export default function GradeSubmissionPage() {
  const { submissionId } = useParams<{ submissionId: string }>()
  const router = useRouter()
  const { t, dir, locale } = useI18n()

  const [result, setResult] = useState<GradingResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [finalizing, setFinalizing] = useState(false)
  const [finalizeDialogOpen, setFinalizeDialogOpen] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [grades, setGrades] = useState<Map<string, GradeState>>(new Map())

  useEffect(() => {
    loadSubmission()
  }, [submissionId])

  async function loadSubmission() {
    try {
      setLoading(true)
      const data = await getSubmissionForGrading(submissionId)
      setResult(data)

      // Initialize grades from existing data
      const initialGrades = new Map<string, GradeState>()
      data.sections.forEach((section) => {
        section.questions.forEach((q) => {
          if (q.needsManualGrading) {
            initialGrades.set(q.id, {
              points: q.earnedPoints ?? 0,
              feedback: q.feedback || "",
              saved: q.earnedPoints !== null,
            })
          }
        })
      })
      setGrades(initialGrades)
    } catch (error) {
      toast.error("Failed to load submission")
    } finally {
      setLoading(false)
    }
  }

  const manualQuestions: GradingQuestion[] =
    result?.sections.flatMap((s) => s.questions.filter((q) => q.needsManualGrading)) || []
  const currentQuestion = manualQuestions[currentQuestionIndex]
  const currentGrade = currentQuestion ? grades.get(currentQuestion.id) : null

  function updateGrade(questionId: string, updates: Partial<GradeState>) {
    setGrades((prev) => {
      const current = prev.get(questionId) || { points: 0, feedback: "", saved: false }
      return new Map(prev).set(questionId, { ...current, ...updates, saved: false })
    })
  }

  async function handleSaveGrade() {
    if (!currentQuestion || !currentGrade) return

    try {
      setSaving(true)
      await submitManualGrade(submissionId, currentQuestion.id, {
        points: currentGrade.points,
        feedback: currentGrade.feedback,
      })
      setGrades((prev) => new Map(prev).set(currentQuestion.id, { ...currentGrade, saved: true }))
      toast.success(t("grading.gradeSaved"))
    } catch (error) {
      toast.error("Failed to save grade")
    } finally {
      setSaving(false)
    }
  }

  async function handleFinalize() {
    try {
      setFinalizing(true)
      const finalResult = await finalizeGrading(submissionId)
      toast.success(t("grading.finalized", { score: finalResult.finalScore }))
      router.push("/grading")
    } catch (error) {
      toast.error("Failed to finalize grading")
    } finally {
      setFinalizing(false)
      setFinalizeDialogOpen(false)
    }
  }

  const allGraded = manualQuestions.every((q) => grades.get(q.id)?.saved)
  const gradedCount = manualQuestions.filter((q) => grades.get(q.id)?.saved).length
  const progress = manualQuestions.length > 0 ? (gradedCount / manualQuestions.length) * 100 : 100

  function formatDateTime(dateString: string) {
    return new Date(dateString).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    })
  }

  if (loading || !result) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/grading">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("grading.gradeSubmission")}</h1>
            <p className="text-muted-foreground mt-1">{result.examTitle}</p>
          </div>
        </div>
        <Button onClick={() => setFinalizeDialogOpen(true)} disabled={!allGraded}>
          <Send className="h-4 w-4 me-2" />
          {t("grading.finalizeGrading")}
        </Button>
      </div>

      {/* Candidate Info & Progress */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold">{result.candidateName}</p>
              <p className="text-sm text-muted-foreground">{result.candidateEmail}</p>
            </div>
            <div className="text-end">
              <p className="text-sm text-muted-foreground">{t("grading.submittedAt")}</p>
              <p className="font-medium">{formatDateTime(result.submittedAt)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t("grading.gradingProgress")}</span>
              <span className="font-medium">
                {gradedCount}/{manualQuestions.length}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("grading.autoScore")}</span>
              <Badge variant="secondary">{result.autoScore}%</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grading Interface */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Question Navigator */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t("grading.questionsToGrade")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[400px]">
              <div className="p-4 space-y-2">
                {manualQuestions.map((q, idx) => {
                  const grade = grades.get(q.id)
                  const isCurrent = idx === currentQuestionIndex
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-start transition-colors ${
                        isCurrent ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                          grade?.saved
                            ? isCurrent
                              ? "bg-primary-foreground/20"
                              : "bg-emerald-500/10 text-emerald-600"
                            : isCurrent
                              ? "bg-primary-foreground/20"
                              : "bg-muted"
                        }`}
                      >
                        {grade?.saved ? <CheckCircle2 className="h-4 w-4" /> : idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{q.type}</p>
                        <p className={`text-xs ${isCurrent ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {q.points} {t("exam.points")}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Current Question */}
        <Card className="lg:col-span-3">
          {currentQuestion && currentGrade && (
            <>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2">
                      {currentQuestion.type}
                    </Badge>
                    <CardTitle className="text-lg">
                      {t("grading.question")} {currentQuestionIndex + 1}
                    </CardTitle>
                    <CardDescription>
                      {t("grading.maxPoints")}: {currentQuestion.points}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentQuestionIndex((p) => Math.max(0, p - 1))}
                      disabled={currentQuestionIndex === 0}
                    >
                      {dir === "rtl" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setCurrentQuestionIndex((p) => Math.min(manualQuestions.length - 1, p + 1))}
                      disabled={currentQuestionIndex === manualQuestions.length - 1}
                    >
                      {dir === "rtl" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Question */}
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="font-medium">{currentQuestion.body}</p>
                </div>

                {/* Candidate Answer */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {t("grading.candidateAnswer")}
                  </Label>
                  <div className="p-4 rounded-lg border bg-background min-h-[120px] whitespace-pre-wrap">
                    {currentQuestion.candidateAnswer.textAnswer || (
                      <span className="text-muted-foreground italic">{t("grading.noAnswer")}</span>
                    )}
                  </div>
                </div>

                {/* Rubric */}
                {currentQuestion.rubric && (
                  <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm font-medium text-amber-600 mb-1">{t("grading.rubric")}</p>
                    <p className="text-sm text-amber-700">{currentQuestion.rubric}</p>
                  </div>
                )}

                {/* Grading Controls */}
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>{t("grading.awardPoints")}</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={0}
                          max={currentQuestion.points}
                          value={currentGrade.points}
                          onChange={(e) =>
                            updateGrade(currentQuestion.id, {
                              points: Math.min(currentQuestion.points, Math.max(0, Number(e.target.value))),
                            })
                          }
                          className="w-20 text-center"
                        />
                        <span className="text-muted-foreground">/ {currentQuestion.points}</span>
                      </div>
                    </div>
                    <Slider
                      value={[currentGrade.points]}
                      max={currentQuestion.points}
                      step={1}
                      onValueChange={([value]) => updateGrade(currentQuestion.id, { points: value })}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>0</span>
                      <span>{currentQuestion.points}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t("grading.feedback")}</Label>
                    <Textarea
                      value={currentGrade.feedback}
                      onChange={(e) => updateGrade(currentQuestion.id, { feedback: e.target.value })}
                      placeholder={t("grading.feedbackPlaceholder")}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    {currentGrade.saved ? (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">{t("grading.saved")}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="text-sm">{t("grading.unsaved")}</span>
                      </div>
                    )}
                    <Button onClick={handleSaveGrade} disabled={saving || currentGrade.saved}>
                      <Save className="h-4 w-4 me-2" />
                      {saving ? t("common.saving") : t("grading.saveGrade")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>

      {/* Finalize Dialog */}
      <AlertDialog open={finalizeDialogOpen} onOpenChange={setFinalizeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("grading.finalizeTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{t("grading.finalizeDesc")}</p>
              <div className="p-3 rounded-lg bg-muted text-sm space-y-1">
                <div className="flex justify-between">
                  <span>{t("grading.autoScore")}</span>
                  <span className="font-medium">{result.autoScore}%</span>
                </div>
                <div className="flex justify-between">
                  <span>{t("grading.manualPoints")}</span>
                  <span className="font-medium">
                    {Array.from(grades.values()).reduce((acc, g) => acc + g.points, 0)} /{" "}
                    {manualQuestions.reduce((acc, q) => acc + q.points, 0)}
                  </span>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={finalizing}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleFinalize} disabled={finalizing}>
              {finalizing ? <LoadingSpinner size="sm" className="me-2" /> : <Send className="h-4 w-4 me-2" />}
              {t("grading.finalize")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
