"use client"

import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import {
  getAttemptSession,
  saveAnswer,
  submitAttempt,
  type AttemptSession,
  type SaveAnswerRequest,
  type ExamSection,
  type ExamTopic,
  type AttemptQuestionDto,
  logAttemptEvent,
  AttemptEventType,
  getAttemptTimer,
} from "@/lib/api/candidate"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
import { 
  ChevronLeft, ChevronRight, Flag, Clock, LayoutGrid, Send, AlertTriangle, 
  CheckCircle2, ChevronDown, BookOpen, Timer 
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

// Question type constants for matching both ID and name
const QUESTION_TYPES = {
  MCQ_SINGLE: { id: 1, names: ["MCQ_Single", "MCQ Single Choice", "SingleChoice", "Multiple Choice"] },
  MCQ_MULTI: { id: 2, names: ["MCQ_Multi", "MCQ Multiple Choice", "MCQ_Multiple", "MultipleChoice", "Multiple Select"] },
  TRUE_FALSE: { id: 3, names: ["TrueFalse", "True_False", "True/False"] },
  SHORT_ANSWER: { id: 4, names: ["ShortAnswer", "Short_Answer", "Short Answer"] },
  ESSAY: { id: 5, names: ["Essay"] },
  NUMERIC: { id: 6, names: ["Numeric"] },
}

// Helper function to detect question type from ID or name
function getQuestionType(questionTypeId: number, questionTypeName: string): keyof typeof QUESTION_TYPES {
  // First try by ID
  for (const [key, value] of Object.entries(QUESTION_TYPES)) {
    if (value.id === questionTypeId) return key as keyof typeof QUESTION_TYPES
  }
  // Then try by name
  for (const [key, value] of Object.entries(QUESTION_TYPES)) {
    if (value.names.some(n => n.toLowerCase() === questionTypeName?.toLowerCase())) {
      return key as keyof typeof QUESTION_TYPES
    }
  }
  // Default fallback
  return "MCQ_SINGLE"
}

// Helper function to get question type display name
function getQuestionTypeDisplayName(questionTypeId: number, questionTypeName: string): string {
  const typeDisplayNames: Record<string, string> = {
    MCQ_SINGLE: "Multiple Choice",
    MCQ_MULTI: "Multiple Select",
    TRUE_FALSE: "True/False",
    SHORT_ANSWER: "Short Answer",
    ESSAY: "Essay",
    NUMERIC: "Numeric",
  }
  const type = getQuestionType(questionTypeId, questionTypeName)
  return typeDisplayNames[type] || questionTypeName
}

export default function TakeExamPage() {
  const { id } = useParams<{ id: string }>()
  const { t, dir, language } = useI18n()
  const router = useRouter()
  
  // Core state
  const [session, setSession] = useState<AttemptSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [answers, setAnswers] = useState<Record<number, SaveAnswerRequest>>({})
  const [flagged, setFlagged] = useState<Set<number>>(new Set())
  
  // Section/question navigation state
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  
  // Timer state
  const [examTimeRemaining, setExamTimeRemaining] = useState(0)
  const [sectionTimers, setSectionTimers] = useState<Record<number, number>>({})
  
  // UI state
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [savingAnswer, setSavingAnswer] = useState(false)
  const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set())
  
  // Refs
  const timerRef = useRef<NodeJS.Timeout>()
  const syncTimerRef = useRef<NodeJS.Timeout>()

  // Computed values
  const sections = useMemo(() => session?.sections || [], [session])
  const hasSections = sections.length > 0
  const currentSection = hasSections ? sections[currentSectionIndex] : null
  
  // Get all questions for current section (including topic questions)
  const currentSectionQuestions = useMemo(() => {
    if (!currentSection) {
      // Fallback to flat questions list if no sections
      return session?.questions || []
    }
    
    const questions: AttemptQuestionDto[] = []
    
    // Add questions from topics
    for (const topic of currentSection.topics || []) {
      questions.push(...(topic.questions || []))
    }
    
    // Add section-level questions (not in any topic)
    questions.push(...(currentSection.questions || []))
    
    // Sort by order
    return questions.sort((a, b) => a.order - b.order)
  }, [currentSection, session])
  
  const currentQuestion = currentSectionQuestions[currentQuestionIndex]
  const totalQuestions = session?.totalQuestions || 0
  const answeredCount = Object.keys(answers).length
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  // Check if can navigate to previous section
  const canNavigateToPreviousSection = useCallback((sectionIndex: number) => {
    if (!session?.examSettings) return sectionIndex > 0
    
    // If exam prevents back navigation entirely
    if (session.examSettings.preventBackNavigation) return false
    
    // If lock previous sections is enabled
    if (session.examSettings.lockPreviousSections && sectionIndex > 0) {
      const previousSection = sections[sectionIndex - 1]
      // Check if previous section's time has expired
      if (previousSection?.sectionExpiresAtUtc) {
        return new Date() < new Date(previousSection.sectionExpiresAtUtc)
      }
    }
    
    return sectionIndex > 0
  }, [session, sections])

  // Check if can navigate to previous question
  const canNavigateToPreviousQuestion = useCallback(() => {
    if (!session?.examSettings) return currentQuestionIndex > 0
    
    // If exam prevents back navigation entirely
    if (session.examSettings.preventBackNavigation) return false
    
    return currentQuestionIndex > 0
  }, [session, currentQuestionIndex])

  useEffect(() => {
    initializeExam()
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (syncTimerRef.current) clearInterval(syncTimerRef.current)
    }
  }, [id])

  useEffect(() => {
    if (!session) return

    // Request fullscreen mode
    async function enterFullscreen() {
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen()
        }
      } catch (error) {
        console.log("[v0] Fullscreen request failed:", error)
      }
    }

    // Monitor fullscreen changes
    function handleFullscreenChange() {
      if (!document.fullscreenElement && session) {
        logAttemptEvent(session.attemptId, {
          eventType: AttemptEventType.FullscreenExit,
          metadataJson: JSON.stringify({ timestamp: new Date().toISOString() }),
        }).catch(() => {})
        toast.warning(t("exam.tabSwitchWarning"))
      }
    }

    // Tab visibility detection
    function handleVisibilityChange() {
      if (document.hidden && session) {
        logAttemptEvent(session.attemptId, {
          eventType: AttemptEventType.TabSwitch,
          metadataJson: JSON.stringify({ timestamp: new Date().toISOString() }),
        }).catch(() => {})
        toast.warning(t("exam.tabSwitchWarning"))
      }
    }

    // Copy/paste prevention
    function handleCopy(e: ClipboardEvent) {
      if (session) {
        e.preventDefault()
        logAttemptEvent(session.attemptId, {
          eventType: AttemptEventType.CopyAttempt,
          metadataJson: JSON.stringify({ blocked: true }),
        }).catch(() => {})
        toast.warning(t("exam.copyPasteBlocked"))
      }
    }

    function handlePaste(e: ClipboardEvent) {
      if (session) {
        e.preventDefault()
        logAttemptEvent(session.attemptId, {
          eventType: AttemptEventType.PasteAttempt,
          metadataJson: JSON.stringify({ blocked: true }),
        }).catch(() => {})
        toast.warning(t("exam.copyPasteBlocked"))
      }
    }

    enterFullscreen()

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("copy", handleCopy)
    document.addEventListener("paste", handlePaste)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("copy", handleCopy)
      document.removeEventListener("paste", handlePaste)
      
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }, [session, t])

  async function initializeExam() {
    try {
      const attemptId = Number.parseInt(id, 10)
      if (Number.isNaN(attemptId)) {
        throw new Error("Invalid attempt ID")
      }

      const sessionData = await getAttemptSession(attemptId)
      setSession(sessionData)

      // Initialize answers from currentAnswer on each question
      const initialAnswers: Record<number, SaveAnswerRequest> = {}
      
      // Get all questions (from sections/topics or flat list)
      const allQuestions: AttemptQuestionDto[] = []
      if (sessionData.sections && sessionData.sections.length > 0) {
        for (const section of sessionData.sections) {
          for (const topic of section.topics || []) {
            allQuestions.push(...(topic.questions || []))
          }
          allQuestions.push(...(section.questions || []))
        }
      } else {
        allQuestions.push(...(sessionData.questions || []))
      }
      
      for (const question of allQuestions) {
        if (question.currentAnswer) {
          initialAnswers[question.questionId] = {
            questionId: question.questionId,
            selectedOptionIds: question.currentAnswer.selectedOptionIds,
            textAnswer: question.currentAnswer.textAnswer,
          }
        }
      }
      setAnswers(initialAnswers)

      // Set exam timer
      setExamTimeRemaining(sessionData.remainingSeconds)
      
      // Initialize section timers
      if (sessionData.sections) {
        const sectionTimerState: Record<number, number> = {}
        for (const section of sessionData.sections) {
          if (section.durationMinutes && section.remainingSeconds !== null && section.remainingSeconds !== undefined) {
            sectionTimerState[section.sectionId] = section.remainingSeconds
          }
        }
        setSectionTimers(sectionTimerState)
      }

      // Start countdown timer
      timerRef.current = setInterval(() => {
        // Update exam timer
        setExamTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current)
            handleAutoSubmit()
            return 0
          }
          return prev - 1
        })
        
        // Update section timers
        setSectionTimers((prev) => {
          const updated = { ...prev }
          for (const sectionId of Object.keys(updated)) {
            const id = Number(sectionId)
            if (updated[id] > 0) {
              updated[id] = updated[id] - 1
              // Check if section time expired
              if (updated[id] <= 0) {
                handleSectionTimeExpired(id)
              }
            }
          }
          return updated
        })
      }, 1000)

      // Sync timer with server every 60 seconds
      syncTimerRef.current = setInterval(async () => {
        try {
          const timerData = await getAttemptTimer(sessionData.attemptId)
          if (timerData.isExpired) {
            handleAutoSubmit()
          } else {
            setExamTimeRemaining(timerData.remainingSeconds)
          }
        } catch {
          // Silent fail
        }
      }, 60000)

      // Log exam started event
      await logAttemptEvent(sessionData.attemptId, {
        eventType: AttemptEventType.Started,
      }).catch(() => {})
    } catch (error) {
      console.error("[v0] Failed to start exam:", error)
      toast.error(t("common.errorOccurred"))
      router.push("/my-exams")
    } finally {
      setLoading(false)
    }
  }

  function handleSectionTimeExpired(sectionId: number) {
    // Find section index
    const sectionIndex = sections.findIndex(s => s.sectionId === sectionId)
    if (sectionIndex === -1) return
    
    // If current section expired, switch to next
    if (sectionIndex === currentSectionIndex && sectionIndex < sections.length - 1) {
      toast.warning(t("exam.sectionTimeExpired"))
      setCurrentSectionIndex(sectionIndex + 1)
      setCurrentQuestionIndex(0)
    }
  }

  function formatTime(seconds: number) {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`
  }

  function navigateToQuestion(index: number) {
    setCurrentQuestionIndex(index)
  }

  function goToNextQuestion() {
    if (currentQuestionIndex < currentSectionQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    } else if (hasSections && currentSectionIndex < sections.length - 1) {
      // Move to next section
      setCurrentSectionIndex((prev) => prev + 1)
      setCurrentQuestionIndex(0)
    }
  }

  function goToPrevQuestion() {
    if (!canNavigateToPreviousQuestion()) return
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    } else if (hasSections && currentSectionIndex > 0 && canNavigateToPreviousSection(currentSectionIndex)) {
      // Move to previous section's last question
      const prevSection = sections[currentSectionIndex - 1]
      const prevSectionQuestions = getSectionQuestions(prevSection)
      setCurrentSectionIndex((prev) => prev - 1)
      setCurrentQuestionIndex(prevSectionQuestions.length - 1)
    }
  }

  function getSectionQuestions(section: ExamSection): AttemptQuestionDto[] {
    const questions: AttemptQuestionDto[] = []
    for (const topic of section.topics || []) {
      questions.push(...(topic.questions || []))
    }
    questions.push(...(section.questions || []))
    return questions.sort((a, b) => a.order - b.order)
  }

  function handleSectionChange(sectionIdStr: string) {
    const sectionIndex = sections.findIndex(s => s.sectionId.toString() === sectionIdStr)
    if (sectionIndex !== -1) {
      // Check if can navigate to this section
      if (sectionIndex < currentSectionIndex && !canNavigateToPreviousSection(currentSectionIndex)) {
        toast.warning(t("exam.cannotGoBack"))
        return
      }
      setCurrentSectionIndex(sectionIndex)
      setCurrentQuestionIndex(0)
    }
  }

  const handleAnswerChange = useCallback(
    async (questionId: number, answer: SaveAnswerRequest) => {
      setAnswers((prev) => ({ ...prev, [questionId]: answer }))
      
      if (session) {
        try {
          setSavingAnswer(true)
          await saveAnswer(session.attemptId, answer)
          
          await logAttemptEvent(session.attemptId, {
            eventType: AttemptEventType.AnswerSaved,
            metadataJson: JSON.stringify({ questionId }),
          }).catch(() => {})
        } catch (error) {
          console.error("[v0] Failed to save answer:", error)
        } finally {
          setSavingAnswer(false)
        }
      }
    },
    [session],
  )

  const handleToggleFlag = useCallback((questionId: number) => {
    setFlagged((prev) => {
      const newFlagged = new Set(prev)
      if (newFlagged.has(questionId)) {
        newFlagged.delete(questionId)
      } else {
        newFlagged.add(questionId)
      }
      return newFlagged
    })
  }, [])

  async function handleAutoSubmit() {
    if (!session) return
    toast.warning(t("exam.timeExpired"))
    
    await logAttemptEvent(session.attemptId, {
      eventType: AttemptEventType.TimedOut,
    }).catch(() => {})
    
    await handleSubmit()
  }

  async function handleSubmit() {
    if (!session) return
    try {
      setSubmitting(true)
      
      await logAttemptEvent(session.attemptId, {
        eventType: AttemptEventType.Submitted,
      }).catch(() => {})
      
      const result = await submitAttempt(session.attemptId)
      toast.success(result.message || t("exam.submitted"))
      router.push(`/results/${session.attemptId}?submitted=true`)
    } catch (error) {
      console.error("[v0] Failed to submit exam:", error)
      toast.error(t("common.errorOccurred"))
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

  if (!session || !currentQuestion) {
    return null
  }

  const isFirstQuestion = currentQuestionIndex === 0 && currentSectionIndex === 0
  const isLastQuestion = currentQuestionIndex === currentSectionQuestions.length - 1 && 
    (!hasSections || currentSectionIndex === sections.length - 1)
  const isWarningTime = examTimeRemaining < 300 // 5 minutes
  const currentSectionTimer = currentSection ? sectionTimers[currentSection.sectionId] : null
  const isSectionWarningTime = currentSectionTimer !== null && currentSectionTimer !== undefined && currentSectionTimer < 60

  // Render question content based on question type (supports both ID and name matching)
  function renderQuestionContent(question: AttemptQuestionDto) {
    const questionType = getQuestionType(question.questionTypeId, question.questionTypeName)
    
    return (
      <div className="space-y-3">
        {/* Single Choice (MCQ_Single) - Radio buttons */}
        {questionType === "MCQ_SINGLE" && (
          <RadioGroup
            value={answers[question.questionId]?.selectedOptionIds?.[0]?.toString() || ""}
            onValueChange={(value) =>
              handleAnswerChange(question.questionId, {
                questionId: question.questionId,
                selectedOptionIds: [Number.parseInt(value, 10)],
              })
            }
          >
            {question.options?.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value={option.id.toString()} id={`opt-${option.id}`} />
                <Label htmlFor={`opt-${option.id}`} className="flex-1 cursor-pointer">
                  {getLocalizedField(option, "text", language)}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {/* Multiple Select (MCQ_Multi) - Checkboxes */}
        {questionType === "MCQ_MULTI" && (
          <div className="space-y-2">
            {question.options?.map((option) => {
              const selectedIds = answers[question.questionId]?.selectedOptionIds || []
              const isChecked = selectedIds.includes(option.id)

              return (
                <div
                  key={option.id}
                  className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`opt-${option.id}`}
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const newIds = checked
                        ? [...selectedIds, option.id]
                        : selectedIds.filter((id) => id !== option.id)
                      handleAnswerChange(question.questionId, {
                        questionId: question.questionId,
                        selectedOptionIds: newIds,
                      })
                    }}
                  />
                  <Label htmlFor={`opt-${option.id}`} className="flex-1 cursor-pointer">
                    {getLocalizedField(option, "text", language)}
                  </Label>
                </div>
              )
            })}
          </div>
        )}

        {/* True/False - Radio buttons (2 options) */}
        {questionType === "TRUE_FALSE" && (
          <RadioGroup
            value={answers[question.questionId]?.selectedOptionIds?.[0]?.toString() || ""}
            onValueChange={(value) =>
              handleAnswerChange(question.questionId, {
                questionId: question.questionId,
                selectedOptionIds: [Number.parseInt(value, 10)],
              })
            }
          >
            {question.options?.map((option) => (
              <div
                key={option.id}
                className="flex items-center space-x-3 rtl:space-x-reverse p-3 rounded-lg border hover:bg-muted/50 transition-colors"
              >
                <RadioGroupItem value={option.id.toString()} id={`opt-${option.id}`} />
                <Label htmlFor={`opt-${option.id}`} className="flex-1 cursor-pointer">
                  {getLocalizedField(option, "text", language)}
                </Label>
              </div>
            ))}
          </RadioGroup>
        )}

        {/* Short Answer - Text input (smaller) */}
        {questionType === "SHORT_ANSWER" && (
          <Textarea
            placeholder={t("exam.typeAnswer")}
            value={answers[question.questionId]?.textAnswer || ""}
            onChange={(e) =>
              handleAnswerChange(question.questionId, {
                questionId: question.questionId,
                textAnswer: e.target.value,
              })
            }
            rows={4}
            className="resize-none"
          />
        )}

        {/* Essay - Larger textarea for long answers */}
        {questionType === "ESSAY" && (
          <Textarea
            placeholder={t("exam.typeAnswer")}
            value={answers[question.questionId]?.textAnswer || ""}
            onChange={(e) =>
              handleAnswerChange(question.questionId, {
                questionId: question.questionId,
                textAnswer: e.target.value,
              })
            }
            rows={8}
            className="resize-none"
          />
        )}

        {/* Numeric - Number input */}
        {questionType === "NUMERIC" && (
          <Textarea
            placeholder={t("exam.typeAnswer")}
            value={answers[question.questionId]?.textAnswer || ""}
            onChange={(e) =>
              handleAnswerChange(question.questionId, {
                questionId: question.questionId,
                textAnswer: e.target.value,
              })
            }
            rows={2}
            className="resize-none"
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col" dir={dir}>
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
                    {hasSections ? (
                      // Section-based navigation
                      sections.map((section, sIndex) => {
                        const sectionQuestions = getSectionQuestions(section)
                        const canAccess = sIndex <= currentSectionIndex || canNavigateToPreviousSection(sIndex + 1)
                        
                        return (
                          <div key={section.sectionId} className="space-y-2">
                            <p className={`text-sm font-medium ${!canAccess ? 'text-muted-foreground' : ''}`}>
                              {getLocalizedField(section, "title", language)}
                            </p>
                            <div className="grid grid-cols-5 gap-2">
                              {sectionQuestions.map((q, qIndex) => {
                                const isAnswered = !!answers[q.questionId]
                                const isFlagged = flagged.has(q.questionId)
                                const isCurrent = sIndex === currentSectionIndex && qIndex === currentQuestionIndex

                                return (
                                  <button
                                    type="button"
                                    key={q.attemptQuestionId}
                                    onClick={() => {
                                      if (canAccess) {
                                        setCurrentSectionIndex(sIndex)
                                        navigateToQuestion(qIndex)
                                      }
                                    }}
                                    disabled={!canAccess}
                                    className={`h-9 w-9 rounded-md text-sm font-medium transition-colors relative ${
                                      isCurrent
                                        ? "bg-primary text-primary-foreground"
                                        : isAnswered
                                          ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                                          : canAccess
                                            ? "bg-muted hover:bg-muted/80"
                                            : "bg-muted/50 text-muted-foreground cursor-not-allowed"
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
                        )
                      })
                    ) : (
                      // Flat question navigation
                      <div>
                        <p className="text-sm font-medium mb-2">
                          {getLocalizedField(session, "examTitle", language)}
                        </p>
                        <div className="grid grid-cols-5 gap-2">
                          {currentSectionQuestions.map((q, qIndex) => {
                            const isAnswered = !!answers[q.questionId]
                            const isFlagged = flagged.has(q.questionId)
                            const isCurrent = qIndex === currentQuestionIndex

                            return (
                              <button
                                type="button"
                                key={q.attemptQuestionId}
                                onClick={() => navigateToQuestion(qIndex)}
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
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <div className="hidden sm:block">
              <p className="text-sm font-medium">
                {t("exam.question")} {currentQuestionIndex + 1} {t("common.of")} {currentSectionQuestions.length}
              </p>
              <Progress value={progress} className="w-32 h-1.5 mt-1" />
            </div>
          </div>

          <div className="flex items-center gap-4">
            {savingAnswer && (
              <span className="text-xs text-muted-foreground">{t("common.saving")}</span>
            )}
            
            {/* Section Timer (if applicable) */}
            {currentSectionTimer !== null && currentSectionTimer !== undefined && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                  isSectionWarningTime ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-blue-500/10 text-blue-600"
                }`}
              >
                <Timer className={`h-4 w-4 ${isSectionWarningTime ? "animate-pulse" : ""}`} />
                <span className="font-mono text-sm">{formatTime(currentSectionTimer)}</span>
              </div>
            )}
            
            {/* Exam Timer */}
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${
                isWarningTime ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-muted"
              }`}
            >
              <Clock className={`h-4 w-4 ${isWarningTime ? "animate-pulse" : ""}`} />
              <span className="font-mono font-medium">{formatTime(examTimeRemaining)}</span>
            </div>
            
            <Button variant="destructive" size="sm" onClick={() => setSubmitDialogOpen(true)}>
              <Send className="h-4 w-4 me-2" />
              {t("exam.submit")}
            </Button>
          </div>
        </div>
      </header>

      {/* Section Tabs (if sections exist) */}
      {hasSections && (
        <div className="border-b bg-background">
          <div className="container">
            <Tabs 
              value={currentSection?.sectionId.toString()} 
              onValueChange={handleSectionChange}
              className="w-full"
            >
              <TabsList className="h-auto p-1 bg-muted/50 w-full justify-start overflow-x-auto">
                {sections.map((section, sIndex) => {
                  const canAccess = sIndex <= currentSectionIndex || canNavigateToPreviousSection(sIndex + 1)
                  const sectionTimer = sectionTimers[section.sectionId]
                  const hasTimer = section.durationMinutes && sectionTimer !== undefined
                  
                  return (
                    <TabsTrigger 
                      key={section.sectionId} 
                      value={section.sectionId.toString()}
                      disabled={!canAccess}
                      className="flex items-center gap-2 data-[state=active]:bg-background px-4 py-2"
                    >
                      <span>{getLocalizedField(section, "title", language)}</span>
                      {hasTimer && (
                        <Badge variant="outline" className="ms-1 font-mono text-xs">
                          {formatTime(sectionTimer)}
                        </Badge>
                      )}
                    </TabsTrigger>
                  )
                })}
              </TabsList>
            </Tabs>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 container py-6">
        <div className="max-w-3xl mx-auto">
          {/* Topics in current section */}
          {currentSection?.topics && currentSection.topics.length > 0 && (
            <div className="mb-4 space-y-2">
              {currentSection.topics.map((topic) => (
                <Collapsible
                  key={topic.topicId}
                  open={expandedTopics.has(topic.topicId)}
                  onOpenChange={(open) => {
                    setExpandedTopics((prev) => {
                      const newSet = new Set(prev)
                      if (open) {
                        newSet.add(topic.topicId)
                      } else {
                        newSet.delete(topic.topicId)
                      }
                      return newSet
                    })
                  }}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-3 h-auto bg-muted/50 hover:bg-muted">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{getLocalizedField(topic, "title", language)}</span>
                        <Badge variant="secondary" className="ms-2">
                          {topic.answeredQuestions}/{topic.totalQuestions} {t("common.questions")}
                        </Badge>
                      </div>
                      <ChevronDown className={`h-4 w-4 transition-transform ${expandedTopics.has(topic.topicId) ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="px-3 py-2 text-sm text-muted-foreground">
                    {getLocalizedField(topic, "description", language) || t("exam.topicQuestions", { count: topic.totalQuestions })}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}

          {/* Question Card */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                    {currentQuestionIndex + 1}
                  </span>
                  <Badge variant="outline">
                    {currentQuestion.points} {t("common.points")}
                  </Badge>
                  <Badge variant="secondary">
                    {getQuestionTypeDisplayName(currentQuestion.questionTypeId, currentQuestion.questionTypeName)}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleFlag(currentQuestion.questionId)}
                  className={flagged.has(currentQuestion.questionId) ? "text-amber-500" : "text-muted-foreground"}
                >
                  <Flag className={`h-4 w-4 me-1 ${flagged.has(currentQuestion.questionId) ? "fill-current" : ""}`} />
                  {flagged.has(currentQuestion.questionId) ? t("exam.unflag") : t("exam.flag")}
                </Button>
              </div>

              <div className="prose dark:prose-invert max-w-none mb-6">
                <p className="text-lg">{getLocalizedField(currentQuestion, "body", language)}</p>
              </div>

              {/* Attachments */}
              {currentQuestion.attachments && currentQuestion.attachments.length > 0 && (
                <div className="mb-6 space-y-2">
                  {currentQuestion.attachments.map((attachment) => (
                    <div key={attachment.id} className="p-2 bg-muted rounded-lg">
                      {attachment.fileType.startsWith("image/") ? (
                        <img
                          src={attachment.filePath || "/placeholder.svg"}
                          alt={attachment.fileName}
                          className="max-w-full rounded"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <a
                          href={attachment.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {attachment.fileName}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Answer Input */}
              {renderQuestionContent(currentQuestion)}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={goToPrevQuestion} 
              disabled={isFirstQuestion || !canNavigateToPreviousQuestion()} 
              className="bg-transparent"
            >
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
