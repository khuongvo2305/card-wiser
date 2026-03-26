'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, CreditCard as CreditCardIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
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
import { CardWidget } from '@/components/cards/card-widget'
import { CardForm } from '@/components/cards/card-form'
import type { Card } from '@/lib/types'
import { toast } from 'sonner'

const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Card[]
}

export default function CardsPage() {
  const { data: cards, error, isLoading, mutate } = useSWR('cards', fetcher)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingCard, setEditingCard] = useState<Card | null>(null)
  const [deletingCard, setDeletingCard] = useState<Card | null>(null)

  const handleCreateCard = async (data: Partial<Card>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      toast.error('Vui lòng đăng nhập lại')
      return
    }

    const { error } = await supabase.from('cards').insert({
      ...data,
      user_id: user.id,
    })

    if (error) {
      toast.error('Không thể thêm thẻ', { description: error.message })
      throw error
    }

    toast.success('Đã thêm thẻ mới')
    mutate()
  }

  const handleUpdateCard = async (data: Partial<Card>) => {
    if (!editingCard) return

    const supabase = createClient()
    const { error } = await supabase
      .from('cards')
      .update(data)
      .eq('id', editingCard.id)

    if (error) {
      toast.error('Không thể cập nhật thẻ', { description: error.message })
      throw error
    }

    toast.success('Đã cập nhật thẻ')
    setEditingCard(null)
    mutate()
  }

  const handleDeleteCard = async () => {
    if (!deletingCard) return

    const supabase = createClient()
    const { error } = await supabase
      .from('cards')
      .delete()
      .eq('id', deletingCard.id)

    if (error) {
      toast.error('Không thể xóa thẻ', { description: error.message })
      return
    }

    toast.success('Đã xóa thẻ')
    setDeletingCard(null)
    mutate()
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Không thể tải danh sách thẻ</p>
        <Button variant="outline" className="mt-4" onClick={() => mutate()}>
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Thẻ tín dụng</h1>
          <p className="text-muted-foreground">Quản lý tất cả thẻ tín dụng của bạn</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <Plus className="size-4" />
          Thêm thẻ
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[220px] rounded-xl" />
          ))}
        </div>
      ) : cards && cards.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <CardWidget
              key={card.id}
              card={card}
              onEdit={setEditingCard}
              onDelete={setDeletingCard}
              onViewDetails={setEditingCard}
            />
          ))}
        </div>
      ) : (
        <Empty
          icon={<CreditCardIcon className="size-12 text-muted-foreground" />}
          title="Chưa có thẻ nào"
          description="Thêm thẻ tín dụng đầu tiên của bạn để bắt đầu theo dõi chi tiêu"
          action={
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="size-4" />
              Thêm thẻ đầu tiên
            </Button>
          }
        />
      )}

      {/* Add/Edit Card Form */}
      <CardForm
        open={isFormOpen || !!editingCard}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false)
            setEditingCard(null)
          }
        }}
        card={editingCard}
        onSubmit={editingCard ? handleUpdateCard : handleCreateCard}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCard} onOpenChange={() => setDeletingCard(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa thẻ này?</AlertDialogTitle>
            <AlertDialogDescription>
              Thẻ &ldquo;{deletingCard?.card_name}&rdquo; và tất cả giao dịch liên quan sẽ bị xóa vĩnh viễn. 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteCard}
            >
              Xóa thẻ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
