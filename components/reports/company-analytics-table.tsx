"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CompanyAnalytics } from "@/lib/analytics"

interface CompanyAnalyticsTableProps {
  data: CompanyAnalytics[]
}

export function CompanyAnalyticsTable({ data }: CompanyAnalyticsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Analytics</CardTitle>
        <CardDescription>Business performance by company</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Unique Attendees</TableHead>
              <TableHead>Total Assignments</TableHead>
              <TableHead>Confirmed Revenue</TableHead>
              <TableHead>Avg Spend/Person</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((company) => (
              <TableRow key={company.company}>
                <TableCell className="font-medium">{company.company}</TableCell>
                <TableCell>{company.uniqueAttendees}</TableCell>
                <TableCell>{company.totalAssignments}</TableCell>
                <TableCell>${company.confirmedRevenue.toFixed(2)}</TableCell>
                <TableCell>${company.averageSpendPerPerson.toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && <div className="text-center py-8 text-muted-foreground">No company data found</div>}
      </CardContent>
    </Card>
  )
}
