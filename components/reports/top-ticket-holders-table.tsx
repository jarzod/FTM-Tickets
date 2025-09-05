"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import type { TopTicketHolder } from "@/lib/analytics"
import { format } from "date-fns"

interface TopTicketHoldersTableProps {
  data: TopTicketHolder[]
}

export function TopTicketHoldersTable({ data }: TopTicketHoldersTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Ticket Holders</CardTitle>
        <CardDescription>Most frequent attendees ranked by total assignments</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Total Assignments</TableHead>
              <TableHead>Confirmed Revenue</TableHead>
              <TableHead>Last Event</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((holder, index) => (
              <TableRow key={`${holder.name}-${holder.company}`}>
                <TableCell>
                  <Badge variant={index < 3 ? "default" : "secondary"}>#{index + 1}</Badge>
                </TableCell>
                <TableCell className="font-medium">{holder.name}</TableCell>
                <TableCell>{holder.company}</TableCell>
                <TableCell>{holder.totalAssignments}</TableCell>
                <TableCell>${holder.confirmedRevenue.toFixed(2)}</TableCell>
                <TableCell>
                  {holder.lastEventDate ? format(new Date(holder.lastEventDate), "MMM d, yyyy") : "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length === 0 && <div className="text-center py-8 text-muted-foreground">No ticket holders found</div>}
      </CardContent>
    </Card>
  )
}
