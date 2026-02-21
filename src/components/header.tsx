import { Button, confirmModal } from '@/components/ui'
import { useAuth } from '../lib/auth'
import { LogOut, User, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

interface HeaderProps {
  onMenuClick: () => void
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const displayName = user?.display_name || user?.username || user?.email

  const handleLogout = async () => {
    if (isLoggingOut) {
      return
    }

    setIsLoggingOut(true)

    const confirmed = await confirmModal({
      title: 'Sign out',
      message: 'Are you sure you want to log out of Billing Portal?',
      confirmText: 'Sign out',
      cancelText: 'Cancel',
      type: 'warning',
    })

    if (confirmed) {
      logout()
    } else {
      setIsLoggingOut(false)
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center relative z-20">
      <div className="px-3 sm:px-6 w-full flex items-center justify-between gap-2 sm:gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="p-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">
              Welcome back, {displayName}!
            </h1>
            <p className="text-xs text-gray-600 hidden sm:block">
              {user?.role === 'admin'
                ? 'Administrator'
                : user?.role === 'support'
                  ? 'Support access'
                  : 'Standard access'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/profile')}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <User className="h-4 w-4" />
            <span>{user?.email}</span>
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Profile"
          >
            <User className="h-5 w-5" />
          </button>

          <Button
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="py-2 px-3 sm:px-4 flex items-center gap-2"
          >
            <LogOut className={`h-4 w-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
