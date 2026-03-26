'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Wallet, Calendar, TrendingDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { InstallmentForm } from '@/components/installments/installment-form'
import { formatVND, formatDate, getNextDateForDay, daysUntil } from '@/lib/format'
import type { Installment, Card as CardType } from '@/lib/types'
import { toast } from 'sonner'

const fetchInstallments = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('installments')
    .select('*, cards(*)')
    .eq('is_active', true)
    .order('next_payment_date', { ascending: true })
  
  if (error) throw error
  return data as (Installment & { cards: CardType })[]
}

const fetchCards = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('is_active', true)
    .order('card_name')
  
  if (error) throw error
  return data as CardType[]
}

export default function InstallmentsPage() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingInstallment, setEditingInstallment] = useState<Installment | null>(null)
  const [deletingInstallment, setDeletingInstallment] = useState<Installment | null>(null)

  const { data: installments, error, isLoading, mutate } = useSWR('installments', fetchInstallments)
  const { data: cards, isLoading: cardsLoading } = useSWR('cards-active', fetchCards)

  const totalMonthlyPayment = installments?.reduce((sum, i) => sum + i.monthly_payment, 0) || 0
  const totalRemainingBalance = installments?.reduce((sum, i) => sum + i.remaining_balance, 0) || 0

  const handleCreateInstallment = async (data: Partial<Installment>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      toast.error('Vui lòng đăng nhập lại')
      return
    }

    const { error } = await supabase.from('installments').insert({
      ...data,
      user_id: user.id,
    })

    if (error) {
      toast.error('Không thể thêm trả góp', { description: error.message })
      throw error
    }

    toast.success('Đã thêm trả góp')
    mutate()
  }

  const handleUpdateInstallment = async (data: Partial<Installment>) => {
    if (!editingInstallment) return

    const supabase = createClient()
    const { error } = await supabase
      .from('installments')
      .update(data)
      .eq('id', editingInstallment.id)

    if (error) {
      toast.error('Không thể cập nhật trả góp', { description: error.message })
      throw error
    }

    toast.success('Đã cập nhật trả góp')
    setEditingInstallment(null)
    mutate()
  }

  const handleDeleteInstallment = async () => {
    if (!deletingInstallment) return

    const supabase = createClient()
    const { error } = await supabase
      .from('installments')
      .delete()
      .eq('id', deletingInstallment.id)

    if (error) {
      toast.error('Không thể xóa trả góp', { description: error.message })
      return
    }

    toast.success('Đã xóa trả góp')
    setDeletingInstallment(null)
    mutate()
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Không thể tải danh sách trả góp</p>
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
          <h1 className="text-2xl font-bold text-foreground">Trả góp</h1>
          <p className="text-muted-foreground">Quản lý các khoản trả góp đang hoạt động</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} disabled={!cards?.length}>
          <Plus className="size-4" />
          Thêm trả góp
        </Button>
      </div>

      {/* Summary Cards */}
      {installments && installments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng trả hàng tháng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatVND(totalMonthlyPayment)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tổng dư nợ còn lại
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatVND(totalRemainingBalance)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Số khoản trả góp
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{installments.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {isLoading || cardsLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))}
        </div>
      ) : !cards?.length ? (
        <Empty
          icon={<Wallet className="size-12 text-muted-foreground" />}
          title="Chưa có thẻ nào"
          description="Vui lòng thêm thẻ tín dụng trước khi ghi nhận trả góp"
          action={
            <Button asChild>
              <a href="/cards">Thêm thẻ</a>
            </Button>
          }
        />
      ) : installments && installments.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {installments.map((installment) => {
            const progressPercent = ((installment.total_months - installment.remaining_months) / installment.total_months) * 100
            const card = installment.cards

            return (
              <Card 
                key={installment.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setEditingInstallment(installment)}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-foreground">
                        {installment.merchant_name || 'Trả góp'}
                      </h3>
                      {installment.description && (
                        <p className="text-sm text-muted-foreground">{installment.description}</p>
                      )}
                    </div>
                    {card && (
                      <Badge 
                        variant="secondary"
                        style={{ 
                          backgroundColor: `${card.card_color}20`,
                          color: card.card_color,
                        }}
                      >
                        {card.card_name}
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Hàng tháng</span>
                      <span className="font-semibold text-foreground">
                        {formatVND(installment.monthly_payment)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {installment.total_months - installment.remaining_months}/{installment.total_months} kỳ
                        </span>
                        <span>{progressPercent.toFixed(0)}%</span>
                      </div>
                      <Progress value={progressPercent} className="h-2" />
                    </div>

                    <div className="flex items-center justify-between text-sm pt-2 border-t">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <TrendingDown className="size-4" />
                        <span>Còn lại</span>
                      </div>
                      <span className="font-medium text-foreground">
                        {formatVND(installment.remaining_balance)}
                      </span>
                    </div>

                    {installment.next_payment_date && (
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="size-4" />
                          <span>Kỳ tiếp theo</span>
                        </div>
                        <span className="font-medium text-foreground">
                          {formatDate(installment.next_payment_date)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Empty
          icon={<Wallet className="size-12 text-muted-foreground" />}
          title="Chưa có trả góp nào"
          description="Thêm khoản trả góp đầu tiên để theo dõi"
          action={
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="size-4" />
              Thêm trả góp đầu tiên
            </Button>
          }
        />
      )}

      {/* Add/Edit Installment Form */}
      <InstallmentForm
        open={isFormOpen || !!editingInstallment}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false)
            setEditingInstallment(null)
          }
        }}
        installment={editingInstallment}
        cards={cards || []}
        onSubmit={editingInstallment ? handleUpdateInstallment : handleCreateInstallment}
        onDelete={editingInstallment ? () => setDeletingInstallment(editingInstallment) : undefined}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingInstallment} onOpenChange={() => setDeletingInstallment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa trả góp này?</AlertDialogTitle>
            <AlertDialogDescription>
              Khoản trả góp &ldquo;{deletingInstallment?.merchant_name || 'Trả góp'}&rdquo; sẽ bị xóa. 
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteInstallment}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
