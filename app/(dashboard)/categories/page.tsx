'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Tags, Pencil, Trash2, GripVertical } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { CategoryForm } from '@/components/categories/category-form'
import { formatVND } from '@/lib/format'
import type { SpendingCategory } from '@/lib/types'
import { toast } from 'sonner'

const DEFAULT_CATEGORIES = [
  { name: 'Ăn uống', icon: '🍽️', color: '#F97316' },
  { name: 'Mua sắm', icon: '🛒', color: '#EC4899' },
  { name: 'Online', icon: '🌐', color: '#3B82F6' },
  { name: 'Di chuyển', icon: '🚗', color: '#EAB308' },
  { name: 'Thực phẩm', icon: '🥦', color: '#22C55E' },
  { name: 'Hóa đơn', icon: '💡', color: '#6366F1' },
  { name: 'Y tế', icon: '🏥', color: '#EF4444' },
  { name: 'Giáo dục', icon: '📚', color: '#8B5CF6' },
  { name: 'Du lịch', icon: '✈️', color: '#14B8A6' },
  { name: 'Giải trí', icon: '🎬', color: '#F43F5E' },
  { name: 'Khác', icon: '💼', color: '#6B7280' },
]

const fetchCategories = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('spending_categories')
    .select('*')
    .order('is_system', { ascending: false })
    .order('name')

  if (error) throw error
  return data as SpendingCategory[]
}

export default function CategoriesPage() {
  const { data: categories, error, isLoading, mutate } = useSWR('categories', fetchCategories)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<SpendingCategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<SpendingCategory | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)

  const handleCreateCategory = async (data: Partial<SpendingCategory>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      toast.error('Vui lòng đăng nhập lại')
      return
    }

    const { error } = await supabase.from('spending_categories').insert({
      ...data,
      user_id: user.id,
      is_system: false,
    })

    if (error) {
      toast.error('Không thể thêm danh mục', { description: error.message })
      throw error
    }

    toast.success('Đã thêm danh mục mới')
    mutate()
  }

  const handleUpdateCategory = async (data: Partial<SpendingCategory>) => {
    if (!editingCategory) return

    const supabase = createClient()
    const { error } = await supabase
      .from('spending_categories')
      .update(data)
      .eq('id', editingCategory.id)

    if (error) {
      toast.error('Không thể cập nhật danh mục', { description: error.message })
      throw error
    }

    toast.success('Đã cập nhật danh mục')
    setEditingCategory(null)
    mutate()
  }

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return

    const supabase = createClient()
    const { error } = await supabase
      .from('spending_categories')
      .delete()
      .eq('id', deletingCategory.id)

    if (error) {
      toast.error('Không thể xóa danh mục', { description: error.message })
      return
    }

    toast.success('Đã xóa danh mục')
    setDeletingCategory(null)
    mutate()
  }

  const handleSeedDefaults = async () => {
    setIsSeeding(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Vui lòng đăng nhập lại')
        return
      }

      const rows = DEFAULT_CATEGORIES.map((cat, index) => ({
        user_id: user.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        is_system: true,
        sort_order: index,
      }))

      const { error } = await supabase.from('spending_categories').insert(rows)

      if (error) {
        toast.error('Không thể tạo danh mục mặc định', { description: error.message })
        return
      }

      toast.success('Đã tạo danh mục mặc định')
      mutate()
    } finally {
      setIsSeeding(false)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Không thể tải danh mục</p>
        <Button variant="outline" className="mt-4" onClick={() => mutate()}>
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Danh mục chi tiêu</h1>
          <p className="text-muted-foreground">Quản lý các danh mục để phân loại giao dịch</p>
        </div>
        <div className="flex items-center gap-2">
          {categories && categories.length === 0 && (
            <Button variant="outline" onClick={handleSeedDefaults} disabled={isSeeding}>
              {isSeeding ? 'Đang tạo...' : 'Tạo danh mục mặc định'}
            </Button>
          )}
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="size-4" />
            Thêm danh mục
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : categories && categories.length > 0 ? (
        <div className="space-y-2">
          {categories.map((category) => (
            <Card key={category.id} className="group">
              <CardContent className="flex items-center gap-4 py-3">
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg text-xl"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{category.name}</span>
                    {category.is_system && (
                      <Badge variant="secondary" className="text-xs">
                        Mặc định
                      </Badge>
                    )}
                  </div>
                  {category.budget_limit != null && category.budget_limit > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Ngân sách: {formatVND(category.budget_limit)}
                    </p>
                  )}
                </div>

                <div
                  className="size-4 shrink-0 rounded-full"
                  style={{ backgroundColor: category.color }}
                />

                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    onClick={() => setEditingCategory(category)}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-destructive hover:text-destructive"
                    onClick={() => setDeletingCategory(category)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Empty
          icon={<Tags className="size-12 text-muted-foreground" />}
          title="Chưa có danh mục nào"
          description="Tạo danh mục chi tiêu để phân loại giao dịch của bạn"
          action={
            <div className="flex flex-col items-center gap-2">
              <Button onClick={handleSeedDefaults} disabled={isSeeding}>
                {isSeeding ? 'Đang tạo...' : 'Tạo danh mục mặc định'}
              </Button>
              <span className="text-sm text-muted-foreground">hoặc</span>
              <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                <Plus className="size-4" />
                Thêm danh mục thủ công
              </Button>
            </div>
          }
        />
      )}

      {/* Add/Edit Category Form */}
      <CategoryForm
        open={isFormOpen || !!editingCategory}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false)
            setEditingCategory(null)
          }
        }}
        category={editingCategory}
        onSubmit={editingCategory ? handleUpdateCategory : handleCreateCategory}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa danh mục này?</AlertDialogTitle>
            <AlertDialogDescription>
              Danh mục &ldquo;{deletingCategory?.name}&rdquo; sẽ bị xóa.
              Các giao dịch thuộc danh mục này sẽ không bị ảnh hưởng nhưng sẽ không còn liên kết danh mục.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteCategory}
            >
              Xóa danh mục
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
