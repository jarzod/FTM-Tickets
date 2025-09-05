export interface Person {
  id: string
  name: string
  company: string
  email?: string
  phone?: string
  assignmentHistory: AssignmentHistory[]
  createdAt: string
  updatedAt: string
}

export interface AssignmentHistory {
  id: string
  eventId: string
  eventName: string
  date: string
  seatType: string
  assignmentType: "sold" | "team" | "donated" | "gifted" | "traded"
  price: number
  confirmed: boolean
  createdAt: string
}

const PEOPLE_STORAGE_KEY = "ticket_scheduler_people"

// Get all people from localStorage
export function getPeople(): Person[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(PEOPLE_STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error("Error reading people:", error)
  }

  return []
}

// Save people to localStorage
export function setPeople(people: Person[]): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people))
  } catch (error) {
    console.error("Error saving people:", error)
  }
}

// Add or update person
export function addOrUpdatePerson(
  personData: Omit<Person, "id" | "assignmentHistory" | "createdAt" | "updatedAt">,
): Person {
  const people = getPeople()

  // Check if person already exists by name and company
  const existingPersonIndex = people.findIndex(
    (p) =>
      p.name.toLowerCase() === personData.name.toLowerCase() &&
      p.company.toLowerCase() === personData.company.toLowerCase(),
  )

  if (existingPersonIndex !== -1) {
    // Update existing person
    const updatedPerson: Person = {
      ...people[existingPersonIndex],
      ...personData,
      updatedAt: new Date().toISOString(),
    }
    people[existingPersonIndex] = updatedPerson
    setPeople(people)
    return updatedPerson
  } else {
    // Create new person
    const newPerson: Person = {
      ...personData,
      id: crypto.randomUUID(),
      assignmentHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    people.push(newPerson)
    setPeople(people)
    return newPerson
  }
}

// Add assignment to person's history
export function addAssignmentHistory(
  personName: string,
  company: string,
  assignment: Omit<AssignmentHistory, "id" | "createdAt">,
): void {
  const people = getPeople()

  const safeCompany = company || ""

  const personIndex = people.findIndex(
    (p) => p.name.toLowerCase() === personName.toLowerCase() && p.company.toLowerCase() === safeCompany.toLowerCase(),
  )

  if (personIndex !== -1) {
    const historyEntry: AssignmentHistory = {
      ...assignment,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    }

    people[personIndex].assignmentHistory.push(historyEntry)
    people[personIndex].updatedAt = new Date().toISOString()
    setPeople(people)
  }
}

// Search people by name or company
export function searchPeople(query: string): Person[] {
  if (!query.trim()) return []

  const people = getPeople()
  const searchTerm = query.toLowerCase()

  const existingEventIds = new Set()
  if (typeof window !== "undefined") {
    try {
      const events = JSON.parse(localStorage.getItem("ticket_scheduler_events") || "[]")
      events.forEach((event: any) => existingEventIds.add(event.id))
    } catch (error) {
      console.error("Error reading events for filtering:", error)
    }
  }

  return people
    .filter(
      (person) => person.name.toLowerCase().includes(searchTerm) || person.company.toLowerCase().includes(searchTerm),
    )
    .map((person) => ({
      ...person,
      assignmentHistory: person.assignmentHistory.filter((history) => existingEventIds.has(history.eventId)),
    }))
    .slice(0, 10) // Limit to 10 results for performance
}

// Get person by name and company
export function getPersonByNameAndCompany(name: string, company: string): Person | null {
  const people = getPeople()

  const safeCompany = company || ""

  return (
    people.find(
      (p) => p.name.toLowerCase() === name.toLowerCase() && p.company.toLowerCase() === safeCompany.toLowerCase(),
    ) || null
  )
}

// Get top ticket holders
export function getTopTicketHolders(
  limit = 10,
): Array<{ person: Person; totalAssignments: number; totalRevenue: number }> {
  const people = getPeople()

  return people
    .map((person) => ({
      person,
      totalAssignments: person.assignmentHistory.length,
      totalRevenue: person.assignmentHistory
        .filter((h) => h.assignmentType === "sold" && h.confirmed)
        .reduce((sum, h) => sum + h.price, 0),
    }))
    .sort((a, b) => b.totalAssignments - a.totalAssignments)
    .slice(0, limit)
}

export function deletePerson(personId: string): boolean {
  const people = getPeople()
  const initialLength = people.length
  const filteredPeople = people.filter((p) => p.id !== personId)

  if (filteredPeople.length < initialLength) {
    setPeople(filteredPeople)
    return true
  }
  return false
}

export function mergePeople(keepPersonId: string, mergePersonId: string): boolean {
  const people = getPeople()
  const keepPerson = people.find((p) => p.id === keepPersonId)
  const mergePerson = people.find((p) => p.id === mergePersonId)

  if (!keepPerson || !mergePerson) return false

  // Merge assignment histories
  keepPerson.assignmentHistory = [...keepPerson.assignmentHistory, ...mergePerson.assignmentHistory]
  keepPerson.updatedAt = new Date().toISOString()

  // Remove the merged person
  const updatedPeople = people.filter((p) => p.id !== mergePersonId)
  setPeople(updatedPeople)
  return true
}
