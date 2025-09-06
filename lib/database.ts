import { neon } from "@neondatabase/serverless"

let sql: ReturnType<typeof neon> | null = null

function getDB() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      console.warn("No DATABASE_URL found, database operations will be skipped")
      return null
    }
    sql = neon(connectionString)
  }
  return sql
}

function isServerSide() {
  return typeof window === "undefined"
}

export interface DatabaseEvent {
  id: string
  team_id: string
  opponent: string
  date: string
  time: string
  is_playoff: boolean
  workspace_id: string
  created_at: string
  updated_at: string
}

export interface DatabaseTicket {
  id: string
  event_id: string
  seat_type_id: string
  custom_name: string | null
  section: string | null
  row: string | null
  seat: string | null
  value: number
  source: string | null
  assigned_to: string | null
  assignment_type: string
  status: string
  price: number
  confirmed: boolean
  parking: boolean
  created_at: string
  updated_at: string
}

export interface DatabasePerson {
  id: string
  name: string
  company: string
  email: string | null
  phone: string | null
  workspace_id: string
  created_at: string
  updated_at: string
}

// Event operations
export async function getEventsFromDB(): Promise<DatabaseEvent[]> {
  try {
    if (!isServerSide()) {
      console.warn("Database operations only available on server side")
      return []
    }

    const db = getDB()
    if (!db) return []

    const events = await db`
      SELECT * FROM events 
      ORDER BY date DESC, time DESC
    `
    return events as DatabaseEvent[]
  } catch (error) {
    console.error("Error fetching events:", error)
    return []
  }
}

export async function createEventInDB(
  event: Omit<DatabaseEvent, "id" | "created_at" | "updated_at">,
): Promise<DatabaseEvent | null> {
  try {
    if (!isServerSide()) return null

    const db = getDB()
    if (!db) return null

    const [newEvent] = await db`
      INSERT INTO events (team_id, opponent, date, time, is_playoff, workspace_id)
      VALUES (${event.team_id}, ${event.opponent}, ${event.date}, ${event.time}, ${event.is_playoff}, ${event.workspace_id})
      RETURNING *
    `
    return newEvent as DatabaseEvent
  } catch (error) {
    console.error("Error creating event:", error)
    return null
  }
}

// Ticket operations
export async function getTicketsForEvent(eventId: string): Promise<DatabaseTicket[]> {
  try {
    if (!isServerSide()) return []

    const db = getDB()
    if (!db) return []

    const tickets = await db`
      SELECT * FROM tickets 
      WHERE event_id = ${eventId}
      ORDER BY created_at ASC
    `
    return tickets as DatabaseTicket[]
  } catch (error) {
    console.error("Error fetching tickets:", error)
    return []
  }
}

export async function createTicketInDB(
  ticket: Omit<DatabaseTicket, "id" | "created_at" | "updated_at">,
): Promise<DatabaseTicket | null> {
  try {
    if (!isServerSide()) return null

    const db = getDB()
    if (!db) return null

    const [newTicket] = await db`
      INSERT INTO tickets (
        event_id, seat_type_id, custom_name, section, row, seat, 
        value, source, assigned_to, assignment_type, status, 
        price, confirmed, parking
      )
      VALUES (
        ${ticket.event_id}, ${ticket.seat_type_id}, ${ticket.custom_name}, 
        ${ticket.section}, ${ticket.row}, ${ticket.seat}, ${ticket.value}, 
        ${ticket.source}, ${ticket.assigned_to}, ${ticket.assignment_type}, 
        ${ticket.status}, ${ticket.price}, ${ticket.confirmed}, ${ticket.parking}
      )
      RETURNING *
    `
    return newTicket as DatabaseTicket
  } catch (error) {
    console.error("Error creating ticket:", error)
    return null
  }
}

export async function updateTicketInDB(
  ticketId: string,
  updates: Partial<DatabaseTicket>,
): Promise<DatabaseTicket | null> {
  try {
    if (!isServerSide()) return null

    const db = getDB()
    if (!db) return null

    const setClause = Object.keys(updates)
      .filter((key) => key !== "id" && key !== "created_at")
      .map((key) => `${key} = $${key}`)
      .join(", ")

    if (!setClause) return null

    const [updatedTicket] = await db`
      UPDATE tickets 
      SET ${db.unsafe(setClause)}, updated_at = now()
      WHERE id = ${ticketId}
      RETURNING *
    `
    return updatedTicket as DatabaseTicket
  } catch (error) {
    console.error("Error updating ticket:", error)
    return null
  }
}

// People operations
export async function getPeopleFromDB(): Promise<DatabasePerson[]> {
  try {
    if (!isServerSide()) return []

    const db = getDB()
    if (!db) return []

    const people = await db`
      SELECT * FROM people 
      ORDER BY name ASC
    `
    return people as DatabasePerson[]
  } catch (error) {
    console.error("Error fetching people:", error)
    return []
  }
}

export async function createPersonInDB(
  person: Omit<DatabasePerson, "id" | "created_at" | "updated_at">,
): Promise<DatabasePerson | null> {
  try {
    if (!isServerSide()) return null

    const db = getDB()
    if (!db) return null

    const [newPerson] = await db`
      INSERT INTO people (name, company, email, phone, workspace_id)
      VALUES (${person.name}, ${person.company}, ${person.email}, ${person.phone}, ${person.workspace_id})
      RETURNING *
    `
    return newPerson as DatabasePerson
  } catch (error) {
    console.error("Error creating person:", error)
    return null
  }
}

export async function searchPeopleInDB(query: string): Promise<DatabasePerson[]> {
  try {
    if (!isServerSide()) return []

    const db = getDB()
    if (!db) return []

    const people = await db`
      SELECT * FROM people 
      WHERE name ILIKE ${`%${query}%`} OR company ILIKE ${`%${query}%`}
      ORDER BY name ASC
      LIMIT 10
    `
    return people as DatabasePerson[]
  } catch (error) {
    console.error("Error searching people:", error)
    return []
  }
}
