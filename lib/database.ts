import { neon } from "@neondatabase/serverless"

let sql: ReturnType<typeof neon> | null = null

function initializeDatabase() {
  const isServer = typeof process !== "undefined" && process.env && !process.browser

  console.log("[v0] Environment check - isServer:", isServer)
  console.log("[v0] typeof window:", typeof window)
  console.log("[v0] process.env exists:", typeof process !== "undefined" && !!process.env)

  if (!isServer) {
    console.log("[v0] Database initialization skipped - running on client side")
    return false
  }

  const databaseUrl = process.env.DATABASE_URL
  console.log("[v0] DATABASE_URL available:", !!databaseUrl)
  console.log("[v0] DATABASE_URL length:", databaseUrl ? databaseUrl.length : 0)

  if (!databaseUrl) {
    console.error("[v0] DATABASE_URL environment variable is not set")
    return false
  }

  try {
    sql = neon(databaseUrl)
    console.log("[v0] Database connection initialized successfully")
    return true
  } catch (error) {
    console.error("[v0] Failed to initialize database connection:", error)
    return false
  }
}

initializeDatabase()

function ensureDatabase() {
  if (!sql) {
    console.log("[v0] Database not initialized, attempting to reconnect...")
    const initialized = initializeDatabase()
    if (!initialized) {
      throw new Error(
        "Database connection not available. Make sure DATABASE_URL is set and you are on the server side.",
      )
    }
  }
  return sql!
}

// Workspace functions
export async function createWorkspace(workspace: { id: string; name: string; password: string }) {
  const db = ensureDatabase()
  await db`
    INSERT INTO workspaces (id, name, password)
    VALUES (${workspace.id}, ${workspace.name}, ${workspace.password})
  `
}

export async function getWorkspaceByPassword(password: string) {
  const db = ensureDatabase()
  const result = await db`
    SELECT * FROM workspaces WHERE password = ${password}
  `
  return result[0] || null
}

export async function updateWorkspace(id: string, updates: { name?: string; password?: string }) {
  const db = ensureDatabase()
  const setClause = Object.entries(updates)
    .map(([key, _], index) => `${key} = $${index + 2}`)
    .join(", ")

  if (setClause) {
    await db`
      UPDATE workspaces 
      SET ${db.unsafe(setClause)}, updated_at = NOW()
      WHERE id = ${id}
    `
  }
}

// Team functions
export async function getTeamsByWorkspace(workspaceId: string) {
  const db = ensureDatabase()
  return await db`
    SELECT * FROM teams WHERE workspace_id = ${workspaceId} ORDER BY name
  `
}

export async function createTeam(team: { id: string; workspace_id: string; name: string; color: string }) {
  const db = ensureDatabase()
  await db`
    INSERT INTO teams (id, workspace_id, name, color)
    VALUES (${team.id}, ${team.workspace_id}, ${team.name}, ${team.color})
  `
}

export async function updateTeam(id: string, updates: { name?: string; color?: string }) {
  const db = ensureDatabase()
  const fields = []
  const values = []

  if (updates.name !== undefined) {
    fields.push("name = $" + (fields.length + 2))
    values.push(updates.name)
  }
  if (updates.color !== undefined) {
    fields.push("color = $" + (fields.length + 2))
    values.push(updates.color)
  }

  if (fields.length > 0) {
    await db`
      UPDATE teams 
      SET ${db.unsafe(fields.join(", "))}
      WHERE id = ${id}
    `
  }
}

// Seat type functions
export async function getSeatTypesByTeam(teamId: string) {
  const db = ensureDatabase()
  return await db`
    SELECT * FROM seat_types WHERE team_id = ${teamId} ORDER BY name
  `
}

export async function createSeatType(seatType: { id: string; team_id: string; name: string; value: number }) {
  const db = ensureDatabase()
  await db`
    INSERT INTO seat_types (id, team_id, name, value)
    VALUES (${seatType.id}, ${seatType.team_id}, ${seatType.name}, ${seatType.value})
  `
}

export async function updateSeatType(id: string, updates: { name?: string; value?: number }) {
  const db = ensureDatabase()
  const fields = []

  if (updates.name !== undefined) {
    fields.push(`name = '${updates.name}'`)
  }
  if (updates.value !== undefined) {
    fields.push(`value = ${updates.value}`)
  }

  if (fields.length > 0) {
    await db`
      UPDATE seat_types 
      SET ${db.unsafe(fields.join(", "))}
      WHERE id = ${id}
    `
  }
}

