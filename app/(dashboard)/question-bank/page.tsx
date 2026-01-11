"use client"

import { useState } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import type { Question, QuestionCategory, QuestionType } from "@/lib/types"
import { DifficultyLevel } from "@/lib/types"
import { toast } from "sonner"
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, ToggleLeft, FileQuestion, X } from "lucide-react"

const MOCK_QUESTIONS: Question[] = [
  {
    id: 1,
    body: "What is the capital of France?",
    questionTypeId: 1,
    questionTypeName: "Multiple Choice",
    questionCategoryId: 1,
    questionCategoryName: "Geography",
    difficultyLevel: DifficultyLevel.Easy,
    difficultyLevelName: "Easy",
    points: 5,
    isActive: true,
    options: [
      { id: 1, body: "London", isCorrect: false },
      { id: 2, body: "Paris", isCorrect: true },
      { id: 3, body: "Berlin", isCorrect: false },
      { id: 4, body: "Madrid", isCorrect: false },
    ],
  },
  {
    id: 2,
    body: "Solve for x: 2x + 5 = 15",
    questionTypeId: 2,
    questionTypeName: "Short Answer",
    questionCategoryId: 2,
    questionCategoryName: "Mathematics",
    difficultyLevel: DifficultyLevel.Medium,
    difficultyLevelName: "Medium",
    points: 10,
    isActive: true,
    options: [],
  },
  {
    id: 3,
    body: "The Earth revolves around the Sun.",
    questionTypeId: 3,
    questionTypeName: "True/False",
    questionCategoryId: 3,
    questionCategoryName: "Science",
    difficultyLevel: DifficultyLevel.Easy,
    difficultyLevelName: "Easy",
    points: 3,
    isActive: true,
    options: [
      { id: 5, body: "True", isCorrect: true },
      { id: 6, body: "False", isCorrect: false },
    ],
  },
  {
    id: 4,
    body: "Explain the process of photosynthesis in detail.",
    questionTypeId: 4,
    questionTypeName: "Essay",
    questionCategoryId: 3,
    questionCategoryName: "Science",
    difficultyLevel: DifficultyLevel.Hard,
    difficultyLevelName: "Hard",
    points: 20,
    isActive: false,
    options: [],
  },
  {
    id: 5,
    body: "Which of the following are programming languages? (Select all that apply)",
    questionTypeId: 5,
    questionTypeName: "Multi-Select",
    questionCategoryId: 4,
    questionCategoryName: "Computer Science",
    difficultyLevel: DifficultyLevel.Medium,
    difficultyLevelName: "Medium",
    points: 8,
    isActive: true,
    options: [
      { id: 7, body: "Python", isCorrect: true },
      { id: 8, body: "HTML", isCorrect: false },
      { id: 9, body: "JavaScript", isCorrect: true },
      { id: 10, body: "CSS", isCorrect: false },
    ],
  },
]

const MOCK_CATEGORIES: QuestionCategory[] = [
  { id: 1, nameEn: "Geography", nameAr: "جغرافيا", isActive: true },
  { id: 2, nameEn: "Mathematics", nameAr: "رياضيات", isActive: true },
  { id: 3, nameEn: "Science", nameAr: "علوم", isActive: true },
  { id: 4, nameEn: "Computer Science", nameAr: "علوم الحاسوب", isActive: true },
]

const MOCK_TYPES: QuestionType[] = [
  { id: 1, nameEn: "Multiple Choice", nameAr: "اختيار من متعدد", isActive: true },
  { id: 2, nameEn: "Short Answer", nameAr: "إجابة قصيرة", isActive: true },
  { id: 3, nameEn: "True/False", nameAr: "صح/خطأ", isActive: true },
  { id: 4, nameEn: "Essay", nameAr: "مقالي", isActive: true },
  { id: 5, nameEn: "Multi-Select", nameAr: "اختيار متعدد", isActive: true },
]

