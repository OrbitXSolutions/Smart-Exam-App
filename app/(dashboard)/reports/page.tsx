"use client"

import { useState } from "react"
import { useI18n } from "@/lib/i18n/context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatCard } from "@/components/ui/stat-card"
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
import { Users, Target, TrendingUp, Award, Search, Download, CheckCircle2, XCircle, Clock } from "lucide-react"

const MOCK_EXAMS = [
  { id: "1", title: "Mathematics Final Exam 2024" },
  { id: "2", title: "Physics Midterm Assessment" },
  { id: "3", title: "Computer Science Certification" },
]

const MOCK_RESULTS: Record<
  string,
  {
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
  }
> = {
  "1": {
    summary: {
      totalCandidates: 45,
      completed: 42,
      pending: 3,
      averageScore: 74,
      passRate: 82,
      highestScore: 98,
      lowestScore: 35,
    },
    candidates: [
      {
        id: "c1",
        name: "Ahmed Hassan",
        email: "ahmed.h@email.com",
        score: 92,
        status: "completed",
        submittedAt: "2024-01-15T10:30:00Z",
        passed: true,
      },
      {
        id: "c2",
        name: "Sarah Johnson",
        email: "sarah.j@email.com",
        score: 88,
        status: "completed",
        submittedAt: "2024-01-15T10:45:00Z",
        passed: true,
      },
      {
        id: "c3",
        name: "Mohammed Ali",
        email: "m.ali@email.com",
        score: 76,
        status: "completed",
        submittedAt: "2024-01-15T11:00:00Z",
        passed: true,
      },
      {
        id: "c4",
        name: "Emily Chen",
        email: "emily.c@email.com",
        score: 65,
        status: "completed",
        submittedAt: "2024-01-15T11:15:00Z",
        passed: true,
      },
      {
        id: "c5",
        name: "Omar Khaled",
        email: "omar.k@email.com",
        score: 55,
        status: "completed",
        submittedAt: "2024-01-15T11:30:00Z",
        passed: false,
      },
      {
        id: "c6",
        name: "Lisa Brown",
        email: "lisa.b@email.com",
        score: 48,
        status: "completed",
        submittedAt: "2024-01-15T11:45:00Z",
        passed: false,
      },
      {
        id: "c7",
        name: "Fatima Noor",
        email: "fatima.n@email.com",
        score: null,
        status: "pending",
        submittedAt: null,
        passed: null,
      },
      {
        id: "c8",
        name: "James Wilson",
        email: "james.w@email.com",
        score: 85,
        status: "completed",
        submittedAt: "2024-01-15T12:00:00Z",
        passed: true,
      },
    ],
  },
  "2": {
    summary: {
      totalCandidates: 38,
      completed: 35,
      pending: 3,
      averageScore: 68,
      passRate: 75,
      highestScore: 95,
      lowestScore: 28,
    },
    candidates: [
      {
        id: "c9",
        name: "David Lee",
        email: "david.l@email.com",
        score: 95,
        status: "completed",
        submittedAt: "2024-01-16T09:00:00Z",
        passed: true,
      },
      {
        id: "c10",
        name: "Aisha Khan",
        email: "aisha.k@email.com",
        score: 82,
        status: "completed",
        submittedAt: "2024-01-16T09:30:00Z",
        passed: true,
      },
      {
        id: "c11",
        name: "Michael Scott",
        email: "m.scott@email.com",
        score: 58,
        status: "completed",
        submittedAt: "2024-01-16T10:00:00Z",
        passed: false,
      },
    ],
  },
  "3": {
    summary: {
      totalCandidates: 52,
      completed: 50,
      pending: 2,
      averageScore: 79,
      passRate: 88,
      highestScore: 100,
      lowestScore: 42,
    },
    candidates: [
      {
        id: "c12",
        name: "Jennifer Adams",
        email: "jen.a@email.com",
        score: 100,
        status: "completed",
        submittedAt: "2024-01-17T14:00:00Z",
        passed: true,
      },
      {
        id: "c13",
        name: "Yusuf Ibrahim",
        email: "yusuf.i@email.com",
        score: 91,
        status: "completed",
        submittedAt: "2024-01-17T14:30:00Z",
        passed: true,
      },
      {
        id: "c14",
        name: "Rachel Green",
        email: "rachel.g@email.com",
        score: 78,
        status: "completed",
        submittedAt: "2024-01-17T15:00:00Z",
        passed: true,
      },
      {
        id: "c15",
        name: "Khalid Mansour",
        email: "khalid.m@email.com",
        score: 42,
        status: "completed",
        submittedAt: "2024-01-17T15:30:00Z",
        passed: false,
      },
    ],
  },
}

export default function ReportsPage() {
  const { t, locale } = useI18n()
  const [selectedExam, setSelectedExam] = useState<string>("1")
  const [searchQuery, setSearchQuery] = useState("")

  const results = MOCK_RESULTS[selectedExam] || MOCK_RESULTS["1"]

  const filteredCandidates = results.candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const passFailData = [
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

  const scoreDistribution = [
    { range: "0-20", count: 2 },
    { range: "21-40", count: 5 },
    { range: "41-60", count: 8 },
    { range: "61-80", count: 15 },
    { range: "81-100", count: 12 },
  ]

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
              {MOCK_EXAMS.map((exam) => (
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("grading.candidate")}</TableHead>
                <TableHead>{t("results.score")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("grading.submittedAt")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidates.map((candidate) => (
                <TableRow key={candidate.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{candidate.name}</p>
                      <p className="text-sm text-muted-foreground">{candidate.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {candidate.score !== null ? (
                      <span className="text-lg font-bold">{candidate.score}%</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {candidate.passed === true && (
                      <Badge className="bg-emerald-500">
                        <CheckCircle2 className="h-3 w-3 me-1" />
                        {t("results.passed")}
                      </Badge>
                    )}
                    {candidate.passed === false && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 me-1" />
                        {t("results.failed")}
                      </Badge>
                    )}
                    {candidate.passed === null && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 me-1" />
                        {t("status.pending")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {candidate.submittedAt ? (
                      new Date(candidate.submittedAt).toLocaleString(locale === "ar" ? "ar-SA" : "en-US", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredCandidates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    {t("reports.noCandidates")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
