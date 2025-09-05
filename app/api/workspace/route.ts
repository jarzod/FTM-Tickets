import { type NextRequest, NextResponse } from "next/server"
import { getWorkspaceByPassword, createWorkspace, updateWorkspace } from "@/lib/database"

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
