'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import type { SpendingCategory } from '@/lib/types'

const CATEGORY_COLORS = [
  '#3B82F6', '#22C55E', '#EF4444', '#8B5CF6', '#F97316',
  '#EC4899', '#6B7280', '#EAB308', '#14B8A6', '#F43F5E',
  '#6366F1', '#84CC16',
]

const CATEGORY_ICONS = [
  '🍽️', '🛒', '🌐', '🚗', '🥦', '💡', '🏥', '📚', '✈️', '🎬',
  '💼', '🏠', '👕', '💪', '🎁', '🐾', '📱', '☕', '🎮', '💰',
]

interface CategoryFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: SpendingCategory | null
  onSubmit: (data: Partial<SpendingCategory>) => Promise<void>
}

export function CategoryForm({ open, onOpenChange, category, onSubmit }: CategoryFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    icon: '💼',
    color: '#3B82F6',
    budget_limit: null as number | null,
  })

  useEffect(() => {
    if (open) {
      setFormData({
        name: category?.name || '',
        icon: category?.icon || '💼',
        color: category?.color || '#3B82F6',
        budget_limit: category?.budget_limit ?? null,
      })
    }
  }, [open, category])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</DialogTitle>
          <DialogDescription>
            {category ? 'Cập nhật thông tin danh mục chi tiêu' : 'Tạo danh mục chi tiêu mới để phân loại giao dịch'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="category_name">Tên danh mục *</FieldLabel>
              <Input
                id="category_name"
                placeholder="VD: Ăn uống, Mua sắm..."
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </Field>

            <Field>
              <FieldLabel>Biểu tượng</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    className={`flex size-9 items-center justify-center rounded-lg border-2 text-lg transition-all ${
                      formData.icon === icon
                        ? 'border-primary bg-primary/10 scale-110'
                        : 'border-transparent bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => setFormData((prev) => ({ ...prev, icon }))}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel>Màu sắc</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {CATEGORY_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`size-8 rounded-full border-2 transition-all ${
                      formData.color === color
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData((prev) => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="budget_limit">Giới hạn ngân sách (VND)</FieldLabel>
              <Input
                id="budget_limit"
                type="number"
                min={0}
                placeholder="Để trống nếu không giới hạn"
                value={formData.budget_limit ?? ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    budget_limit: e.target.value ? Number(e.target.value) : null,
                  }))
                }
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang lưu...
                </>
              ) : category ? (
                'Cập nhật'
              ) : (
                'Thêm danh mục'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
