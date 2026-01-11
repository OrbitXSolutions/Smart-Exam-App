"use client"

import { useState, useEffect } from "react"
import { useI18n } from "@/lib/i18n/context"
import { getExams } from "@/lib/api/exams"
import { getExamResults } from "@/lib/api/grading"
import type { Exam } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DataTable, type Column } from "@/components/ui/data-table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { EmptyState } from "@/components/ui/empty-state"
import { StatCard } from "@/components/ui/stat-card"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts"
import {
  Users,
  Target,
  TrendingUp,
  Award,
  Search,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react"

export default function ReportsPage() {
  const { t, locale } = useI18n()
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [resultsLoading, setResultsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [results, setResults] = useState<{
    summary: {
      totalCandidates: number
      completed: number
      pending: number
      averageScore: number
      passRate: number
      highestScore: number
      lowestScore: number
    }
    candidates: Array<{
      id: string
      name: string
      email: string
      score: number | null
      status: string
      submittedAt: string | null
      passed: boolean | null
    }>
  } | null>(null)

  useEffect(() => {
    loadExams()
  }, [])

  useEffect(() => {
    if (selectedExam) {
      loadResults(selectedExam)
    }
  }, [selectedExam])

  async function loadExams() {
    try {
      setLoading(true)
      const data = await getExams()
      setExams(data.items.filter((e) => e.status !== "Draft"))
      if (data.items.length > 0) {
        setSelectedExam(data.items[0].id)
      }
    } catch (error) {
      toast.error("Failed to load exams")
    } finally {
      setLoading(false)
    }
  }

  async function loadResults(examId: string) {
    try {
      setResultsLoading(true)
      const data = await getExamResults(examId)
      setResults(data)
    } catch (error) {
      toast.error("Failed to load results")
    } finally {
      setResultsLoading(false)
    }
  }

  const filteredCandidates =
    results?.candidates.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || []

  const passFailData = results
    ? [
        {
          name: t("results.passed"),
          value: Math.round((results.summary.passRate / 100) * results.summary.completed),
          color: "#10b981",
        },
        {
          name: t("results.failed"),
          value: Math.round(((100 - results.summary.passRate) / 100) * results.summary.completed),
          color: "#ef4444",
        },
      ]
    : []

  const scoreDistribution = [
    { range: "0-20", count: 2 },
    { range: "21-40", count: 3 },
    { range: "41-60", count: 8 },
    { range: "61-80", count: 15 },
    { range: "81-100", count: 17 },
  ]

  const columns: Column<(typeof filteredCandidates)[0]>[] = [
    {
      key: "name",
      header: t("grading.candidate"),
      render: (c) => (
        <div>
          <p className="font-medium">{c.name}</p>
          <p className="text-sm text-muted-foreground">{c.email}</p>
        </div>
      ),
    },
    {
      key: "score",
      header: t("results.score"),
      render: (c) =>
        c.score !== null ? (
          <span className="text-lg font-bold">{c.score}%</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "status",
      header: t("common.status"),
      render: (c) => {
        if (c.passed === true) {
          return (
            <Badge className="bg-emerald-500">
              <CheckCircle2 className="h-3 w-3 me-1" />
              {t("results.passed")}
            </Badge>
          )
        }
        if (c.passed === false) {
          return (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 me-1" />
              {t("results.failed")}
            </Badge>
          )
        }
        return (
          <Badge variant="secondary">
            <Clock className="h-3 w-3 me-1" />
            {t("status.pending")}
          </Badge>
        )
      },
    },
    {
      key: "submittedAt",
      header: t("grading.submittedAt"),
      render: (c) =>
        c.submittedAt ? (
          new Date(c.submittedAt).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
            dateStyle: "short",
            timeStyle: "short",
          })
        ) : (
          <span className="text-muted-foreground">-</span>
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
          <h1 className="text-2xl font-bold text-foreground">{t("reports.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("reports.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedExam} onValueChange={setSelectedExam}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder={t("reports.selectExam")} />
            </SelectTrigger>
            <SelectContent>
              {exams.map((exam) => (
                <SelectItem key={exam.id} value={exam.id}>
                  {exam.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 me-2" />
            {t("reports.export")}
          </Button>
        </div>
      </div>

      {resultsLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <LoadingSpinner size="lg" />
        </div>
      ) : results ? (
        <>
          {/* Summary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("reports.totalCandidates")}
              value={results.summary.totalCandidates}
              icon={Users}
              iconColor="text-blue-500"
              iconBgColor="bg-blue-500/10"
            />
            <StatCard
              title={t("reports.averageScore")}
              value={`${results.summary.averageScore}%`}
              icon={Target}
              iconColor="text-primary"
              iconBgColor="bg-primary/10"
            />
            <StatCard
              title={t("reports.passRate")}
              value={`${results.summary.passRate}%`}
              icon={TrendingUp}
              iconColor="text-emerald-500"
              iconBgColor="bg-emerald-500/10"
            />
            <StatCard
              title={t("reports.highestScore")}
              value={`${results.summary.highestScore}%`}
              icon={Award}
              iconColor="text-amber-500"
              iconBgColor="bg-amber-500/10"
            />
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("reports.scoreDistribution")}</CardTitle>
                <CardDescription>{t("reports.scoreDistributionDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={scoreDistribution}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="range" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("reports.passFailRatio")}</CardTitle>
                <CardDescription>{t("reports.passFailRatioDesc")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={passFailData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {passFailData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Candidates Table */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>{t("reports.candidateResults")}</CardTitle>
                <div className="relative w-full sm:w-64">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t("common.search")}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredCandidates.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title={t("reports.noCandidates")}
                  description={t("reports.noCandidatesDesc")}
                />
              ) : (
                <DataTable columns={columns} data={filteredCandidates} />
              )}
            </CardContent>
          </Card>
        </>
      ) : (
        <EmptyState
          icon={FileText}
          title={t("reports.selectExamPrompt")}
          description={t("reports.selectExamPromptDesc")}
        />
      )}
    </div>
  )
}
