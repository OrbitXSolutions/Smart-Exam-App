"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getAvailableExams } from "@/lib/api/exam-session"
import type { ExamSession } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { toast } from "sonner"
import { CheckCircle2, XCircle, Clock, Target, Award, FileText, Home, Download, Trophy, TrendingUp } from "lucide-react"

export default function ExamResultsPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const { t, locale } = useI18n()
  const [exam, setExam] = useState<ExamSession | null>(null)
  const [loading, setLoading] = useState(true)

  // Mock detailed results
  const mockResults = {
    score: 85,
    passingScore: 70,
    passed: true,
    totalQuestions: 25,
    correctAnswers: 21,
    incorrectAnswers: 3,
    unanswered: 1,
    timeTaken: 95, // minutes
    submittedAt: new Date().toISOString(),
    sections: [
      { name: "Multiple Choice", score: 90, total: 15, correct: 13 },
      { name: "True/False", score: 80, total: 5, correct: 4 },
      { name: "Short Answer", score: 80, total: 5, correct: 4 },
    ],
  }

  useEffect(() => {
    loadExam()
  }, [sessionId])

  async function loadExam() {
    try {
      const exams = await getAvailableExams()
      const found = exams.find((e) => e.id === sessionId)
      setExam(found || null)
    } catch (error) {
      toast.error("Failed to load results")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const passed = mockResults.passed
  const scoreColor = passed ? "text-emerald-500" : "text-destructive"

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-8 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Result Header */}
        <Card className={`overflow-hidden ${passed ? "border-emerald-500/30" : "border-destructive/30"}`}>
          <div className={`h-2 ${passed ? "bg-emerald-500" : "bg-destructive"}`} />
          <CardContent className="pt-8 pb-6 text-center">
            <div
              className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
                passed ? "bg-emerald-500/10" : "bg-destructive/10"
              }`}
            >
              {passed ? (
                <Trophy className="h-10 w-10 text-emerald-500" />
              ) : (
                <XCircle className="h-10 w-10 text-destructive" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {passed ? t("results.congratulations") : t("results.examCompleted")}
            </h1>
            <p className="text-muted-foreground mb-6">{exam?.examTitle || "Exam"}</p>
            <div className={`text-6xl font-bold ${scoreColor} mb-2`}>{mockResults.score}%</div>
            <Badge variant={passed ? "default" : "destructive"} className="text-sm">
              {passed ? t("results.passed") : t("results.failed")}
            </Badge>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
              <Target className="h-6 w-6 text-primary mb-2" />
              <p className="text-2xl font-bold">
                {mockResults.correctAnswers}/{mockResults.totalQuestions}
              </p>
              <p className="text-xs text-muted-foreground">{t("results.correct")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
              <Clock className="h-6 w-6 text-blue-500 mb-2" />
              <p className="text-2xl font-bold">{mockResults.timeTaken}</p>
              <p className="text-xs text-muted-foreground">{t("common.minutes")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
              <TrendingUp className="h-6 w-6 text-amber-500 mb-2" />
              <p className="text-2xl font-bold">{mockResults.passingScore}%</p>
              <p className="text-xs text-muted-foreground">{t("results.passingScore")}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-4 text-center">
              <Award className="h-6 w-6 text-purple-500 mb-2" />
              <p className="text-2xl font-bold">
                {mockResults.score >= 90 ? "A" : mockResults.score >= 80 ? "B" : mockResults.score >= 70 ? "C" : "F"}
              </p>
              <p className="text-xs text-muted-foreground">{t("results.grade")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Section Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("results.sectionBreakdown")}</CardTitle>
            <CardDescription>{t("results.sectionBreakdownDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockResults.sections.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{section.name}</span>
                  <span className="text-muted-foreground">
                    {section.correct}/{section.total} ({section.score}%)
                  </span>
                </div>
                <Progress value={section.score} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Answer Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("results.answerSummary")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-emerald-600">{mockResults.correctAnswers}</p>
                <p className="text-sm text-muted-foreground">{t("results.correct")}</p>
              </div>
              <div className="p-4 rounded-lg bg-destructive/10">
                <XCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
                <p className="text-2xl font-bold text-destructive">{mockResults.incorrectAnswers}</p>
                <p className="text-sm text-muted-foreground">{t("results.incorrect")}</p>
              </div>
              <div className="p-4 rounded-lg bg-muted">
                <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-2xl font-bold">{mockResults.unanswered}</p>
                <p className="text-sm text-muted-foreground">{t("results.unanswered")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="outline" asChild>
            <Link href="/my-exams">
              <Home className="h-4 w-4 me-2" />
              {t("results.backToExams")}
            </Link>
          </Button>
          <Button>
            <Download className="h-4 w-4 me-2" />
            {t("results.downloadCertificate")}
          </Button>
        </div>
      </div>
    </div>
  )
}