export default function QuestionBankPage() {
  const { t, language } = useI18n()

  const [questions, setQuestions] = useState<Question[]>(MOCK_QUESTIONS)
  const categories = MOCK_CATEGORIES
  const types = MOCK_TYPES

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null)

  const handleDelete = () => {
    if (!questionToDelete) return
    setQuestions(questions.filter((q) => q.id !== questionToDelete.id))
    toast.success("Question deleted successfully")
    setDeleteDialogOpen(false)
    setQuestionToDelete(null)
  }

  const handleToggleStatus = (question: Question) => {
    setQuestions(questions.map((q) => (q.id === question.id ? { ...q, isActive: !q.isActive } : q)))
    toast.success(`Question ${question.isActive ? "deactivated" : "activated"} successfully`)
  }

  const filteredQuestions = questions.filter((q) => {
    const body = q.body || ""
    const matchesSearch = !searchQuery || body.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || q.questionCategoryId === Number(selectedCategory)
    const matchesType = selectedType === "all" || q.questionTypeId === Number(selectedType)
    const matchesDifficulty = selectedDifficulty === "all" || q.difficultyLevel === Number(selectedDifficulty)
    return matchesSearch && matchesCategory && matchesType && matchesDifficulty
  })

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory("all")
    setSelectedType("all")
    setSelectedDifficulty("all")
  }

  const hasActiveFilters =
    searchQuery || selectedCategory !== "all" || selectedType !== "all" || selectedDifficulty !== "all"

  return (
    <div className="flex flex-col">
      <Header title={t("questionBank.title")} subtitle={t("questionBank.subtitle")} />

      <div className="flex-1 space-y-6 p-6">
        {/* Actions Bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={`${t("common.search")} questions...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowFilters(!showFilters)}
              className={showFilters ? "bg-accent" : ""}
            >
              <Filter className="h-4 w-4" />
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
                <X className="h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
          <Button asChild>
            <Link href="/question-bank/create">
              <Plus className="mr-2 h-4 w-4" />
              {t("questionBank.createQuestion")}
            </Link>
          </Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="animate-in slide-in-from-top-2">
            <CardContent className="pt-6">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("questionBank.questionCategory")}</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={String(cat.id)}>
                          {language === "ar" ? cat.nameAr : cat.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("questionBank.questionType")}</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {types.map((type) => (
                        <SelectItem key={type.id} value={String(type.id)}>
                          {language === "ar" ? type.nameAr : type.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("questionBank.difficulty")}</label>
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Difficulties" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Difficulties</SelectItem>
                      <SelectItem value={String(DifficultyLevel.Easy)}>{t("questionBank.easy")}</SelectItem>
                      <SelectItem value={String(DifficultyLevel.Medium)}>{t("questionBank.medium")}</SelectItem>
                      <SelectItem value={String(DifficultyLevel.Hard)}>{t("questionBank.hard")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {filteredQuestions.length === 0 ? (
          <EmptyState
            icon={FileQuestion}
            title={hasActiveFilters ? "No questions match your filters" : "No questions yet"}
            description={
              hasActiveFilters
                ? "Try adjusting your filters or search query"
                : "Create your first question to get started with your question bank"
            }
            action={
              hasActiveFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/question-bank/create">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("questionBank.createQuestion")}
                  </Link>
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              Showing {filteredQuestions.length} of {questions.length} questions
            </div>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Points</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuestions.map((question) => (
                    <TableRow key={question.id}>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="font-medium truncate">{question.body || "No question text"}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {question.questionCategoryName || "Uncategorized"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {language === "ar"
                            ? types.find((t) => t.id === question.questionTypeId)?.nameAr ||
                              question.questionTypeName ||
                              "Unknown"
                            : question.questionTypeName || "Unknown"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={question.difficultyLevelName || "Unknown"} />
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{question.points || 0}</span>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={question.isActive ? "Active" : "Inactive"} />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/question-bank/${question.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/question-bank/${question.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(question)}>
                              <ToggleLeft className="mr-2 h-4 w-4" />
                              {question.isActive ? "Deactivate" : "Activate"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setQuestionToDelete(question)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Question?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The question will be permanently deleted from your question bank.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
