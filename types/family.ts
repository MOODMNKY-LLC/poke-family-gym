export interface FamilyMember {
  id: string
  displayName: string
  familyId: string
  fullName: string
  roleId: number
  avatarUrl?: string | null
  currentStatus?: string | null
  createdAt: string
  updatedAt: string
}

export interface Family {
  id: string
  name: string
  createdAt: string
  createdBy: string
  avatarUrl: string | null
  settings: {
    theme: string
    notifications: boolean
    allowSharing: boolean
  }
} 