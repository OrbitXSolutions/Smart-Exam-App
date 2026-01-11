"use client"

import { useState, useEffect, use } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import { PageLoader } from "@/components/ui/loading-spinner"
import { getQuestionById } from "@/lib/api/question-bank"
import type { Question } from "@/lib/types"
import { ArrowLeft, Edit, Check, X, FileImage, Calendar, Clock } from "lucide-react"

export default function QuestionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { t, language } = useI18n()

  const [question, setQuestion] = useState<Question | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchQuestion()
  }, [resolvedParams.id])

  const fetchQuestion = async () => {
    const response = await getQuestionById(Number(resolvedParams.id))
    if (response.success && response.data) {
      setQuestion(response.data)
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title="Question Details" />
        <PageLoader />
      </div>
    )
  }

  if (!question) {
    return (
      <div className="flex flex-col">
        <Header title="Question Not Found" />
        <div className="flex-1 p-6">
          <p className="text-muted-foreground">The question you are looking for does not exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <Header title="Question Details" subtitle={`Question #${question.id}`} />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/question-bank">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {t("common.back")}
              </Link>
            </Button>
            <Button asChild>
              <Link href={`/question-bank/${question.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                {t("common.edit")}
              </Link>
            </Button>
          </div>

          <div className="space-y-6">
            {/* Question Content */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>Question</CardTitle>
                    <CardDescription>{question.questionTypeName}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={question.difficultyLevelName} />
                    <StatusBadge status={question.isActive ? "Active" : "Inactive"} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed">{question.body}</p>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Badge className="h-fit">{question.points}</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("common.points")}</p>
                      <p className="font-medium">{question.points} points</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileImage className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("common.category")}</p>
                      <p className="font-medium">{question.questionCategoryName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Created</p>
                      <p className="font-medium">
                        {new Date(question.createdDate).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                      </p>
                    </div>
                  </div>

                  {question.updatedDate && (
                    <div className="flex items-center gap-3 rounded-lg border p-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Last Updated</p>
                        <p className="font-medium">
                          {new Date(question.updatedDate).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Answer Options */}
            {question.options && question.options.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("questionBank.options")}</CardTitle>
                  <CardDescription>Answer choices for this question</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {question.options
                    .sort((a, b) => a.order - b.order)
                    .map((option, index) => (
                      <div
                        key={option.id}
                        className={`flex items-center gap-3 rounded-lg border p-4 transition-colors ${
                          option.isCorrect
                            ? "border-green-500/50 bg-green-500/5 dark:border-green-500/30"
                            : "hover:bg-muted/50"
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm font-medium ${
                            option.isCorrect
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-muted-foreground/30 text-muted-foreground"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </div>
                        <p className={`flex-1 ${option.isCorrect ? "font-medium" : ""}`}>{option.text}</p>
                        {option.isCorrect ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-muted-foreground/30" />
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>
            )}

            {/* Attachments */}
            {question.attachments && question.attachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("questionBank.attachments")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {question.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-3 rounded-lg border p-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          <FileImage className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{attachment.fileName}</p>
                          <p className="text-xs text-muted-foreground">{(attachment.fileSize / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
