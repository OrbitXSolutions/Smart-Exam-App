"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { ExamType } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ArrowLeft, Save, Settings, Shield, Clock, Building2, Zap, AlertCircle, Calendar } from "lucide-react"
import Link from "next/link"
import { apiClient } from "@/lib/api-client"

// Mock departments - would come from API
const MOCK_DEPARTMENTS = [
  { id: 1, nameEn: "Information Technology", nameAr: "تقنية المعلومات" },
  { id: 2, nameEn: "Human Resources", nameAr: "الموارد البشرية" },
  { id: 3, nameEn: "Finance", nameAr: "المالية" },
  { id: 4, nameEn: "Engineering", nameAr: "الهندسة" },
  { id: 5, nameEn: "Marketing", nameAr: "التسويق" },
]

interface Department {
  id: number
  nameEn: string
  nameAr: string
}

export default function CreateExamPage() {
  const { t, locale } = useI18n()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [departments, setDepartments] = useState<Department[]>(MOCK_DEPARTMENTS)

  // Form data matching API spec
  const [formData, setFormData] = useState({
    departmentId: 0,
    examType: ExamType.Flex,
    titleEn: "",
    titleAr: "",
    descriptionEn: "",
    descriptionAr: "",
    startAt: "",
    endAt: "",
    durationMinutes: 60,
    maxAttempts: 1,
    shuffleQuestions: false,
    shuffleOptions: false,
    passScore: 70,
    isActive: true,
  })

  useEffect(() => {
    fetchDepartments()
  }, [])

  async function fetchDepartments() {
    try {
      const response = await apiClient.get("/Lookups/departments")
      if (response?.items && Array.isArray(response.items)) {
        setDepartments(response.items)
      } else if (Array.isArray(response)) {
        setDepartments(response)
      }
    } catch {
      // Use mock data on error
      setDepartments(MOCK_DEPARTMENTS)
    }
  }

  function updateField(field: string, value: string | number | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.titleEn.trim()) {
      setError(t("exams.errorTitleRequired"))
      return
    }
    if (!formData.departmentId) {
      setError(t("exams.errorDepartmentRequired"))
      return
    }
    if (formData.durationMinutes < 1 || formData.durationMinutes > 600) {
      setError(t("exams.errorDurationRange"))
      return
    }

    try {
      setLoading(true)

      // Build request body per API spec
      const requestBody = {
        departmentId: formData.departmentId,
        examType: formData.examType,
        titleEn: formData.titleEn,
        titleAr: formData.titleAr || formData.titleEn,
        descriptionEn: formData.descriptionEn || null,
        descriptionAr: formData.descriptionAr || null,
        startAt: formData.startAt ? new Date(formData.startAt).toISOString() : null,
        endAt: formData.endAt ? new Date(formData.endAt).toISOString() : null,
        durationMinutes: formData.durationMinutes,
        maxAttempts: formData.maxAttempts,
        shuffleQuestions: formData.shuffleQuestions,
        shuffleOptions: formData.shuffleOptions,
        passScore: formData.passScore,
        isActive: formData.isActive,
      }

      console.log("[v0] Creating exam with:", requestBody)

      const response = await apiClient.post("/Assessment/exams", requestBody)

      console.log("[v0] Create exam response:", response)

      if (response?.success === false) {
        setError(response.message || "Failed to create exam")
        return
      }

      const examId = response?.data?.id || response?.id
      toast.success(t("exams.createSuccess"))

      if (examId) {
        router.push(`/exams/${examId}/builder`)
      } else {
        router.push("/exams")
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create exam"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/exams">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("exams.create")}</h1>
          <p className="text-muted-foreground mt-1">{t("exams.createSubtitle")}</p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="basic" className="gap-2">
              <Settings className="h-4 w-4" />
              {t("exams.basicInfo")}
            </TabsTrigger>
            <TabsTrigger value="timing" className="gap-2">
              <Clock className="h-4 w-4" />
              {t("exams.timing")}
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              {t("exams.security")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("exams.basicInfo")}</CardTitle>
                <CardDescription>{t("exams.basicInfoDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Department Selection */}
                <div className="space-y-2">
                  <Label htmlFor="department" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-primary" />
                    {t("exams.department")} *
                  </Label>
                  <Select
                    value={formData.departmentId ? String(formData.departmentId) : ""}
                    onValueChange={(value) => updateField("departmentId", Number(value))}
                  >
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder={t("exams.selectDepartment")} />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((dept) => (
                        <SelectItem key={dept.id} value={String(dept.id)}>
                          {locale === "ar" ? dept.nameAr : dept.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Exam Type */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    {t("exams.examType")} *
                  </Label>
                  <RadioGroup
                    value={String(formData.examType)}
                    onValueChange={(value) => updateField("examType", Number(value))}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <Label
                      htmlFor="exam-type-flex"
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.examType === ExamType.Flex
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={String(ExamType.Flex)} id="exam-type-flex" className="mt-1" />
                      <div className="space-y-1">
                        <span className="font-medium">{t("exams.examTypeFlex")}</span>
                        <p className="text-sm text-muted-foreground">{t("exams.examTypeFlexDesc")}</p>
                      </div>
                    </Label>
                    <Label
                      htmlFor="exam-type-fixed"
                      className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.examType === ExamType.Fixed
                          ? "border-primary bg-primary/5"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <RadioGroupItem value={String(ExamType.Fixed)} id="exam-type-fixed" className="mt-1" />
                      <div className="space-y-1">
                        <span className="font-medium">{t("exams.examTypeFixed")}</span>
                        <p className="text-sm text-muted-foreground">{t("exams.examTypeFixedDesc")}</p>
                      </div>
                    </Label>
                  </RadioGroup>
                </div>

                {/* Title (English) */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="titleEn">{t("exams.titleEn")} *</Label>
                    <Input
                      id="titleEn"
                      value={formData.titleEn}
                      onChange={(e) => updateField("titleEn", e.target.value)}
                      placeholder={t("exams.titleEnPlaceholder")}
                      className="w-full h-11"
                      maxLength={500}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="titleAr">{t("exams.titleAr")}</Label>
                    <Input
                      id="titleAr"
                      value={formData.titleAr}
                      onChange={(e) => updateField("titleAr", e.target.value)}
                      placeholder={t("exams.titleArPlaceholder")}
                      className="w-full h-11"
                      dir="rtl"
                      maxLength={500}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="descriptionEn">{t("exams.descriptionEn")}</Label>
                    <Textarea
                      id="descriptionEn"
                      value={formData.descriptionEn}
                      onChange={(e) => updateField("descriptionEn", e.target.value)}
                      placeholder={t("exams.descriptionEnPlaceholder")}
                      rows={3}
                      maxLength={2000}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="descriptionAr">{t("exams.descriptionAr")}</Label>
                    <Textarea
                      id="descriptionAr"
                      value={formData.descriptionAr}
                      onChange={(e) => updateField("descriptionAr", e.target.value)}
                      placeholder={t("exams.descriptionArPlaceholder")}
                      rows={3}
                      dir="rtl"
                      maxLength={2000}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("exams.displayOptions")}</CardTitle>
                <CardDescription>{t("exams.displayOptionsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("exams.shuffleQuestions")}</Label>
                    <p className="text-sm text-muted-foreground">{t("exams.shuffleQuestionsDesc")}</p>
                  </div>
                  <Switch
                    checked={formData.shuffleQuestions}
                    onCheckedChange={(checked) => updateField("shuffleQuestions", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("exams.shuffleOptions")}</Label>
                    <p className="text-sm text-muted-foreground">{t("exams.shuffleOptionsDesc")}</p>
                  </div>
                  <Switch
                    checked={formData.shuffleOptions}
                    onCheckedChange={(checked) => updateField("shuffleOptions", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("exams.isActive")}</Label>
                    <p className="text-sm text-muted-foreground">{t("exams.isActiveDesc")}</p>
                  </div>
                  <Switch checked={formData.isActive} onCheckedChange={(checked) => updateField("isActive", checked)} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("exams.timingSettings")}</CardTitle>
                <CardDescription>{t("exams.timingSettingsDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Start/End Date */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startAt" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {t("exams.startAt")}
                    </Label>
                    <Input
                      id="startAt"
                      type="datetime-local"
                      value={formData.startAt}
                      onChange={(e) => updateField("startAt", e.target.value)}
                      className="w-full h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endAt" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      {t("exams.endAt")}
                    </Label>
                    <Input
                      id="endAt"
                      type="datetime-local"
                      value={formData.endAt}
                      onChange={(e) => updateField("endAt", e.target.value)}
                      className="w-full h-11"
                    />
                  </div>
                </div>

                <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="duration">{t("exams.durationMinutes")} *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      max="600"
                      value={formData.durationMinutes}
                      onChange={(e) => updateField("durationMinutes", Number.parseInt(e.target.value) || 60)}
                      className="w-full h-11"
                    />
                    <p className="text-xs text-muted-foreground">{t("exams.durationRange")}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passingScore">{t("exams.passingScorePercent")} *</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.passScore}
                      onChange={(e) => updateField("passScore", Number.parseInt(e.target.value) || 70)}
                      className="w-full h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAttempts">{t("exams.maxAttempts")} *</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      min="0"
                      value={formData.maxAttempts}
                      onChange={(e) => updateField("maxAttempts", Number.parseInt(e.target.value) || 1)}
                      className="w-full h-11"
                    />
                    <p className="text-xs text-muted-foreground">{t("exams.maxAttemptsHint")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("exams.securitySettings")}</CardTitle>
                <CardDescription>{t("exams.securitySettingsDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{t("exams.securityConfiguredLater")}</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Error before submit */}
        {error && (
          <Alert variant="destructive" className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/exams">{t("common.cancel")}</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 me-2" />
            {loading ? t("common.loading") : t("exams.createAndContinue")}
          </Button>
        </div>
      </form>
    </div>
  )
}
