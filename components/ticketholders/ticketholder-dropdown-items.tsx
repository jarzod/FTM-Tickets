"use client"

import { usePeople } from "@/hooks/use-people"
import { useAuth } from "@/hooks/use-auth"
import { User } from "lucide-react"

export function TicketholderDropdownItems() {
  const { people } = usePeople()
  const { setSelectedTicketholder, user } = useAuth()

  const handleSelectTicketholder = async (ticketholder: any) => {
    await setSelectedTicketholder(ticketholder)
  }

  return (
    <>
      {people.map((person) => (
        <button
          key={person.id}
          onClick={() => handleSelectTicketholder(person)}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-100 flex items-center ${
            user.selectedTicketholder?.id === person.id ? "bg-slate-100" : ""
          }`}
        >
          <User className="w-4 h-4 mr-2" />
          {person.name} {person.company && `(${person.company})`}
        </button>
      ))}
    </>
  )
}
