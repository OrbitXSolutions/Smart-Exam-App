"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DataTable } from "@/components/ui/data-table"
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
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
import {
  getQuestions,
  getQuestionCategories,
  getQuestionTypes,
  deleteQuestion,
  toggleQuestionStatus,
} from "@/lib/api/question-bank"
import type { Question, QuestionCategory, QuestionType } from "@/lib/types"
import { DifficultyLevel } from "@/lib/types"
import type { ColumnDef } from "@tanstack/react-table"
import { toast } from "sonner"
import { Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2, ToggleLeft, FileQuestion, X } from "lucide-react"

export default function QuestionBankPage() {
  const { t, language } = useI18n()

  const [questions, setQuestions] = useState<Question[]>([])
  const [categories, setCategories] = useState<QuestionCategory[]>([])
  const [types, setTypes] = useState<QuestionType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedType, setSelectedType] = useState<string>("all")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all")
  const [showFilters, setShowFilters] = useState(false)

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [questionsRes, categoriesRes, typesRes] = await Promise.all([
        getQuestions({ pageSize: 100 }),
        getQuestionCategories(),
        getQuestionTypes(),
      ])

      if (questionsRes.success && questionsRes.data) {
        setQuestions(questionsRes.data.items)
        setTotalCount(questionsRes.data.totalCount)
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

  const handleDelete = async () => {
    if (!questionToDelete) return

    const response = await deleteQuestion(questionToDelete.id)
    if (response.success) {
      setQuestions(questions.filter((q) => q.id !== questionToDelete.id))
      toast.success("Question deleted successfully")
    }
    setDeleteDialogOpen(false)
    setQuestionToDelete(null)
  }

  const handleToggleStatus = async (question: Question) => {
    const response = await toggleQuestionStatus(question.id)
    if (response.success) {
      setQuestions(questions.map((q) => (q.id === question.id ? { ...q, isActive: !q.isActive } : q)))
      toast.success(`Question ${question.isActive ? "deactivated" : "activated"} successfully`)
    }
  }

  const filteredQuestions = questions.filter((q) => {
    const matchesSearch = !searchQuery || q.body.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || q.questionCategoryId === Number(selectedCategory)
    const matchesType = selectedType === "all" || q.questionTypeId === Number(selectedType)
    const matchesDifficulty = selectedDifficulty === "all" || q.difficultyLevel === Number(selectedDifficulty)
    return matchesSearch && matchesCategory && matchesType && matchesDifficulty
  })

  const columns: ColumnDef<Question>[] = [
    {
      accessorKey: "body",
      header: "Question",
      cell: ({ row }) => (
        <div className="max-w-md">
          <p className="font-medium truncate">{row.original.body}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {language === "ar" ? row.original.questionCategoryName : row.original.questionCategoryName}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "questionTypeName",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-sm">
          {language === "ar"
            ? types.find((t) => t.id === row.original.questionTypeId)?.nameAr || row.original.questionTypeName
            : row.original.questionTypeName}
        </span>
      ),
    },
    {
      accessorKey: "difficultyLevelName",
      header: "Difficulty",
      cell: ({ row }) => <StatusBadge status={row.original.difficultyLevelName} />,
    },
    {
      accessorKey: "points",
      header: "Points",
      cell: ({ row }) => <span className="font-medium">{row.original.points}</span>,
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => <StatusBadge status={row.original.isActive ? "Active" : "Inactive"} />,
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link href={`/question-bank/${row.original.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/question-bank/${row.original.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleStatus(row.original)}>
              <ToggleLeft className="mr-2 h-4 w-4" />
              {row.original.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                setQuestionToDelete(row.original)
                setDeleteDialogOpen(true)
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

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
          <Card className="animate-slide-in-top">
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
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredQuestions.length === 0 ? (
          <EmptyState
            icon={FileQuestion}
            title={hasActiveFilters ? "No questions match your filters" : "No questions yet"}
            description={
              hasActiveFilters
                ? "Try adjusting your filters or search query"
                : "Create your first question to get started with your question bank"
            }
            action={
              hasActiveFilters
                ? { label: "Clear Filters", onClick: clearFilters }
                : { label: t("questionBank.createQuestion"), onClick: () => {} }
            }
          />
        ) : (
          <>
            <div className="text-sm text-muted-foreground">
              Showing {filteredQuestions.length} of {totalCount} questions
            </div>
            <DataTable columns={columns} data={filteredQuestions} searchKey="body" showSearch={false} />
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
