"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useI18n } from "@/lib/i18n/context"
import { createExam } from "@/lib/api/exams"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { ArrowLeft, Save, Settings, Shield, Clock } from "lucide-react"
import Link from "next/link"

export default function CreateExamPage() {
  const { t } = useI18n()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    code: "",
    description: "",
    instructions: "",
    durationMinutes: 60,
    passingScore: 70,
    maxAttempts: 1,
    shuffleQuestions: false,
    shuffleOptions: false,
    showResults: true,
    allowBackNavigation: true,
    requireProctoring: false,
    requireIdVerification: false,
    preventTabSwitching: true,
    preventCopyPaste: true,
  })

  function updateField(field: string, value: string | number | boolean) {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title.trim()) {
      toast.error("Exam title is required")
      return
    }

    try {
      setLoading(true)
      const exam = await createExam(formData)
      toast.success("Exam created successfully")
      router.push(`/exams/${exam.id}/builder`)
    } catch (error) {
      toast.error("Failed to create exam")
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
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t("exams.examTitle")} *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder={t("exams.examTitlePlaceholder")}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code">{t("exams.examCode")}</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => updateField("code", e.target.value)}
                      placeholder="EX-2024-001"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t("common.description")}</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    placeholder={t("exams.descriptionPlaceholder")}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instructions">{t("exams.instructions")}</Label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions}
                    onChange={(e) => updateField("instructions", e.target.value)}
                    placeholder={t("exams.instructionsPlaceholder")}
                    rows={4}
                  />
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
                    <Label>{t("exams.showResults")}</Label>
                    <p className="text-sm text-muted-foreground">{t("exams.showResultsDesc")}</p>
                  </div>
                  <Switch
                    checked={formData.showResults}
                    onCheckedChange={(checked) => updateField("showResults", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("exams.allowBackNavigation")}</Label>
                    <p className="text-sm text-muted-foreground">{t("exams.allowBackNavigationDesc")}</p>
                  </div>
                  <Switch
                    checked={formData.allowBackNavigation}
                    onCheckedChange={(checked) => updateField("allowBackNavigation", checked)}
                  />
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
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="duration">{t("exams.durationMinutes")}</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="1"
                      value={formData.durationMinutes}
                      onChange={(e) => updateField("durationMinutes", Number.parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="passingScore">{t("exams.passingScorePercent")}</Label>
                    <Input
                      id="passingScore"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.passingScore}
                      onChange={(e) => updateField("passingScore", Number.parseInt(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxAttempts">{t("exams.maxAttempts")}</Label>
                    <Input
                      id="maxAttempts"
                      type="number"
                      min="1"
                      value={formData.maxAttempts}
                      onChange={(e) => updateField("maxAttempts", Number.parseInt(e.target.value))}
                    />
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
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("exams.requireProctoring")}</Label>
                    <p className="text-sm text-muted-foreground">{t("exams.requireProctoringDesc")}</p>
                  </div>
                  <Switch
                    checked={formData.requireProctoring}
                    onCheckedChange={(checked) => updateField("requireProctoring", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("exams.requireIdVerification")}</Label>
                    <p className="text-sm text-muted-foreground">{t("exams.requireIdVerificationDesc")}</p>
                  </div>
                  <Switch
                    checked={formData.requireIdVerification}
                    onCheckedChange={(checked) => updateField("requireIdVerification", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("exams.preventTabSwitching")}</Label>
                    <p className="text-sm text-muted-foreground">{t("exams.preventTabSwitchingDesc")}</p>
                  </div>
                  <Switch
                    checked={formData.preventTabSwitching}
                    onCheckedChange={(checked) => updateField("preventTabSwitching", checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t("exams.preventCopyPaste")}</Label>
                    <p className="text-sm text-muted-foreground">{t("exams.preventCopyPasteDesc")}</p>
                  </div>
                  <Switch
                    checked={formData.preventCopyPaste}
                    onCheckedChange={(checked) => updateField("preventCopyPaste", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" asChild>
            <Link href="/exams">{t("common.cancel")}</Link>
          </Button>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 me-2" />
            {loading ? t("common.saving") : t("exams.createAndContinue")}
          </Button>
        </div>
      </form>
    </div>
  )
}