export async function deleteSeatType(id: string) {
  const db = ensureDatabase()
  await db`DELETE FROM seat_types WHERE id = ${id}`
}

// Event functions
export async function getEventsByWorkspace(workspaceId: string) {
  const db = ensureDatabase()
  return await db`
    SELECT e.*, t.name as team_name, t.color as team_color
    FROM events e
    JOIN teams t ON e.team_id = t.id
    WHERE e.workspace_id = ${workspaceId}
    ORDER BY e.date, e.time
  `
}

export async function createEvent(event: {
  id: string
  workspace_id: string
  team_id: string
  opponent: string
  date: string
  time: string
}) {
  const db = ensureDatabase()
  await db`
    INSERT INTO events (id, workspace_id, team_id, opponent, date, time)
    VALUES (${event.id}, ${event.workspace_id}, ${event.team_id}, ${event.opponent}, ${event.date}, ${event.time})
  `
}

export async function updateEvent(
  id: string,
  updates: { team_id?: string; opponent?: string; date?: string; time?: string },
) {
  const db = ensureDatabase()
  const fields = []

  Object.entries(updates).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = '${value}'`)
    }
  })

  if (fields.length > 0) {
    await db`
      UPDATE events 
      SET ${db.unsafe(fields.join(", "))}
      WHERE id = ${id}
    `
  }
}

export async function deleteEvent(id: string) {
  const db = ensureDatabase()
  await db`DELETE FROM events WHERE id = ${id}`
}

// Ticket functions
export async function getTicketsByEvent(eventId: string) {
  const db = ensureDatabase()
  return await db`
    SELECT t.*, st.name as seat_type_name, st.value as seat_type_value
    FROM tickets t
    LEFT JOIN seat_types st ON t.seat_type_id = st.id
    WHERE t.event_id = ${eventId}
    ORDER BY st.name, t.custom_name
  `
}

export async function createTicket(ticket: {
  id: string
  event_id: string
  seat_type_id?: string
  custom_name?: string
  source?: string
  assigned_to?: string
}) {
  const db = ensureDatabase()
  await db`
    INSERT INTO tickets (id, event_id, seat_type_id, custom_name, source, assigned_to)
    VALUES (${ticket.id}, ${ticket.event_id}, ${ticket.seat_type_id || null}, ${ticket.custom_name || null}, ${ticket.source || null}, ${ticket.assigned_to || null})
  `
}

export async function updateTicket(id: string, updates: { assigned_to?: string; source?: string }) {
  const db = ensureDatabase()
  const fields = []

  Object.entries(updates).forEach(([key, value]) => {
    fields.push(`${key} = ${value === null ? "NULL" : `'${value}'`}`)
  })

  if (fields.length > 0) {
    await db`
      UPDATE tickets 
      SET ${db.unsafe(fields.join(", "))}
      WHERE id = ${id}
    `
  }
}

export async function deleteTicket(id: string) {
  const db = ensureDatabase()
  await db`DELETE FROM tickets WHERE id = ${id}`
}

// Request functions
export async function getRequestsByEvent(eventId: string) {
  const db = ensureDatabase()
  return await db`
    SELECT * FROM ticket_requests WHERE event_id = ${eventId} ORDER BY created_at
  `
}

export async function createRequest(request: { id: string; event_id: string; user_id: string; user_name: string }) {
  const db = ensureDatabase()
  await db`
    INSERT INTO ticket_requests (id, event_id, user_id, user_name)
    VALUES (${request.id}, ${request.event_id}, ${request.user_id}, ${request.user_name})
  `
}

export async function deleteRequest(id: string) {
  const db = ensureDatabase()
  await db`DELETE FROM ticket_requests WHERE id = ${id}`
}

// People functions
export async function getPeopleByWorkspace(workspaceId: string) {
  const db = ensureDatabase()
  return await db`
    SELECT * FROM people WHERE workspace_id = ${workspaceId} ORDER BY name
  `
}

export async function createPerson(person: { id: string; workspace_id: string; name: string }) {
  const db = ensureDatabase()
  await db`
    INSERT INTO people (id, workspace_id, name)
    VALUES (${person.id}, ${person.workspace_id}, ${person.name})
  `
}

export async function updatePerson(id: string, name: string) {
  const db = ensureDatabase()
  await db`
    UPDATE people SET name = ${name} WHERE id = ${id}
  `
}

export async function deletePerson(id: string) {
  const db = ensureDatabase()
  await db`DELETE FROM people WHERE id = ${id}`
}
