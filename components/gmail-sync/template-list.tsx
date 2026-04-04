'use client'

import { useState } from 'react'
import { Pencil, Trash2, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TemplateForm } from './template-form'
import { createClient } from '@/lib/supabase/client'
import type { BankEmailTemplate } from '@/lib/types'
import { toast } from 'sonner'

interface TemplateListProps {
  templates: BankEmailTemplate[] | undefined
  isLoading: boolean
  onMutate: () => void
}

export function TemplateList({ templates, isLoading, onMutate }: TemplateListProps) {
  const [editingTemplate, setEditingTemplate] = useState<BankEmailTemplate | null>(null)
  const [deletingTemplate, setDeletingTemplate] = useState<BankEmailTemplate | null>(null)

  const handleUpdate = async (data: Partial<BankEmailTemplate>) => {
    if (!editingTemplate) return
    const supabase = createClient()
    const { error } = await supabase
      .from('bank_email_templates')
      .update(data)
      .eq('id', editingTemplate.id)

    if (error) {
      toast.error('Không thể cập nhật mẫu email', { description: error.message })
      throw error
    }

    toast.success('Đã cập nhật mẫu email')
    setEditingTemplate(null)
    onMutate()
  }

  const handleDelete = async () => {
    if (!deletingTemplate) return
    const supabase = createClient()
    const { error } = await supabase
      .from('bank_email_templates')
      .delete()
      .eq('id', deletingTemplate.id)

    if (error) {
      toast.error('Không thể xóa mẫu email', { description: error.message })
      return
    }

    toast.success('Đã xóa mẫu email')
    setDeletingTemplate(null)
    onMutate()
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    )
  }

  if (!templates || templates.length === 0) {
    return (
      <Empty
        icon={<Mail className="size-10 text-muted-foreground" />}
        title="Chưa có mẫu email nào"
        description="Thêm mẫu email ngân hàng để bắt đầu đồng bộ giao dịch tự động"
      />
    )
  }

  return (
    <>
      <div className="space-y-2">
        {templates.map((template) => (
          <Card key={template.id} className="group">
            <CardContent className="flex items-center gap-3 py-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                <Mail className="size-4 text-blue-500" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{template.bank_name}</span>
                  <Badge variant={template.is_active ? 'default' : 'secondary'} className="text-xs">
                    {template.is_active ? 'Đang hoạt động' : 'Tắt'}
                  </Badge>
                  {!template.amount_regex && (
                    <Badge variant="outline" className="text-xs">AI</Badge>
                  )}
                </div>
                <p className="truncate text-sm text-muted-foreground">{template.sender_email}</p>
              </div>

              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8"
                  onClick={() => setEditingTemplate(template)}
                >
                  <Pencil className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-destructive hover:text-destructive"
                  onClick={() => setDeletingTemplate(template)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <TemplateForm
        open={!!editingTemplate}
        onOpenChange={(open) => { if (!open) setEditingTemplate(null) }}
        template={editingTemplate}
        onSubmit={handleUpdate}
      />

      <AlertDialog open={!!deletingTemplate} onOpenChange={() => setDeletingTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa mẫu email này?</AlertDialogTitle>
            <AlertDialogDescription>
              Mẫu email của &ldquo;{deletingTemplate?.bank_name}&rdquo; sẽ bị xóa. Gmail Sync sẽ không còn đồng bộ email từ {deletingTemplate?.sender_email}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
