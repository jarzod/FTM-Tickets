"use client"

import { useState, useEffect, createContext, useContext, type ReactNode } from "react"
import {
  type Person,
  type AssignmentHistory,
  getPeople,
  addOrUpdatePerson,
  addAssignmentHistory,
  searchPeople,
  getPersonByNameAndCompany,
  getTopTicketHolders,
  deletePerson,
  mergePeople,
} from "@/lib/people"

interface PeopleContextType {
  people: Person[]
  loading: boolean
  addOrUpdatePerson: (personData: Omit<Person, "id" | "assignmentHistory" | "createdAt" | "updatedAt">) => Person
  addAssignmentHistory: (
    personName: string,
    company: string,
    assignment: Omit<AssignmentHistory, "id" | "createdAt">,
  ) => void
  searchPeople: (query: string) => Person[]
  getPersonByNameAndCompany: (name: string, company: string) => Person | null
  getTopTicketHolders: (limit?: number) => Array<{ person: Person; totalAssignments: number; totalRevenue: number }>
  refreshPeople: () => void
  deletePerson: (personId: string) => boolean
  mergePeople: (keepPersonId: string, mergePersonId: string) => boolean
}

const PeopleContext = createContext<PeopleContextType | undefined>(undefined)

export function PeopleProvider({ children }: { children: ReactNode }) {
  const [people, setPeopleState] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)

  const refreshPeople = () => {
    const currentPeople = getPeople()
    setPeopleState(currentPeople)
  }

  useEffect(() => {
    refreshPeople()
    setLoading(false)
  }, [])

  const addOrUpdatePersonHandler = (
    personData: Omit<Person, "id" | "assignmentHistory" | "createdAt" | "updatedAt">,
  ): Person => {
    const person = addOrUpdatePerson(personData)
    refreshPeople()
    return person
  }

  const addAssignmentHistoryHandler = (
    personName: string,
    company: string,
    assignment: Omit<AssignmentHistory, "id" | "createdAt">,
  ): void => {
    addAssignmentHistory(personName, company, assignment)
    refreshPeople()
  }

  const deletePersonHandler = (personId: string): boolean => {
    const result = deletePerson(personId)
    if (result) {
      refreshPeople()
    }
    return result
  }

  const mergePeopleHandler = (keepPersonId: string, mergePersonId: string): boolean => {
    const result = mergePeople(keepPersonId, mergePersonId)
    if (result) {
      refreshPeople()
    }
    return result
  }

  return (
    <PeopleContext.Provider
      value={{
        people,
        loading,
        addOrUpdatePerson: addOrUpdatePersonHandler,
        addAssignmentHistory: addAssignmentHistoryHandler,
        searchPeople,
        getPersonByNameAndCompany,
        getTopTicketHolders,
        refreshPeople,
        deletePerson: deletePersonHandler,
        mergePeople: mergePeopleHandler,
      }}
    >
      {children}
    </PeopleContext.Provider>
  )
}

export function usePeople() {
  const context = useContext(PeopleContext)
  if (context === undefined) {
    throw new Error("usePeople must be used within a PeopleProvider")
  }
  return context
}
