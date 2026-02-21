import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/components/ui'
import { useEffect } from 'react'
import {
    Users,
    Settings,
    ArrowLeft,
    X,
    Building,
} from 'lucide-react'
import { Organization } from '../hooks/useOrganization'
import { Avatar } from './ui'

interface OrganizationSidebarProps {
    isOpen: boolean
    onClose: () => void
    organization: Organization | null
}

interface NavItem {
    name: string
    href: string
    icon: any
}

export function OrganizationSidebar({ isOpen, onClose, organization }: OrganizationSidebarProps): JSX.Element {
    const location = useLocation()

    const navigation: NavItem[] = [
        { name: 'Back', href: '/organizations', icon: ArrowLeft },
        { name: 'Members', href: `/org/${organization?.slug}`, icon: Users },
        { name: 'Merchants', href: `/org/${organization?.slug}/merchants`, icon: Building },
        { name: 'Settings', href: `/org/${organization?.slug}/settings`, icon: Settings },
    ]

    // Close sidebar on route change (mobile only)
    useEffect(() => {
        const handleRouteChange = () => {
            if (window.innerWidth < 1024) {
                onClose()
            }
        }
        handleRouteChange()
    }, [location.pathname, onClose])

    // Prevent body scroll when sidebar is open on mobile
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    const isActivePath = (href: string) => {
        if (href === '/organizations' && location.pathname === '/organizations') return true

        // Settings
        if (href.includes('/settings')) return location.pathname.endsWith('/settings')

        // Merchants - check strictly or starts with for subpages of merchants
        if (href.includes('/merchants')) return location.pathname.includes('/merchants')

        // Members (Root of org) - Should be exact match for /org/:slug or /org/:slug/ (if trailing slash)
        if (href === `/org/${organization?.slug}`) {
            // Only active if exactly the org root (members)
            return location.pathname === href || location.pathname === href + '/'
        }

        return location.pathname === href
    }

    const navItemClasses = (active: boolean) =>
        cn(
            'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            active
                ? 'bg-primary/10 text-primary'
                : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
        )

    const iconClasses = (active: boolean) =>
        cn(
            'h-5 w-5 transition-colors',
            active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
        )

    const renderNavItem = (item: NavItem) => {
        const Icon = item.icon
        const active = isActivePath(item.href)
        return (
            <li key={item.name}>
                <Link
                    to={item.href}
                    className={navItemClasses(active)}
                >
                    <Icon className={iconClasses(active)} />
                    <span>{item.name}</span>
                </Link>
            </li>
        )
    }

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed left-0 top-0 h-screen w-64 flex flex-col border-r border-border bg-card shadow-lg z-50 transition-transform duration-300 ease-in-out",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="sticky top-0 flex h-16 items-center justify-between gap-2 px-6 bg-card border-b border-border z-10">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <Avatar src={organization?.avatar_url} fallback={organization?.name} size="sm" className="rounded-md" />
                        <span className="text-lg font-semibold text-foreground truncate">{organization?.name || 'Loading...'}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="lg:hidden p-1 rounded-md hover:bg-muted/40 transition-colors"
                    >
                        <X className="h-5 w-5 text-muted-foreground" />
                    </button>
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-4">
                    <ul className="space-y-1">
                        {navigation.map(renderNavItem)}
                    </ul>
                </nav>
            </aside>
        </>
    )
}
