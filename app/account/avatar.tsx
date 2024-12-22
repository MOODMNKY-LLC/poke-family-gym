'use client'
import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from "@/components/ui/button"
import { Upload, Loader2, User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface AvatarUploadProps {
  uid: string
  url: string | null
  size?: number
  onUpload: (url: string) => void
}

export function AvatarUpload({
  uid,
  url: initialUrl,
  size = 150,
  onUpload,
}: AvatarUploadProps) {
  const supabase = createClient()
  const [uploading, setUploading] = useState(false)

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true)

      const file = event.target.files?.[0]
      if (!file) throw new Error('No file selected')
      if (!uid) throw new Error('No user ID provided')

      const fileExt = file.name.split('.').pop()
      const filePath = `${uid}/${Math.random()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      onUpload(filePath)
      toast.success('Avatar uploaded successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error uploading avatar')
      console.error(error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <Avatar 
        className={cn(
          "border-2 border-primary/20"
        )}
        style={{ 
          width: size, 
          height: size,
          minWidth: size,
          minHeight: size 
        }}
      >
        <AvatarImage src={initialUrl || undefined} />
        <AvatarFallback>
          {uid ? uid[0].toUpperCase() : <User className="w-6 h-6" />}
        </AvatarFallback>
      </Avatar>

      <div className="w-full">
        <Button
          variant="outline"
          className="relative w-full"
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Change Avatar
            </>
          )}
          <input
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            type="file"
            id="single"
            accept="image/*"
            onChange={uploadAvatar}
            disabled={uploading}
          />
        </Button>
      </div>
    </div>
  )
}