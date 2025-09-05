"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import type { AssignmentBreakdown } from "@/lib/analytics"

interface AssignmentBreakdownChartProps {
  data: AssignmentBreakdown
}

export function AssignmentBreakdownChart({ data }: AssignmentBreakdownChartProps) {
  const chartData = [
    { name: "Sold", value: data.sold.count, percentage: data.sold.percentage, color: "#22c55e" },
    { name: "Team", value: data.team.count, percentage: data.team.percentage, color: "#3b82f6" },
    { name: "Donated", value: data.donated.count, percentage: data.donated.percentage, color: "#a855f7" },
    { name: "Gifted", value: data.gifted.count, percentage: data.gifted.percentage, color: "#f97316" },
    { name: "Traded", value: data.traded.count, percentage: data.traded.percentage, color: "#6b7280" },
    { name: "Unassigned", value: data.unassigned.count, percentage: data.unassigned.percentage, color: "#e5e7eb" },
  ].filter((item) => item.value > 0)

  const chartConfig = {
    sold: { label: "Sold", color: "#22c55e" },
    team: { label: "Team", color: "#3b82f6" },
    donated: { label: "Donated", color: "#a855f7" },
    gifted: { label: "Gifted", color: "#f97316" },
    traded: { label: "Traded", color: "#6b7280" },
    unassigned: { label: "Unassigned", color: "#e5e7eb" },
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ticket Assignment Breakdown</CardTitle>
        <CardDescription>Distribution of ticket assignments by type</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
