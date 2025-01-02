import { createClient } from './client'
import { FamilyMember } from '@/types/family'

// Helper function to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v))
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/([-_][a-z])/g, group =>
          group.toUpperCase().replace('-', '').replace('_', '')
        )]: toCamelCase(obj[key])
      }),
      {}
    )
  }
  return obj
}

// Helper function to convert camelCase to snake_case
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnakeCase(v))
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => ({
        ...result,
        [key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)]: toSnakeCase(obj[key])
      }),
      {}
    )
  }
  return obj
}

export const FamilyMembersAPI = {
  async getFamilyMembers(): Promise<FamilyMember[]> {
    try {
      const supabase = createClient()

      // Check auth state
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user) throw new Error('No authenticated user found')

      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', user.id)

      if (error) throw error

      // Transform the data to include full avatar URLs and convert to camelCase
      const membersWithAvatars = await Promise.all(data.map(async (member) => {
        const camelCaseMember = toCamelCase(member)
        if (camelCaseMember.avatarUrl) {
          const { data: { publicUrl } } = supabase
            .storage
            .from('avatars')
            .getPublicUrl(camelCaseMember.avatarUrl)
          
          return {
            ...camelCaseMember,
            avatarUrl: publicUrl
          }
        }
        return camelCaseMember
      }))

      return membersWithAvatars
    } catch (error) {
      console.error('Error fetching family members:', error)
      throw error
    }
  },

  async updateMemberAvatar(memberId: string, file: File): Promise<string> {
    try {
      const supabase = createClient()
      
      // Upload the file to Supabase storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${memberId}-${Date.now()}.${fileExt}`
      
      const { error: uploadError, data } = await supabase
        .storage
        .from('avatars')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      // Get the public URL
      const { data: { publicUrl } } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(fileName)

      // Update the member's avatarUrl
      const { error: updateError } = await supabase
        .from('family_members')
        .update(toSnakeCase({ avatarUrl: fileName }))
        .eq('id', memberId)

      if (updateError) throw updateError

      return publicUrl
    } catch (error) {
      console.error('Error updating avatar:', error)
      throw error
    }
  }
} 