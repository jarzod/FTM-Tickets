"use client"

import type React from "react"

import { usePeople } from "@/hooks/use-people"
import { useAuth } from "@/hooks/use-auth"
import { User } from "lucide-react"

function DropdownItem({
  children,
  onClick,
  className,
}: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button
      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center ${className || ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function TicketholderDropdownItems() {
  const { people } = usePeople()
  const { setSelectedTicketholder, user } = useAuth()

  const handleSelectTicketholder = async (ticketholder: any) => {
    await setSelectedTicketholder(ticketholder)
  }

  return (
    <>
      {people.map((person) => (
        <DropdownItem
          key={person.id}
          onClick={() => handleSelectTicketholder(person)}
          className={user.selectedTicketholder?.id === person.id ? "bg-slate-100" : ""}
        >
          <User className="w-4 h-4 mr-2" />
          {person.name} {person.company && `(${person.company})`}
        </DropdownItem>
      ))}
    </>
  )
}
