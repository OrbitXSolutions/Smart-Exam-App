"use client"

import { useState } from "react"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
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
import { StatusBadge } from "@/components/ui/status-badge"
import { EmptyState } from "@/components/ui/empty-state"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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

const MOCK_EXAMS: Exam[] = [
  {
    id: 1,
    titleEn: "Mathematics Final Exam",
    titleAr: "الامتحان النهائي للرياضيات",
    title: "Mathematics Final Exam",
    code: "MATH-101",
    status: "Published",
    descriptionEn: "Final examination for Mathematics 101",
    descriptionAr: "الامتحان النهائي لمادة الرياضيات 101",
    durationMinutes: 120,
    totalPoints: 100,
    passingScore: 60,
    passScore: 60,
    isPublished: true,
    isActive: true,
    shuffleQuestions: true,
    shuffleOptions: true,
    showResults: true,
    sectionsCount: 3,
    sections: [],
    createdAt: "2024-01-15T10:00:00Z",
    updatedAt: "2024-01-20T14:30:00Z",
  },
  {
    id: 2,
    titleEn: "Physics Midterm",
    titleAr: "امتحان الفيزياء النصفي",
    title: "Physics Midterm",
    code: "PHYS-201",
    status: "Draft",
    descriptionEn: "Midterm examination for Physics 201",
    descriptionAr: "الامتحان النصفي لمادة الفيزياء 201",
    durationMinutes: 90,
    totalPoints: 80,
    passingScore: 50,
    passScore: 50,
    isPublished: false,
    isActive: true,
    shuffleQuestions: true,
    shuffleOptions: false,
    showResults: false,
    sectionsCount: 2,
    sections: [],
    createdAt: "2024-01-18T09:00:00Z",
    updatedAt: "2024-01-18T09:00:00Z",
  },
  {
    id: 3,
    titleEn: "Chemistry Lab Assessment",
    titleAr: "تقييم مختبر الكيمياء",
    title: "Chemistry Lab Assessment",
    code: "CHEM-301",
    status: "Archived",
    descriptionEn: "Lab assessment for Chemistry 301",
    descriptionAr: "تقييم المختبر لمادة الكيمياء 301",
    durationMinutes: 60,
    totalPoints: 50,
    passingScore: 30,
    passScore: 30,
    isPublished: true,
    isActive: false,
    shuffleQuestions: false,
    shuffleOptions: true,
    showResults: true,
    sectionsCount: 1,
    sections: [],
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-12T16:00:00Z",
  },
  {
    id: 4,
    titleEn: "English Literature Quiz",
    titleAr: "اختبار الأدب الإنجليزي",
    title: "English Literature Quiz",
    code: "ENG-102",
    status: "Published",
    descriptionEn: "Weekly quiz for English Literature",
    descriptionAr: "الاختبار الأسبوعي للأدب الإنجليزي",
    durationMinutes: 30,
    totalPoints: 25,
    passingScore: 15,
    passScore: 15,
    isPublished: true,
    isActive: true,
    shuffleQuestions: true,
    shuffleOptions: true,
    showResults: true,
    sectionsCount: 1,
    sections: [],
    createdAt: "2024-01-22T11:00:00Z",
    updatedAt: "2024-01-22T11:00:00Z",
  },
]

function getExamTitle(exam: Exam, language: string): string {
  return exam.title || (language === "ar" ? exam.titleAr : exam.titleEn) || "Untitled Exam"
}

function getExamStatus(exam: Exam): string {
  if (exam.status) return exam.status
  if (!exam.isActive) return "Archived"
  if (exam.isPublished) return "Published"
  return "Draft"
}

export default function ExamsPage() {
  const { t, dir, language } = useI18n()
  const [exams, setExams] = useState<Exam[]>(MOCK_EXAMS)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null)

  function handlePublish(exam: Exam) {
    setExams(exams.map((e) => (e.id === exam.id ? { ...e, status: "Published", isPublished: true } : e)))
    toast.success("Exam published successfully")
  }

  function handleArchive(exam: Exam) {
    setExams(exams.map((e) => (e.id === exam.id ? { ...e, status: "Archived", isActive: false } : e)))
    toast.success("Exam archived successfully")
  }

  function handleDelete() {
    if (!examToDelete) return
    setExams(exams.filter((e) => e.id !== examToDelete.id))
    toast.success("Exam deleted successfully")
    setDeleteDialogOpen(false)
    setExamToDelete(null)
  }

  const filteredExams = exams.filter((exam) => {
    const title = getExamTitle(exam, language) || ""
    const code = exam.code || ""
    const status = getExamStatus(exam)

    const matchesSearch =
      title.toLowerCase().includes(searchQuery.toLowerCase()) || code.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6 p-6">
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
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("exams.title")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead>{t("exams.duration")}</TableHead>
                    <TableHead>{t("exams.passingScore")}</TableHead>
                    <TableHead>{t("exams.sections")}</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExams.map((exam) => {
                    const status = getExamStatus(exam)
                    return (
                      <TableRow key={exam.id}>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Link
                              href={`/exams/${exam.id}`}
                              className="font-medium text-foreground hover:text-primary transition-colors"
                            >
                              {getExamTitle(exam, language)}
                            </Link>
                            {exam.code && <span className="text-xs text-muted-foreground">{exam.code}</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>{exam.durationMinutes || 0} min</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span>{exam.passingScore || exam.passScore || 0}%</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <LayoutList className="h-4 w-4" />
                            <span>{exam.sections?.length || exam.sectionsCount || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
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
                              {status === "Draft" && (
                                <DropdownMenuItem onClick={() => handlePublish(exam)}>
                                  <Send className="h-4 w-4 me-2" />
                                  {t("exams.publish")}
                                </DropdownMenuItem>
                              )}
                              {status === "Published" && (
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
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("exams.deleteConfirm", { title: examToDelete ? getExamTitle(examToDelete, language) : "" })}
            </AlertDialogDescription>
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
