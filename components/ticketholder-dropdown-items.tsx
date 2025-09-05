"use client"

import { usePeople } from "@/hooks/use-people"
import { useAuth } from "@/hooks/use-auth"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
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
        <DropdownMenuItem
          key={person.id}
          onClick={() => handleSelectTicketholder(person)}
          className={user.selectedTicketholder?.id === person.id ? "bg-slate-100" : ""}
        >
          <User className="w-4 h-4 mr-2" />
          {person.name} {person.company && `(${person.company})`}
        </DropdownMenuItem>
      ))}
    </>
  )
}
