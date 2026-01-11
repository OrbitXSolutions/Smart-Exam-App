"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { CheckCircle2, XCircle, Trophy, Clock, Target, FileText, ArrowLeft, Download, Share2 } from "lucide-react"

interface ExamResult {
  id: string
  examTitle: string
  examCode: string
  submittedAt: string
  duration: number
  score: number
  passingScore: number
  passed: boolean
  totalQuestions: number
  correctAnswers: number
  incorrectAnswers: number
  unanswered: number
  sections: {
    title: string
    score: number
    totalPoints: number
    questions: number
    correct: number
  }[]
}

export default function ResultsPage() {
  const { id } = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const justSubmitted = searchParams.get("submitted") === "true"
  const { t } = useI18n()
  const [result, setResult] = useState<ExamResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading results
    setTimeout(() => {
      setResult({
        id,
        examTitle: "Mathematics Final Exam",
        examCode: "MATH-2024-FINAL",
        submittedAt: new Date().toISOString(),
        duration: 95, // minutes taken
        score: 85,
        passingScore: 70,
        passed: true,
        totalQuestions: 25,
        correctAnswers: 21,
        incorrectAnswers: 3,
        unanswered: 1,
        sections: [
          { title: "Multiple Choice", score: 45, totalPoints: 50, questions: 10, correct: 9 },
          { title: "True/False", score: 15, totalPoints: 15, questions: 5, correct: 5 },
          { title: "Short Answer", score: 25, totalPoints: 35, questions: 10, correct: 7 },
        ],
      })
      setLoading(false)
    }, 1500)
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">{t("results.calculating")}</p>
        </div>
      </div>
    )
  }

  if (!result) return null

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/my-exams">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="font-semibold">{result.examTitle}</h1>
              <p className="text-sm text-muted-foreground">{result.examCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 me-2" />
              {t("results.download")}
            </Button>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 me-2" />
              {t("results.share")}
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        {/* Success/Failure Banner */}
        <Card
          className={`mb-8 overflow-hidden ${
            result.passed
              ? "border-emerald-500/50 bg-gradient-to-r from-emerald-500/10 to-transparent"
              : "border-red-500/50 bg-gradient-to-r from-red-500/10 to-transparent"
          }`}
        >
          <CardContent className="flex items-center gap-6 p-6">
            <div
              className={`flex h-20 w-20 items-center justify-center rounded-full ${
                result.passed ? "bg-emerald-500/20" : "bg-red-500/20"
              }`}
            >
              {result.passed ? (
                <Trophy className="h-10 w-10 text-emerald-500" />
              ) : (
                <XCircle className="h-10 w-10 text-red-500" />
              )}
            </div>
            <div className="flex-1">
              <h2 className={`text-2xl font-bold ${result.passed ? "text-emerald-600" : "text-red-600"}`}>
                {result.passed ? t("results.congratulations") : t("results.tryAgain")}
              </h2>
              <p className="text-muted-foreground mt-1">
                {result.passed ? t("results.passedMessage") : t("results.failedMessage")}
              </p>
            </div>
            <div className="text-center">
              <div className={`text-5xl font-bold ${result.passed ? "text-emerald-600" : "text-red-600"}`}>
                {result.score}%
              </div>
              <Badge variant={result.passed ? "default" : "destructive"} className="mt-2">
                {result.passed ? t("results.passed") : t("results.failed")}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("results.score")}</p>
                <p className="text-2xl font-bold">{result.score}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("results.correct")}</p>
                <p className="text-2xl font-bold">{result.correctAnswers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <XCircle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("results.incorrect")}</p>
                <p className="text-2xl font-bold">{result.incorrectAnswers}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{t("results.timeTaken")}</p>
                <p className="text-2xl font-bold">{result.duration} min</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {t("results.sectionBreakdown")}
            </CardTitle>
            <CardDescription>{t("results.sectionBreakdownDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.sections.map((section, index) => {
              const percentage = Math.round((section.score / section.totalPoints) * 100)
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{section.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {section.correct}/{section.questions} correct • {section.score}/{section.totalPoints} pts
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Progress value={percentage} className="flex-1 h-2" />
                    <span className="text-sm font-medium w-12 text-end">{percentage}%</span>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/my-exams">
              <ArrowLeft className="h-4 w-4 me-2" />
              {t("results.backToExams")}
            </Link>
          </Button>
        </div>
      </main>
    </div>
  )
}
