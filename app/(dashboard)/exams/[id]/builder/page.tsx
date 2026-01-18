"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useI18n } from "@/lib/i18n/context"
import {
  getExam,
  getExamSections,
  createExamSection,
  updateExamSection,
  deleteExamSection,
  addQuestionToSection,
  removeQuestionFromSection,
} from "@/lib/api/exams"
import { getQuestions } from "@/lib/api/question-bank"
import type { Exam, ExamSection, Question } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { StatusBadge } from "@/components/ui/status-badge"
import { toast } from "sonner"
import {
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  FileText,
  Search,
  ChevronDown,
  ChevronUp,
  Save,
  X,
} from "lucide-react"

export default function ExamBuilderPage() {
  const { id } = useParams<{ id: string }>()
  const { t, dir } = useI18n()
  const [exam, setExam] = useState<Exam | null>(null)
  const [sections, setSections] = useState<ExamSection[]>([])
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // Dialog states
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<ExamSection | null>(null)
  const [sectionForm, setSectionForm] = useState({ title: "", description: "", timeLimit: 0 })
  const [deleteSectionDialog, setDeleteSectionDialog] = useState<ExamSection | null>(null)

  // Question picker
  const [questionPickerOpen, setQuestionPickerOpen] = useState(false)
  const [activeSectionForQuestions, setActiveSectionForQuestions] = useState<string | null>(null)
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set())
  const [questionSearch, setQuestionSearch] = useState("")

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      setLoading(true)
      const [examData, sectionsData, questionsData] = await Promise.all([
        getExam(id),
        getExamSections(id),
        getQuestions(),
      ])
      setExam(examData)
      setSections(sectionsData)
      setAvailableQuestions(questionsData.items.filter((q) => q.isActive))
      // Expand all sections by default
      setExpandedSections(new Set(sectionsData.map((s) => s.id)))
    } catch (error) {
      toast.error("Failed to load exam data")
    } finally {
      setLoading(false)
    }
  }

  function toggleSectionExpand(sectionId: string) {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  function openSectionDialog(section?: ExamSection) {
    if (section) {
      setEditingSection(section)
      setSectionForm({
        title: section.title,
        description: section.description || "",
        timeLimit: section.timeLimit || 0,
      })
    } else {
      setEditingSection(null)
      setSectionForm({ title: "", description: "", timeLimit: 0 })
    }
    setSectionDialogOpen(true)
  }

  async function handleSaveSection() {
    if (!sectionForm.title.trim()) {
      toast.error("Section title is required")
      return
    }

    try {
      if (editingSection) {
        // API takes sectionId directly, not examId + sectionId
        await updateExamSection(editingSection.id, {
          titleEn: sectionForm.title,
          titleAr: sectionForm.title,
          descriptionEn: sectionForm.description,
          descriptionAr: sectionForm.description,
          order: editingSection.order || 1,
          durationMinutes: sectionForm.timeLimit || undefined,
        })
        toast.success("Section updated")
      } else {
        await createExamSection(id, {
          titleEn: sectionForm.title,
          titleAr: sectionForm.title,
          descriptionEn: sectionForm.description,
          descriptionAr: sectionForm.description,
          order: sections.length + 1,
          durationMinutes: sectionForm.timeLimit || undefined,
        })
        toast.success("Section created")
      }
      setSectionDialogOpen(false)
      loadData()
    } catch (error) {
      toast.error("Failed to save section")
    }
  }

  async function handleDeleteSection() {
    if (!deleteSectionDialog) return
    try {
      // API takes sectionId directly, not examId + sectionId
      await deleteExamSection(deleteSectionDialog.id)
      toast.success("Section deleted")
      setDeleteSectionDialog(null)
      loadData()
    } catch (error) {
      toast.error("Failed to delete section")
    }
  }

  function openQuestionPicker(sectionId: string) {
    setActiveSectionForQuestions(sectionId)
    const section = sections.find((s) => s.id === sectionId)
    const existingIds = new Set(section?.questions?.map((q) => q.questionId) || [])
    setSelectedQuestions(existingIds)
    setQuestionPickerOpen(true)
  }

  async function handleAddQuestions() {
    if (!activeSectionForQuestions) return

    const section = sections.find((s) => s.id === activeSectionForQuestions)
    const existingIds = new Set(section?.questions?.map((q) => q.questionId) || [])

    // Find newly selected questions
    const newQuestionIds = Array.from(selectedQuestions).filter((qId) => !existingIds.has(qId))

    try {
      for (const questionId of newQuestionIds) {
        const question = availableQuestions.find((q) => q.id === questionId)
        // API takes sectionId directly
        await addQuestionToSection(activeSectionForQuestions, {
          questionId: Number(questionId),
          pointsOverride: question?.points || 1,
          isRequired: true,
        })
      }
      toast.success(`Added ${newQuestionIds.length} question(s)`)
      setQuestionPickerOpen(false)
      loadData()
    } catch (error) {
      toast.error("Failed to add questions")
    }
  }

  async function handleRemoveQuestion(sectionId: string, examQuestionId: string) {
    try {
      // API takes examQuestionId directly
      await removeQuestionFromSection(id, sectionId, examQuestionId)
      toast.success("Question removed")
      loadData()
    } catch (error) {
      toast.error("Failed to remove question")
    }
  }

  const filteredQuestions = availableQuestions.filter(
    (q) =>
      q.body.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.category?.name.toLowerCase().includes(questionSearch.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Exam not found</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/exams/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{t("exams.builder")}</h1>
              <StatusBadge status={exam.status} />
            </div>
            <p className="text-muted-foreground mt-1">{exam.title}</p>
          </div>
        </div>
        <Button onClick={() => openSectionDialog()}>
          <Plus className="h-4 w-4 me-2" />
          {t("exams.addSection")}
        </Button>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto h-16 w-16 text-muted-foreground/30" />
            <h3 className="mt-6 text-lg font-medium">{t("exams.noSections")}</h3>
            <p className="mt-2 text-muted-foreground max-w-sm mx-auto">{t("exams.noSectionsDesc")}</p>
            <Button className="mt-6" onClick={() => openSectionDialog()}>
              <Plus className="h-4 w-4 me-2" />
              {t("exams.addSection")}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((section, sectionIndex) => {
            const isExpanded = expandedSections.has(section.id)
            const questionCount = section.questions?.length || 0
            const totalPoints = section.questions?.reduce((sum, q) => sum + (q.points || 0), 0) || 0

            return (
              <Card key={section.id} className="overflow-hidden">
                <CardHeader
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggleSectionExpand(section.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                        {sectionIndex + 1}
                      </div>
                      <div>
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        <CardDescription className="flex items-center gap-3 mt-1">
                          <span>
                            {questionCount} {t("questions.title").toLowerCase()}
                          </span>
                          <span>•</span>
                          <span>
                            {totalPoints} {t("exams.points")}
                          </span>
                          {section.timeLimit && section.timeLimit > 0 && (
                            <>
                              <span>•</span>
                              <span>{section.timeLimit} min</span>
                            </>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation()
                          openSectionDialog(section)
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteSectionDialog(section)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="border-t bg-muted/20 pt-4">
                    {section.description && <p className="text-sm text-muted-foreground mb-4">{section.description}</p>}

                    {/* Questions in this section */}
                    {questionCount === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground">{t("exams.noQuestionsInSection")}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 bg-transparent"
                          onClick={() => openQuestionPicker(section.id)}
                        >
                          <Plus className="h-4 w-4 me-2" />
                          {t("exams.addQuestions")}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {section.questions?.map((eq, qIndex) => {
                          const question = availableQuestions.find((q) => q.id === eq.questionId)
                          return (
                            <div key={eq.id} className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                              <span className="text-sm font-medium text-muted-foreground w-6">{qIndex + 1}.</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm truncate">{question?.body || "Question not found"}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  {question?.type && (
                                    <Badge variant="secondary" className="text-xs">
                                      {question.type.name}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-muted-foreground">{eq.points} pts</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => handleRemoveQuestion(section.id, eq.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        })}
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-2 bg-transparent"
                          onClick={() => openQuestionPicker(section.id)}
                        >
                          <Plus className="h-4 w-4 me-2" />
                          {t("exams.addQuestions")}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Section Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingSection ? t("exams.editSection") : t("exams.addSection")}</DialogTitle>
            <DialogDescription>{t("exams.sectionDialogDesc")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="sectionTitle">{t("exams.sectionTitle")} *</Label>
              <Input
                id="sectionTitle"
                value={sectionForm.title}
                onChange={(e) => setSectionForm((p) => ({ ...p, title: e.target.value }))}
                placeholder={t("exams.sectionTitlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sectionDesc">{t("common.description")}</Label>
              <Textarea
                id="sectionDesc"
                value={sectionForm.description}
                onChange={(e) => setSectionForm((p) => ({ ...p, description: e.target.value }))}
                placeholder={t("exams.sectionDescPlaceholder")}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeLimit">{t("exams.sectionTimeLimit")}</Label>
              <Input
                id="timeLimit"
                type="number"
                min="0"
                value={sectionForm.timeLimit}
                onChange={(e) => setSectionForm((p) => ({ ...p, timeLimit: Number.parseInt(e.target.value) || 0 }))}
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">{t("exams.sectionTimeLimitDesc")}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSectionDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveSection}>
              <Save className="h-4 w-4 me-2" />
              {t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Section Dialog */}
      <AlertDialog open={!!deleteSectionDialog} onOpenChange={(open) => !open && setDeleteSectionDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("exams.deleteSectionConfirm", { title: deleteSectionDialog?.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Question Picker Sheet */}
      <Sheet open={questionPickerOpen} onOpenChange={setQuestionPickerOpen}>
        <SheetContent side={dir === "rtl" ? "left" : "right"} className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>{t("exams.selectQuestions")}</SheetTitle>
            <SheetDescription>{t("exams.selectQuestionsDesc")}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("common.search")}
                value={questionSearch}
                onChange={(e) => setQuestionSearch(e.target.value)}
                className="ps-9"
              />
            </div>
            <ScrollArea className="h-[calc(100vh-280px)]">
              <div className="space-y-2 pe-4">
                {filteredQuestions.map((question) => {
                  const isSelected = selectedQuestions.has(question.id)
                  return (
                    <div
                      key={question.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                      }`}
                      onClick={() => {
                        setSelectedQuestions((prev) => {
                          const next = new Set(prev)
                          if (next.has(question.id)) {
                            next.delete(question.id)
                          } else {
                            next.add(question.id)
                          }
                          return next
                        })
                      }}
                    >
                      <Checkbox checked={isSelected} className="mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm line-clamp-2">{question.body}</p>
                        <div className="flex items-center gap-2 mt-2">
                          {question.type && (
                            <Badge variant="secondary" className="text-xs">
                              {question.type.name}
                            </Badge>
                          )}
                          {question.category && (
                            <Badge variant="outline" className="text-xs">
                              {question.category.name}
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{question.points} pts</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedQuestions.size} {t("exams.questionsSelected")}
              </span>
              <Button onClick={handleAddQuestions}>
                <Plus className="h-4 w-4 me-2" />
                {t("exams.addSelected")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
