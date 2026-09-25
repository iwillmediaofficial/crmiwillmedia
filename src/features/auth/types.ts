import { Profile } from '@/types/database.types'

export type UserRole = 'admin' | 'staff' | 'manager' | 'sales' | 'designer' | 'digital_marketing' | 'accounts'

export interface AuthState {
  user: {
    id: string
    email: string
  } | null
  profile: Profile | null
  isLoading: boolean
  isAdmin: boolean
  role: UserRole
}
