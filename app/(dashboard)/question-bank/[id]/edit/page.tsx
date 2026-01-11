"use client"

import type React from "react"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import { LoadingSpinner, PageLoader } from "@/components/ui/loading-spinner"
import { getQuestionById, updateQuestion, getQuestionCategories, getQuestionTypes } from "@/lib/api/question-bank"
import type { Question, QuestionCategory, QuestionType } from "@/lib/types"
import { DifficultyLevel } from "@/lib/types"
import { toast } from "sonner"
import { ArrowLeft, Plus, Trash2, GripVertical } from "lucide-react"

interface OptionInput {
  id: string
  text: string
  isCorrect: boolean
  order: number
  originalId?: number
}

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { t, language } = useI18n()

  const [question, setQuestion] = useState<Question | null>(null)
  const [categories, setCategories] = useState<QuestionCategory[]>([])
  const [types, setTypes] = useState<QuestionType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    body: "",
    questionTypeId: "",
    questionCategoryId: "",
    points: 1,
    difficultyLevel: DifficultyLevel.Easy,
    isActive: true,
  })

  const [options, setOptions] = useState<OptionInput[]>([])

  useEffect(() => {
    fetchData()
  }, [resolvedParams.id])

  const fetchData = async () => {
    try {
      const [questionRes, categoriesRes, typesRes] = await Promise.all([
        getQuestionById(Number(resolvedParams.id)),
        getQuestionCategories(),
        getQuestionTypes(),
      ])

      if (questionRes.success && questionRes.data) {
        const q = questionRes.data
        setQuestion(q)
        setFormData({
          body: q.body,
          questionTypeId: String(q.questionTypeId),
          questionCategoryId: String(q.questionCategoryId),
          points: q.points,
          difficultyLevel: q.difficultyLevel,
          isActive: q.isActive,
        })
        setOptions(
          q.options.map((opt) => ({
            id: String(opt.id),
            text: opt.text,
            isCorrect: opt.isCorrect,
            order: opt.order,
            originalId: opt.id,
          })),
        )
      }

      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data.items)
      }
      if (typesRes.success && typesRes.data) {
        setTypes(typesRes.data.items)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    }
    setIsLoading(false)
  }

  const addOption = () => {
    setOptions([
      ...options,
      {
        id: String(Date.now()),
        text: "",
        isCorrect: false,
        order: options.length,
      },
    ])
  }

  const removeOption = (id: string) => {
    if (options.length <= 2) {
      toast.error("At least 2 options are required")
      return
    }
    setOptions(options.filter((opt) => opt.id !== id).map((opt, idx) => ({ ...opt, order: idx })))
  }

  const updateOption = (id: string, updates: Partial<OptionInput>) => {
    setOptions(options.map((opt) => (opt.id === id ? { ...opt, ...updates } : opt)))
  }

  const selectedType = types.find((t) => String(t.id) === formData.questionTypeId)
  const isEssayType = selectedType?.nameEn === "Essay"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.body.trim()) {
      toast.error("Question body is required")
      return
    }

    if (!isEssayType) {
      const hasCorrectAnswer = options.some((opt) => opt.isCorrect)
      if (!hasCorrectAnswer) {
        toast.error("At least one option must be marked as correct")
        return
      }
    }

    setIsSaving(true)

    const response = await updateQuestion(Number(resolvedParams.id), {
      body: formData.body,
      questionTypeId: Number(formData.questionTypeId),
      questionCategoryId: Number(formData.questionCategoryId),
      points: formData.points,
      difficultyLevel: formData.difficultyLevel,
      isActive: formData.isActive,
    })

    setIsSaving(false)

    if (response.success) {
      toast.success("Question updated successfully")
      router.push(`/question-bank/${resolvedParams.id}`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <Header title={t("questionBank.editQuestion")} />
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
      <Header title={t("questionBank.editQuestion")} subtitle={`Question #${question.id}`} />

      <div className="flex-1 p-6">
        <div className="mx-auto max-w-3xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link href={`/question-bank/${question.id}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("common.back")}
            </Link>
          </Button>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Question Details */}
            <Card>
              <CardHeader>
                <CardTitle>Question Details</CardTitle>
                <CardDescription>Edit the question content and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="body">
                    {t("questionBank.questionBody")} <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="body"
                    placeholder="Enter your question here..."
                    value={formData.body}
                    onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">
                      {t("questionBank.questionType")} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.questionTypeId}
                      onValueChange={(value) => setFormData({ ...formData, questionTypeId: value })}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {types.map((type) => (
                          <SelectItem key={type.id} value={String(type.id)}>
                            {language === "ar" ? type.nameAr : type.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">
                      {t("questionBank.questionCategory")} <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.questionCategoryId}
                      onValueChange={(value) => setFormData({ ...formData, questionCategoryId: value })}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {language === "ar" ? cat.nameAr : cat.nameEn}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty">{t("questionBank.difficulty")}</Label>
                    <Select
                      value={String(formData.difficultyLevel)}
                      onValueChange={(value) => setFormData({ ...formData, difficultyLevel: Number(value) })}
                    >
                      <SelectTrigger id="difficulty">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={String(DifficultyLevel.Easy)}>{t("questionBank.easy")}</SelectItem>
                        <SelectItem value={String(DifficultyLevel.Medium)}>{t("questionBank.medium")}</SelectItem>
                        <SelectItem value={String(DifficultyLevel.Hard)}>{t("questionBank.hard")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="points">{t("common.points")}</Label>
                    <Input
                      id="points"
                      type="number"
                      min={0.5}
                      step={0.5}
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <p className="font-medium">{t("common.active")}</p>
                    <p className="text-sm text-muted-foreground">Question can be used in exams</p>
                  </div>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Answer Options */}
            {!isEssayType && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("questionBank.options")}</CardTitle>
                  <CardDescription>Edit answer options and correct answers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {options.map((option, index) => (
                    <div key={option.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className="flex items-center gap-2 pt-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                        <Checkbox
                          id={`correct-${option.id}`}
                          checked={option.isCorrect}
                          onCheckedChange={(checked) => updateOption(option.id, { isCorrect: checked === true })}
                        />
                      </div>
                      <div className="flex-1 space-y-2">
                        <Label htmlFor={`option-${option.id}`} className="sr-only">
                          Option {index + 1}
                        </Label>
                        <Input
                          id={`option-${option.id}`}
                          placeholder={`Option ${index + 1}`}
                          value={option.text}
                          onChange={(e) => updateOption(option.id, { text: e.target.value })}
                        />
                        {option.isCorrect && (
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                            {t("questionBank.correctAnswer")}
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => removeOption(option.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </Button>
                    </div>
                  ))}

                  <Button type="button" variant="outline" onClick={addOption} className="w-full bg-transparent">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("questionBank.addOption")}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Note: Option changes require backend integration (backend-dependent)
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" asChild>
                <Link href={`/question-bank/${question.id}`}>{t("common.cancel")}</Link>
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving && <LoadingSpinner size="sm" className="mr-2" />}
                {t("common.save")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
