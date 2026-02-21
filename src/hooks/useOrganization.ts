import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'sonner'

export interface OrganizationMember {
    id: number
    username: string
    email: string
    role: 'owner' | 'admin' | 'viewer'
    organization_role: 'owner' | 'admin' | 'viewer'
    avatar_url?: string | null
    joined_at: string
}

export interface Organization {
    id: number
    name: string
    slug: string
    avatar_url?: string | null
    contact_phone?: string | null
    contact_email?: string | null
    created_at: string
    users: OrganizationMember[]
    organization_role: 'owner' | 'admin' | 'viewer'
}

export function useOrganization() {
    const { slug } = useParams<{ slug: string }>()
    const navigate = useNavigate()
    const [organization, setOrganization] = useState<Organization | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchOrganization = useCallback(async () => {
        if (!slug) return

        // Only set loading true if we change organizations or have no data
        if (!organization || organization.slug !== slug) {
            setLoading(true)
        }

        try {
            const response = await axios.get(`/api/organizations/${slug}`)
            setOrganization(response.data.data)
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load organization')
            navigate('/organizations')
        } finally {
            setLoading(false)
        }
    }, [slug, navigate, organization?.slug])

    useEffect(() => {
        fetchOrganization()
    }, [fetchOrganization])

    const refresh = () => fetchOrganization()

    return {
        organization,
        loading,
        slug,
        refresh
    }
}
