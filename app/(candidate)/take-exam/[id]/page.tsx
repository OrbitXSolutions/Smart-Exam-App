"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { startExamAttempt, saveAnswer, toggleQuestionFlag, submitExam, reportIncident } from "@/lib/api/exam-session"
import type { ExamAttempt, AnswerSubmission } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
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
import { ChevronLeft, ChevronRight, Flag, Clock, LayoutGrid, Send, AlertTriangle, CheckCircle2 } from "lucide-react"

export default function TakeExamPage() {
  const { id } = useParams<{ id: string }>()
  const { t, dir } = useI18n()
  const router = useRouter()
  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, AnswerSubmission>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    startAttempt()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [id])

  useEffect(() => {
    // Tab visibility detection for proctoring
    function handleVisibilityChange() {
      if (document.hidden && attempt) {
        reportIncident(attempt.id, "TabSwitch", "User switched tabs or minimized window")
        toast.warning(t("exam.tabSwitchWarning"))
      }
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [attempt, t])

  async function startAttempt() {
    try {
      const data = await startExamAttempt(id)
      setAttempt(data)

      // Calculate time remaining
      const expires = new Date(data.expiresAt).getTime()
      const remaining = Math.max(0, Math.floor((expires - Date.now()) / 1000))
      setTimeRemaining(remaining)

      // Start timer
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      toast.error("Failed to start exam")
      router.push("/my-exams")
    } finally {
      setLoading(false)
    }
  }

  const currentSection = attempt?.sections[currentSectionIndex]
  const currentQuestion = currentSection?.questions[currentQuestionIndex]
  const allQuestions = attempt?.sections.flatMap((s) => s.questions) || []
  const totalQuestions = allQuestions.length
  const answeredCount = Object.keys(answers).length
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  function getGlobalQuestionIndex() {
    let index = 0
    for (let i = 0; i < currentSectionIndex; i++) {
      index += attempt!.sections[i].questions.length
    }
    return index + currentQuestionIndex
  }

  function navigateToQuestion(sectionIndex: number, questionIndex: number) {
    setCurrentSectionIndex(sectionIndex)
    setCurrentQuestionIndex(questionIndex)
  }

  function goToNextQuestion() {
    if (!currentSection) return

    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else if (currentSectionIndex < attempt!.sections.length - 1) {
      setCurrentSectionIndex((prev) => prev + 1)
      setCurrentQuestionIndex(0)
    }
  }

  function goToPrevQuestion() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex((prev) => prev - 1)
      const prevSection = attempt!.sections[currentSectionIndex - 1]
      setCurrentQuestionIndex(prevSection.questions.length - 1)
    }
  }

  const handleAnswerChange = useCallback(
    async (questionId: string, answer: AnswerSubmission) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }))
      if (attempt) {
        try {
          await saveAnswer(attempt.id, questionId, answer)
        } catch {
          // Silent fail - answer saved locally
        }
      }
    },
    [attempt],
  )

  const handleToggleFlag = useCallback(
    async (questionId: string) => {
      const newFlagged = new Set(flagged)
      const isFlagged = newFlagged.has(questionId)
      if (isFlagged) {
        newFlagged.delete(questionId)
      } else {
        newFlagged.add(questionId)
      }
      setFlagged(newFlagged)
      if (attempt) {
        try {
          await toggleQuestionFlag(attempt.id, questionId, !isFlagged)
        } catch {
          // Silent fail
        }
      }
    },
    [attempt, flagged],
  )

  async function handleAutoSubmit() {
    if (!attempt) return
    toast.warning(t("exam.timeExpired"))
    await handleSubmit()
  }

  async function handleSubmit() {
    if (!attempt) return
    try {
      setSubmitting(true)
      const result = await submitExam(attempt.id)
      toast.success(t("exam.submitted"))
      router.push(`/results/${id}?submitted=true`)
    } catch (error) {
      toast.error("Failed to submit exam")
    } finally {
      setSubmitting(false)
      setSubmitDialogOpen(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!attempt || !currentSection || !currentQuestion) {
    return null
  }

  const isFirstQuestion = currentSectionIndex === 0 && currentQuestionIndex === 0
  const isLastQuestion =
    currentSectionIndex === attempt.sections.length - 1 && currentQuestionIndex === currentSection.questions.length - 1
  const isWarningTime = timeRemaining < 300 // 5 minutes

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <LayoutGrid className="h-4 w-4" />
                  {t("exam.navigation")}
                </Button>
              </SheetTrigger>
              <SheetContent side={dir === "rtl" ? "right" : "left"} className="w-80">
                <SheetHeader>
                  <SheetTitle>{t("exam.questionNavigation")}</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                  <div className="space-y-4 pe-4">
                    {attempt.sections.map((section, sIndex) => (
                      <div key={section.id}>
                        <p className="text-sm font-medium mb-2">{section.title}</p>
                        <div className="grid grid-cols-5 gap-2">
                          {section.questions.map((q, qIndex) => {
                            const isAnswered = !!answers[q.id]
                            const isFlagged = flagged.has(q.id)
                            const isCurrent = sIndex === currentSectionIndex && qIndex === currentQuestionIndex

                            return (
                              <button
                                type="button"
                                key={q.id}
                                onClick={() => navigateToQuestion(sIndex, qIndex)}
                                className={`h-9 w-9 rounded-md text-sm font-medium transition-colors relative ${
                                  isCurrent
                                    ? "bg-primary text-primary-foreground"
                                    : isAnswered
                                      ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                      : "bg-muted hover:bg-muted/80"
                                }`}
                              >
                                {qIndex + 1}
                                {isFlagged && (
                                  <span className="absolute -top-1 -end-1 h-3 w-3 rounded-full bg-amber-500" />
                                )}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <div className="hidden sm:block">
              <p className="text-sm font-medium">
                {t("exam.question")} {getGlobalQuestionIndex() + 1} / {totalQuestions}
              </p>
              <Progress value={progress} className="w-32 h-1.5 mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                isWarningTime ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-muted"
              }`}
            >
              <Clock className={`h-4 w-4 ${isWarningTime ? "animate-pulse" : ""}`} />
              <span className="font-mono font-medium">{formatTime(timeRemaining)}</span>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setSubmitDialogOpen(true)}>
              <Send className="h-4 w-4 me-2" />
              {t("exam.submit")}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container py-6">
        <div className="max-w-3xl mx-auto">
          {/* Section Header */}
          <div className="mb-4">
            <Badge variant="secondary" className="mb-2">
              {currentSection.title}
            </Badge>
            {currentSection.description && (
              <p className="text-sm text-muted-foreground">{currentSection.description}</p>
            )}
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {currentQuestionIndex + 1}
                  </span>
                  <Badge variant="outline">
                    {currentQuestion.points} {t("exam.points")}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleFlag(currentQuestion.id)}
                  className={flagged.has(currentQuestion.id) ? "text-amber-500" : "text-muted-foreground"}
                >
                  <Flag className={`h-4 w-4 me-1 ${flagged.has(currentQuestion.id) ? "fill-current" : ""}`} />
                  {flagged.has(currentQuestion.id) ? t("exam.flagged") : t("exam.flag")}
                </Button>
              </div>

              <div className="prose dark:prose-invert max-w-none mb-6">
                <p className="text-lg">{currentQuestion.body}</p>
              </div>

              {/* Answer Input based on question type */}
              <div className="space-y-3">
                {(currentQuestion.type === "MultipleChoice" || currentQuestion.type === "TrueFalse") && (
                  <RadioGroup
                    value={answers[currentQuestion.id]?.selectedOptionId || ""}
                    onValueChange={(value) => handleAnswerChange(currentQuestion.id, { selectedOptionId: value })}
                  >
                    {currentQuestion.options?.map((option) => (
                      <div
                        key={option.id}
                        className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <RadioGroupItem value={option.id} id={option.id} />
                        <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                          {option.text}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === "MultiSelect" && (
                  <div className="space-y-2">
                    {currentQuestion.options?.map((option) => {
                      const selectedIds = answers[currentQuestion.id]?.selectedOptionIds || []
                      const isChecked = selectedIds.includes(option.id)

                      return (
                        <div
                          key={option.id}
                          className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={option.id}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const newIds = checked
                                ? [...selectedIds, option.id]
                                : selectedIds.filter((id) => id !== option.id)
                              handleAnswerChange(currentQuestion.id, { selectedOptionIds: newIds })
                            }}
                          />
                          <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                            {option.text}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                )}

                {(currentQuestion.type === "ShortAnswer" || currentQuestion.type === "Essay") && (
                  <Textarea
                    placeholder={t("exam.typeAnswer")}
                    value={answers[currentQuestion.id]?.textAnswer || ""}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, { textAnswer: e.target.value })}
                    rows={currentQuestion.type === "Essay" ? 8 : 4}
                    className="resize-none"
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={goToPrevQuestion} disabled={isFirstQuestion}>
              <ChevronLeft className="h-4 w-4 me-1" />
              {t("exam.previous")}
            </Button>
            {isLastQuestion ? (
              <Button onClick={() => setSubmitDialogOpen(true)}>
                <Send className="h-4 w-4 me-2" />
                {t("exam.submitExam")}
              </Button>
            ) : (
              <Button onClick={goToNextQuestion}>
                {t("exam.next")}
                <ChevronRight className="h-4 w-4 ms-1" />
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t("exam.confirmSubmit")}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>{t("exam.confirmSubmitDesc")}</p>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span>{t("exam.answered")}</span>
                  <span className="font-medium">
                    {answeredCount} / {totalQuestions}
                  </span>
                </div>
                {flagged.size > 0 && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-600">
                    <Flag className="h-4 w-4" />
                    <span>{t("exam.flaggedQuestions", { count: flagged.size })}</span>
                  </div>
                )}
                {answeredCount < totalQuestions && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span>{t("exam.unansweredWarning", { count: totalQuestions - answeredCount })}</span>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitting} className="bg-primary">
              {submitting ? <LoadingSpinner size="sm" className="me-2" /> : <CheckCircle2 className="h-4 w-4 me-2" />}
              {t("exam.confirmAndSubmit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
