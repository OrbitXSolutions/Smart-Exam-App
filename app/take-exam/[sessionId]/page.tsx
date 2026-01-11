"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { startExamAttempt, saveAnswer, toggleQuestionFlag, submitExam, reportIncident } from "@/lib/api/exam-session"
import type { ExamAttempt, AnswerSubmission } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import {
  Clock,
  Flag,
  ChevronLeft,
  ChevronRight,
  Send,
  Grid3X3,
  AlertTriangle,
  CheckCircle2,
  Circle,
} from "lucide-react"

interface QuestionAnswer {
  questionId: string
  selectedOptionIds?: string[]
  textAnswer?: string
}

export default function TakeExamPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const { t, dir } = useI18n()

  const [attempt, setAttempt] = useState<ExamAttempt | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, QuestionAnswer>>(new Map())
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set())
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [navigationOpen, setNavigationOpen] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    startExam()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (autoSaveRef.current) clearInterval(autoSaveRef.current)
    }
  }, [sessionId])

  async function startExam() {
    try {
      setLoading(true)
      const data = await startExamAttempt(sessionId)
      setAttempt(data)

      // Calculate initial time remaining
      const expiresAt = new Date(data.expiresAt).getTime()
      const now = Date.now()
      setTimeRemaining(Math.max(0, Math.floor((expiresAt - now) / 1000)))

      // Start timer
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      // Setup tab visibility detection for proctoring
      document.addEventListener("visibilitychange", handleVisibilityChange)
    } catch (error) {
      toast.error("Failed to start exam")
      router.push("/my-exams")
    } finally {
      setLoading(false)
    }
  }

  function handleVisibilityChange() {
    if (document.hidden && attempt) {
      reportIncident(attempt.id, "TabSwitch", "Candidate switched to another tab")
      toast.warning(t("exam.tabSwitchWarning"))
    }
  }

  async function handleAutoSubmit() {
    if (attempt) {
      toast.info(t("exam.timeExpired"))
      await handleSubmit()
    }
  }

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    }
    return `${minutes}:${String(secs).padStart(2, "0")}`
  }

  const currentSection = attempt?.sections[currentSectionIndex]
  const currentQuestion = currentSection?.questions[currentQuestionIndex]
  const totalQuestions = attempt?.totalQuestions || 0
  const flatQuestionIndex =
    attempt?.sections.slice(0, currentSectionIndex).reduce((acc, s) => acc + s.questions.length, 0) +
    currentQuestionIndex

  function getCurrentAnswer(): QuestionAnswer | undefined {
    if (!currentQuestion) return undefined
    return answers.get(currentQuestion.id)
  }

  async function handleAnswerChange(answer: QuestionAnswer) {
    if (!currentQuestion || !attempt) return

    setAnswers((prev) => new Map(prev).set(currentQuestion.id, answer))

    // Save answer to server
    const submission: AnswerSubmission = {
      questionId: currentQuestion.questionId,
      selectedOptionIds: answer.selectedOptionIds,
      textAnswer: answer.textAnswer,
    }

    try {
      await saveAnswer(attempt.id, currentQuestion.id, submission)
    } catch (error) {
      console.error("Failed to save answer:", error)
    }
  }

  async function handleToggleFlag() {
    if (!currentQuestion || !attempt) return

    const newFlagged = !flaggedQuestions.has(currentQuestion.id)
    setFlaggedQuestions((prev) => {
      const next = new Set(prev)
      if (newFlagged) {
        next.add(currentQuestion.id)
      } else {
        next.delete(currentQuestion.id)
      }
      return next
    })

    try {
      await toggleQuestionFlag(attempt.id, currentQuestion.id, newFlagged)
    } catch (error) {
      console.error("Failed to toggle flag:", error)
    }
  }

  function navigateToQuestion(sectionIdx: number, questionIdx: number) {
    setCurrentSectionIndex(sectionIdx)
    setCurrentQuestionIndex(questionIdx)
    setNavigationOpen(false)
  }

  function goToPrevious() {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    } else if (currentSectionIndex > 0) {
      const prevSection = attempt?.sections[currentSectionIndex - 1]
      setCurrentSectionIndex(currentSectionIndex - 1)
      setCurrentQuestionIndex((prevSection?.questions.length || 1) - 1)
    }
  }

  function goToNext() {
    if (!currentSection) return

    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else if (attempt && currentSectionIndex < attempt.sections.length - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1)
      setCurrentQuestionIndex(0)
    }
  }

  const canGoPrevious = currentSectionIndex > 0 || currentQuestionIndex > 0
  const canGoNext =
    attempt &&
    (currentSectionIndex < attempt.sections.length - 1 ||
      (currentSection && currentQuestionIndex < currentSection.questions.length - 1))

  async function handleSubmit() {
    if (!attempt) return

    try {
      setSubmitting(true)
      const result = await submitExam(attempt.id)

      // Cleanup
      if (timerRef.current) clearInterval(timerRef.current)
      document.removeEventListener("visibilitychange", handleVisibilityChange)

      toast.success(t("exam.submitted"))
      router.push(`/results/${sessionId}`)
    } catch (error) {
      toast.error("Failed to submit exam")
    } finally {
      setSubmitting(false)
      setSubmitDialogOpen(false)
    }
  }

  const answeredCount = answers.size
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  if (loading || !attempt) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">{t("exam.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <Grid3X3 className="h-4 w-4 me-2" />
                  {t("exam.navigation")}
                </Button>
              </SheetTrigger>
              <SheetContent side={dir === "rtl" ? "right" : "left"} className="w-80">
                <SheetHeader>
                  <SheetTitle>{t("exam.questionNavigation")}</SheetTitle>
                  <SheetDescription>
                    {answeredCount}/{totalQuestions} {t("exam.answered")}
                  </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-180px)] mt-4">
                  <div className="space-y-4 pe-4">
                    {attempt.sections.map((section, sIdx) => (
                      <div key={section.id}>
                        <p className="text-sm font-medium text-muted-foreground mb-2">{section.title}</p>
                        <div className="grid grid-cols-5 gap-2">
                          {section.questions.map((q, qIdx) => {
                            const isAnswered = answers.has(q.id)
                            const isFlagged = flaggedQuestions.has(q.id)
                            const isCurrent = sIdx === currentSectionIndex && qIdx === currentQuestionIndex

                            return (
                              <Button
                                key={q.id}
                                variant={isCurrent ? "default" : "outline"}
                                size="sm"
                                className={`h-10 w-10 p-0 relative ${
                                  isAnswered && !isCurrent
                                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
                                    : ""
                                }`}
                                onClick={() => navigateToQuestion(sIdx, qIdx)}
                              >
                                {qIdx + 1}
                                {isFlagged && (
                                  <Flag className="absolute -top-1 -end-1 h-3 w-3 text-amber-500 fill-amber-500" />
                                )}
                              </Button>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded border bg-emerald-500/10 border-emerald-500/30" />
                      <span>{t("exam.answered")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flag className="h-4 w-4 text-amber-500 fill-amber-500" />
                      <span>{t("exam.flagged")}</span>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div className="hidden sm:block">
              <p className="text-sm font-medium">{currentSection?.title}</p>
              <p className="text-xs text-muted-foreground">
                {t("exam.question")} {flatQuestionIndex + 1} {t("common.of")} {totalQuestions}
              </p>
            </div>
          </div>

          {/* Timer */}
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeRemaining < 300 ? "bg-destructive/10 text-destructive" : "bg-muted"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span className="font-mono font-bold text-lg">{formatTime(timeRemaining)}</span>
          </div>

          {/* Submit Button */}
          <Button variant="default" onClick={() => setSubmitDialogOpen(true)}>
            <Send className="h-4 w-4 me-2" />
            {t("exam.submit")}
          </Button>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="h-1 rounded-none" />
      </header>

      {/* Main Content */}
      <main className="flex-1 container max-w-4xl py-6 px-4">
        {currentQuestion && (
          <Card className="shadow-lg">
            <CardContent className="p-6">
              {/* Question Header */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary">
                    {currentQuestion.points} {t("exam.points")}
                  </Badge>
                  <Badge variant="outline">{currentQuestion.type}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleFlag}
                  className={flaggedQuestions.has(currentQuestion.id) ? "text-amber-500" : ""}
                >
                  <Flag className={`h-4 w-4 me-2 ${flaggedQuestions.has(currentQuestion.id) ? "fill-current" : ""}`} />
                  {flaggedQuestions.has(currentQuestion.id) ? t("exam.unflag") : t("exam.flag")}
                </Button>
              </div>

              {/* Question Body */}
              <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
                <p className="text-lg font-medium">{currentQuestion.body}</p>
              </div>

              {/* Answer Options */}
              <div className="space-y-4">
                {currentQuestion.type === "MultipleChoice" && currentQuestion.options && (
                  <RadioGroup
                    value={getCurrentAnswer()?.selectedOptionIds?.[0] || ""}
                    onValueChange={(value) => {
                      handleAnswerChange({
                        questionId: currentQuestion.questionId,
                        selectedOptionIds: [value],
                      })
                    }}
                    className="space-y-3"
                  >
                    {currentQuestion.options.map((option) => (
                      <Label
                        key={option.id}
                        htmlFor={option.id}
                        className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                          getCurrentAnswer()?.selectedOptionIds?.includes(option.id)
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                      >
                        <RadioGroupItem value={option.id} id={option.id} />
                        <span>{option.text}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}

                {currentQuestion.type === "MultiSelect" && currentQuestion.options && (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => {
                      const isSelected = getCurrentAnswer()?.selectedOptionIds?.includes(option.id)
                      return (
                        <Label
                          key={option.id}
                          htmlFor={option.id}
                          className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                            isSelected ? "border-primary bg-primary/5" : "border-border"
                          }`}
                        >
                          <Checkbox
                            id={option.id}
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              const current = getCurrentAnswer()?.selectedOptionIds || []
                              const newSelection = checked
                                ? [...current, option.id]
                                : current.filter((id) => id !== option.id)
                              handleAnswerChange({
                                questionId: currentQuestion.questionId,
                                selectedOptionIds: newSelection,
                              })
                            }}
                          />
                          <span>{option.text}</span>
                        </Label>
                      )
                    })}
                  </div>
                )}

                {currentQuestion.type === "TrueFalse" && currentQuestion.options && (
                  <RadioGroup
                    value={getCurrentAnswer()?.selectedOptionIds?.[0] || ""}
                    onValueChange={(value) => {
                      handleAnswerChange({
                        questionId: currentQuestion.questionId,
                        selectedOptionIds: [value],
                      })
                    }}
                    className="flex gap-4"
                  >
                    {currentQuestion.options.map((option) => (
                      <Label
                        key={option.id}
                        htmlFor={option.id}
                        className={`flex-1 flex items-center justify-center gap-3 p-6 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                          getCurrentAnswer()?.selectedOptionIds?.includes(option.id)
                            ? "border-primary bg-primary/5"
                            : "border-border"
                        }`}
                      >
                        <RadioGroupItem value={option.id} id={option.id} />
                        <span className="font-medium">{option.text}</span>
                      </Label>
                    ))}
                  </RadioGroup>
                )}

                {(currentQuestion.type === "ShortAnswer" || currentQuestion.type === "Essay") && (
                  <Textarea
                    value={getCurrentAnswer()?.textAnswer || ""}
                    onChange={(e) => {
                      handleAnswerChange({
                        questionId: currentQuestion.questionId,
                        textAnswer: e.target.value,
                      })
                    }}
                    placeholder={t("exam.typeAnswer")}
                    rows={currentQuestion.type === "Essay" ? 10 : 4}
                    className="resize-none"
                  />
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer Navigation */}
      <footer className="sticky bottom-0 bg-background border-t py-4 px-4">
        <div className="container max-w-4xl flex items-center justify-between">
          <Button variant="outline" onClick={goToPrevious} disabled={!canGoPrevious}>
            {dir === "rtl" ? <ChevronRight className="h-4 w-4 me-2" /> : <ChevronLeft className="h-4 w-4 me-2" />}
            {t("common.previous")}
          </Button>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>
              {answeredCount}/{totalQuestions}
            </span>
            {flaggedQuestions.size > 0 && (
              <>
                <span className="mx-2">•</span>
                <Flag className="h-4 w-4 text-amber-500" />
                <span>{flaggedQuestions.size}</span>
              </>
            )}
          </div>

          <Button variant="outline" onClick={goToNext} disabled={!canGoNext}>
            {t("common.next")}
            {dir === "rtl" ? <ChevronLeft className="h-4 w-4 ms-2" /> : <ChevronRight className="h-4 w-4 ms-2" />}
          </Button>
        </div>
      </footer>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={submitDialogOpen} onOpenChange={setSubmitDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              {t("exam.confirmSubmit")}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>{t("exam.confirmSubmitDesc")}</p>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-muted text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <span>
                    {answeredCount}/{totalQuestions} {t("exam.answered")}
                  </span>
                </div>
                {totalQuestions - answeredCount > 0 && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <Circle className="h-4 w-4" />
                    <span>
                      {totalQuestions - answeredCount} {t("exam.unanswered")}
                    </span>
                  </div>
                )}
              </div>
              {flaggedQuestions.size > 0 && (
                <p className="text-amber-600 text-sm">{t("exam.flaggedWarning", { count: flaggedQuestions.size })}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit} disabled={submitting} className="bg-primary">
              {submitting ? <LoadingSpinner size="sm" className="me-2" /> : <Send className="h-4 w-4 me-2" />}
              {t("exam.submitFinal")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
