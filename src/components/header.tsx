"use client"

import { signOut, useSession } from "next-auth/react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function Header() {
  const { data: session } = useSession()

  return (
    <header className="flex items-center justify-between h-16 px-4 lg:px-6 bg-white border-b border-gray-200">
      <div className="flex items-center space-x-2 lg:space-x-4">
        <h2 className="text-sm lg:text-lg font-semibold text-gray-900 truncate">
          Welcome back, {session?.user?.email}
        </h2>
      </div>
      
      <div className="flex items-center space-x-2 lg:space-x-4">
        <div className="hidden lg:block">
          <span className="text-sm text-gray-500">
            {session?.user?.role?.replace('_', ' ')}
          </span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-full outline-none focus:ring-2 focus:ring-gray-300">
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarFallback className="text-sm bg-gray-200 text-gray-700">
                {session?.user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end">
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium text-sm">{session?.user?.email}</p>
                <p className="w-[200px] truncate text-xs text-muted-foreground">
                  Role: {session?.user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
            <DropdownMenuItem onClick={() => signOut()}>
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
