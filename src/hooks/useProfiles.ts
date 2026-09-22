import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { ProfileRow, UserRole, UserStatus } from '@/types/database'

const PROFILES_KEY = ['admin', 'profiles'] as const

export function useAllProfiles(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: PROFILES_KEY,
    enabled: options?.enabled ?? true,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as ProfileRow[]
    },
    staleTime: 10_000,
  })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      status,
      role,
    }: {
      id: string
      status?: UserStatus
      role?: UserRole
    }) => {
      const patch: Partial<Pick<ProfileRow, 'status' | 'role'>> = {}
      if (status) patch.status = status
      if (role) patch.role = role
      const { error } = await supabase.from('profiles').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_KEY })
    },
  })
}
