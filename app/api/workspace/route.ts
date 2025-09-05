import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

let sql: any = null

function initializeDatabase() {
  if (!sql) {
    console.log("[v0] API Route - Initializing database connection")
    console.log("[v0] API Route - DATABASE_URL available:", !!process.env.DATABASE_URL)
    console.log("[v0] API Route - DATABASE_URL length:", process.env.DATABASE_URL?.length || 0)

    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }

    try {
      sql = neon(process.env.DATABASE_URL)
      console.log("[v0] API Route - Database connection established successfully")
    } catch (error) {
      console.error("[v0] API Route - Failed to initialize database:", error)
      throw error
    }
  }
  return sql
}

async function getWorkspaceByPassword(password: string) {
  const db = initializeDatabase()
  const result = await db`
    SELECT w.*, 
           json_agg(
             json_build_object(
               'id', t.id,
               'name', t.name,
               'color', t.color,
               'seatTypes', t.seat_types
             )
           ) as teams
    FROM workspaces w
    LEFT JOIN (
      SELECT t.*, 
             json_agg(
               json_build_object(
                 'id', st.id,
                 'name', st.name,
                 'value', st.value
               )
             ) as seat_types
      FROM teams t
      LEFT JOIN seat_types st ON t.id = st.team_id
      GROUP BY t.id, t.name, t.color, t.workspace_id, t.created_at
    ) t ON w.id = t.workspace_id
    WHERE w.password = ${password}
    GROUP BY w.id, w.name, w.password, w.created_at, w.updated_at
  `
  return result[0] || null
}

async function createWorkspace(data: any) {
  const db = initializeDatabase()
  const workspaceResult = await db`
    INSERT INTO workspaces (id, name, password, created_at, updated_at)
    VALUES (${data.id}, ${data.name}, ${data.password}, NOW(), NOW())
    RETURNING *
  `

  // Create teams and seat types
  for (const team of data.teams || []) {
    const teamResult = await db`
      INSERT INTO teams (id, name, color, workspace_id, created_at)
      VALUES (${team.id}, ${team.name}, ${team.color}, ${data.id}, NOW())
      RETURNING *
    `

    for (const seatType of team.seatTypes || []) {
      await db`
        INSERT INTO seat_types (id, name, value, team_id, created_at)
        VALUES (${seatType.id}, ${seatType.name}, ${seatType.value}, ${team.id}, NOW())
      `
    }
  }

  return workspaceResult[0]
}

async function updateWorkspace(id: string, updates: any) {
  const db = initializeDatabase()
  return await db`
    UPDATE workspaces 
    SET name = ${updates.name}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING *
  `
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const password = searchParams.get("password")

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 })
    }

    const workspace = await getWorkspaceByPassword(password)
    return NextResponse.json({ workspace })
  } catch (error) {
    console.error("Error fetching workspace:", error)
    return NextResponse.json({ error: "Failed to fetch workspace" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case "create":
        await createWorkspace(data)
        return NextResponse.json({ success: true })

      case "update":
        await updateWorkspace(data.id, data.updates)
        return NextResponse.json({ success: true })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error with workspace operation:", error)
    return NextResponse.json({ error: "Failed to perform workspace operation" }, { status: 500 })
  }
}
