'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { DocumentStoreAPI } from '@/lib/flowise/api'
import type { ProcessingConfig } from '@/lib/flowise/types'

const formSchema = z.object({
  files: z.any(),
  chunkSize: z.number().min(100).max(4000),
  chunkOverlap: z.number().min(0).max(1000),
  splitStrategy: z.enum(['token', 'sentence', 'paragraph']),
  embedModel: z.string().min(1),
})

interface DocumentUploadFormProps {
  onSuccess?: () => void
}

export function DocumentUploadForm({ onSuccess }: DocumentUploadFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chunkSize: 1000,
      chunkOverlap: 200,
      splitStrategy: 'token',
      embedModel: 'text-embedding-ada-002',
    },
  })

  return (
    <Form {...form}>
      <form onSubmit={async (e) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        const files = formData.getAll('files') as File[]
        
        if (files.length === 0) {
          toast.error('Please select at least one file')
          return
        }

        try {
          const config = form.getValues() as ProcessingConfig
          await DocumentStoreAPI.uploadDocuments(files, config)
          toast.success('Documents uploaded successfully')
          onSuccess?.()
        } catch (error) {
          console.error('Upload error:', error)
          toast.error('Failed to upload documents')
        }
      }} className="space-y-4">
        <FormField
          control={form.control}
          name="files"
          render={() => (
            <FormItem>
              <FormLabel>Files</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  name="files"
                  multiple
                  accept=".txt,.pdf,.json,.md,.doc,.docx"
                />
              </FormControl>
              <FormDescription>
                Select one or more files to upload
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="chunkSize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chunk Size</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Number of tokens per chunk (100-4000)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="chunkOverlap"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Chunk Overlap</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  onChange={e => field.onChange(Number(e.target.value))}
                />
              </FormControl>
              <FormDescription>
                Number of overlapping tokens between chunks (0-1000)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="splitStrategy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Split Strategy</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a strategy" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="token">By Token</SelectItem>
                  <SelectItem value="sentence">By Sentence</SelectItem>
                  <SelectItem value="paragraph">By Paragraph</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                How to split the documents into chunks
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="embedModel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Embedding Model</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormDescription>
                The model to use for generating embeddings
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button type="submit">
            Upload and Process
          </Button>
        </div>
      </form>
    </Form>
  )
} 