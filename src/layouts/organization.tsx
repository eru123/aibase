import { Outlet, useParams } from 'react-router-dom'
import { OrganizationSidebar } from '../components/organization-sidebar'
import { Header } from '../components/header'
import { ProtectedRoute } from '../lib/auth'
import { useState, useEffect, useCallback } from 'react'
import { useOrganization } from '../hooks/useOrganization'

export function OrganizationLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const { organization, loading, refresh } = useOrganization()

    // Handle window resize to reset sidebar state based on screen size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setSidebarOpen(true)
            } else {
                setSidebarOpen(false)
            }
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])

    const toggleSidebar = useCallback(() => {
        setSidebarOpen(prev => !prev)
    }, [])

    const handleCloseSidebar = useCallback(() => {
        setSidebarOpen(false)
    }, [])

    if (loading && !organization) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500 animate-pulse">Loading Organization...</div>
            </div>
        )
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 flex overflow-hidden">
                <OrganizationSidebar
                    isOpen={sidebarOpen}
                    onClose={handleCloseSidebar}
                    organization={organization}
                />
                <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'} h-screen overflow-hidden`}>
                    <Header onMenuClick={toggleSidebar} />
                    <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-auto">
                        <Outlet context={{ organization, refresh }} />
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    )
}
