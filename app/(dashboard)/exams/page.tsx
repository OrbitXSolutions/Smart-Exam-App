"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import { getExams, deleteExam, publishExam, archiveExam } from "@/lib/api/exams"
import type { Exam } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DataTable, type Column } from "@/components/ui/data-table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { StatusBadge } from "@/components/ui/status-badge"
import { toast } from "sonner"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Send,
  Archive,
  FileText,
  Clock,
  LayoutList,
} from "lucide-react"

export default function ExamsPage() {
  const { t, dir } = useI18n()
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null)

  useEffect(() => {
    loadExams()
  }, [])

  async function loadExams() {
    try {
      setLoading(true)
      const result = await getExams()
      setExams(result.items)
    } catch (error) {
      toast.error("Failed to load exams")
    } finally {
      setLoading(false)
    }
  }

  async function handlePublish(exam: Exam) {
    try {
      await publishExam(exam.id)
      toast.success("Exam published successfully")
      loadExams()
    } catch (error) {
      toast.error("Failed to publish exam")
    }
  }

  async function handleArchive(exam: Exam) {
    try {
      await archiveExam(exam.id)
      toast.success("Exam archived successfully")
      loadExams()
    } catch (error) {
      toast.error("Failed to archive exam")
    }
  }

  async function handleDelete() {
    if (!examToDelete) return
    try {
      await deleteExam(examToDelete.id)
      toast.success("Exam deleted successfully")
      setDeleteDialogOpen(false)
      setExamToDelete(null)
      loadExams()
    } catch (error) {
      toast.error("Failed to delete exam")
    }
  }

  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.code?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || exam.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const columns: Column<Exam>[] = [
    {
      key: "title",
      header: t("exams.title"),
      render: (exam) => (
        <div className="flex flex-col gap-1">
          <Link href={`/exams/${exam.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
            {exam.title}
          </Link>
          {exam.code && <span className="text-xs text-muted-foreground">{exam.code}</span>}
        </div>
      ),
    },
    {
      key: "status",
      header: t("common.status"),
      render: (exam) => <StatusBadge status={exam.status} />,
    },
    {
      key: "duration",
      header: t("exams.duration"),
      render: (exam) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{exam.durationMinutes} min</span>
        </div>
      ),
    },
    {
      key: "passingScore",
      header: t("exams.passingScore"),
      render: (exam) => <span>{exam.passingScore}%</span>,
    },
    {
      key: "sections",
      header: t("exams.sections"),
      render: (exam) => (
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <LayoutList className="h-4 w-4" />
          <span>{exam.sections?.length || 0}</span>
        </div>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (exam) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={dir === "rtl" ? "start" : "end"}>
            <DropdownMenuItem asChild>
              <Link href={`/exams/${exam.id}`}>
                <Eye className="h-4 w-4 me-2" />
                {t("common.view")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/exams/${exam.id}/edit`}>
                <Pencil className="h-4 w-4 me-2" />
                {t("common.edit")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/exams/${exam.id}/builder`}>
                <LayoutList className="h-4 w-4 me-2" />
                {t("exams.builder")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {exam.status === "Draft" && (
              <DropdownMenuItem onClick={() => handlePublish(exam)}>
                <Send className="h-4 w-4 me-2" />
                {t("exams.publish")}
              </DropdownMenuItem>
            )}
            {exam.status === "Published" && (
              <DropdownMenuItem onClick={() => handleArchive(exam)}>
                <Archive className="h-4 w-4 me-2" />
                {t("exams.archive")}
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => {
                setExamToDelete(exam)
                setDeleteDialogOpen(true)
              }}
            >
              <Trash2 className="h-4 w-4 me-2" />
              {t("common.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("exams.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("exams.subtitle")}</p>
        </div>
        <Button asChild>
          <Link href="/exams/create">
            <Plus className="h-4 w-4 me-2" />
            {t("exams.create")}
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ps-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={t("common.status")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="Draft">{t("status.draft")}</SelectItem>
                <SelectItem value="Published">{t("status.published")}</SelectItem>
                <SelectItem value="Archived">{t("status.archived")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredExams.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t("exams.noExams")}
              description={t("exams.noExamsDesc")}
              action={
                <Button asChild>
                  <Link href="/exams/create">
                    <Plus className="h-4 w-4 me-2" />
                    {t("exams.create")}
                  </Link>
                </Button>
              }
            />
          ) : (
            <DataTable columns={columns} data={filteredExams} />
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>{t("exams.deleteConfirm", { title: examToDelete?.title })}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
