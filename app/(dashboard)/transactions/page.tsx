'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Plus, Receipt, Filter, Mail, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { TransactionForm } from '@/components/transactions/transaction-form'
import { TransactionList } from '@/components/transactions/transaction-list'
import type { Transaction, Card, SpendingCategory } from '@/lib/types'
import { toast } from 'sonner'

const fetchTransactions = async (cardFilter: string, statusFilter: string) => {
  const supabase = createClient()
  let query = supabase
    .from('transactions')
    .select('*')
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (cardFilter && cardFilter !== 'all') {
    query = query.eq('card_id', cardFilter)
  }

  if (statusFilter === 'pending_review') {
    query = query.eq('status', 'pending_review')
  } else {
    // Default: hide rejected transactions
    query = query.neq('status', 'rejected')
  }

  const { data, error } = await query
  if (error) throw error
  return data as Transaction[]
}

const fetchPendingCount = async () => {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_review')
  if (error) throw error
  return count ?? 0
}

const fetchCards = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('is_active', true)
    .order('card_name')
  
  if (error) throw error
  return data as Card[]
}

const fetchCategories = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('spending_categories')
    .select('*')
    .order('name')
  
  if (error) throw error
  return data as SpendingCategory[]
}

export default function TransactionsPage() {
  const [cardFilter, setCardFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)

  const { data: transactions, error: txError, isLoading: txLoading, mutate: mutateTx } = useSWR(
    ['transactions', cardFilter, statusFilter],
    () => fetchTransactions(cardFilter, statusFilter)
  )
  const { data: pendingCount, mutate: mutatePendingCount } = useSWR('pending-tx-count', fetchPendingCount)
  const { data: cards, isLoading: cardsLoading } = useSWR('cards-active', fetchCards)
  const { data: categories, isLoading: catLoading } = useSWR('categories', fetchCategories)

  const isLoading = txLoading || cardsLoading || catLoading

  const handleCreateTransaction = async (data: Partial<Transaction>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      toast.error('Vui lòng đăng nhập lại')
      return
    }

    const { error } = await supabase.from('transactions').insert({
      ...data,
      user_id: user.id,
      source: 'manual',
    })

    if (error) {
      toast.error('Không thể thêm giao dịch', { description: error.message })
      throw error
    }

    // Update card balance
    const card = cards?.find((c) => c.id === data.card_id)
    if (card) {
      await supabase
        .from('cards')
        .update({ current_balance: card.current_balance + (data.amount || 0) })
        .eq('id', data.card_id)
    }

    toast.success('Đã thêm giao dịch')
    mutateTx()
  }

  const handleUpdateTransaction = async (data: Partial<Transaction>) => {
    if (!editingTransaction) return

    const supabase = createClient()
    const { error } = await supabase
      .from('transactions')
      .update(data)
      .eq('id', editingTransaction.id)

    if (error) {
      toast.error('Không thể cập nhật giao dịch', { description: error.message })
      throw error
    }

    // Update card balances if amount or card changed
    if (data.amount !== editingTransaction.amount || data.card_id !== editingTransaction.card_id) {
      const oldCard = cards?.find((c) => c.id === editingTransaction.card_id)
      const newCard = cards?.find((c) => c.id === data.card_id)
      
      if (oldCard) {
        await supabase
          .from('cards')
          .update({ current_balance: oldCard.current_balance - editingTransaction.amount })
          .eq('id', oldCard.id)
      }
      
      if (newCard) {
        await supabase
          .from('cards')
          .update({ current_balance: newCard.current_balance + (data.amount || 0) })
          .eq('id', newCard.id)
      }
    }

    toast.success('Đã cập nhật giao dịch')
    setEditingTransaction(null)
    mutateTx()
  }

  const handleDeleteTransaction = async () => {
    if (!deletingTransaction) return

    const supabase = createClient()
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', deletingTransaction.id)

    if (error) {
      toast.error('Không thể xóa giao dịch', { description: error.message })
      return
    }

    // Update card balance
    const card = cards?.find((c) => c.id === deletingTransaction.card_id)
    if (card) {
      await supabase
        .from('cards')
        .update({ current_balance: card.current_balance - deletingTransaction.amount })
        .eq('id', card.id)
    }

    toast.success('Đã xóa giao dịch')
    setDeletingTransaction(null)
    mutateTx()
    mutatePendingCount()
  }

  const handleConfirmTransaction = async (transaction: Transaction) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'confirmed' })
      .eq('id', transaction.id)

    if (error) {
      toast.error('Không thể xác nhận giao dịch', { description: error.message })
      return
    }

    // Update card balance now that it's confirmed
    const card = cards?.find((c) => c.id === transaction.card_id)
    if (card) {
      await supabase
        .from('cards')
        .update({ current_balance: card.current_balance + transaction.amount })
        .eq('id', card.id)
    }

    toast.success('Đã xác nhận giao dịch')
    mutateTx()
    mutatePendingCount()
  }

  const handleRejectTransaction = async (transaction: Transaction) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('transactions')
      .update({ status: 'rejected' })
      .eq('id', transaction.id)

    if (error) {
      toast.error('Không thể từ chối giao dịch', { description: error.message })
      return
    }

    toast.success('Đã từ chối giao dịch')
    mutateTx()
    mutatePendingCount()
  }

  const handleConfirmAll = async () => {
    const supabase = createClient()
    const pending = transactions?.filter((t) => t.status === 'pending_review') ?? []
    if (pending.length === 0) return

    const { error } = await supabase
      .from('transactions')
      .update({ status: 'confirmed' })
      .in('id', pending.map((t) => t.id))

    if (error) {
      toast.error('Không thể xác nhận tất cả', { description: error.message })
      return
    }

    // Update card balances
    const cardAmountMap = new Map<string, number>()
    for (const tx of pending) {
      cardAmountMap.set(tx.card_id, (cardAmountMap.get(tx.card_id) ?? 0) + tx.amount)
    }
    for (const [cardId, totalAmount] of cardAmountMap) {
      const card = cards?.find((c) => c.id === cardId)
      if (card) {
        await supabase
          .from('cards')
          .update({ current_balance: card.current_balance + totalAmount })
          .eq('id', cardId)
      }
    }

    toast.success(`Đã xác nhận ${pending.length} giao dịch`)
    mutateTx()
    mutatePendingCount()
  }

  if (txError) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Không thể tải giao dịch</p>
        <Button variant="outline" className="mt-4" onClick={() => mutateTx()}>
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Giao dịch</h1>
          <p className="text-muted-foreground">Theo dõi tất cả giao dịch thẻ tín dụng</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={cardFilter} onValueChange={setCardFilter}>
            <SelectTrigger className="w-[200px]">
              <Filter className="mr-2 size-4" />
              <SelectValue placeholder="Tất cả thẻ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả thẻ</SelectItem>
              {cards?.map((card) => (
                <SelectItem key={card.id} value={card.id}>
                  <div className="flex items-center gap-2">
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: card.card_color }}
                    />
                    {card.card_name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsFormOpen(true)} disabled={!cards?.length}>
            <Plus className="size-4" />
            Thêm giao dịch
          </Button>
        </div>
      </div>

      {/* Pending review banner */}
      {pendingCount != null && pendingCount > 0 && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-amber-600 dark:text-amber-400" />
            <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {pendingCount} giao dịch chờ xác nhận từ Gmail
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400"
              onClick={() => setStatusFilter(statusFilter === 'pending_review' ? 'all' : 'pending_review')}
            >
              {statusFilter === 'pending_review' ? 'Xem tất cả' : 'Xem chờ xác nhận'}
            </Button>
            {statusFilter === 'pending_review' && (
              <Button
                size="sm"
                className="gap-1"
                onClick={handleConfirmAll}
              >
                <CheckCircle2 className="size-4" />
                Xác nhận tất cả
              </Button>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      ) : !cards?.length ? (
        <Empty
          icon={<Receipt className="size-12 text-muted-foreground" />}
          title="Chưa có thẻ nào"
          description="Vui lòng thêm thẻ tín dụng trước khi ghi nhận giao dịch"
          action={
            <Button asChild>
              <a href="/cards">Thêm thẻ</a>
            </Button>
          }
        />
      ) : transactions && transactions.length > 0 ? (
        <TransactionList
          transactions={transactions}
          cards={cards}
          categories={categories || []}
          onEdit={setEditingTransaction}
          onDelete={setDeletingTransaction}
          onConfirm={handleConfirmTransaction}
          onReject={handleRejectTransaction}
        />
      ) : (
        <Empty
          icon={<Receipt className="size-12 text-muted-foreground" />}
          title="Chưa có giao dịch nào"
          description="Thêm giao dịch đầu tiên để bắt đầu theo dõi chi tiêu"
          action={
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="size-4" />
              Thêm giao dịch đầu tiên
            </Button>
          }
        />
      )}

      {/* Add/Edit Transaction Form */}
      <TransactionForm
        open={isFormOpen || !!editingTransaction}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false)
            setEditingTransaction(null)
          }
        }}
        transaction={editingTransaction}
        cards={cards || []}
        categories={categories || []}
        onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingTransaction} onOpenChange={() => setDeletingTransaction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa giao dịch này?</AlertDialogTitle>
            <AlertDialogDescription>
              Giao dịch này sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteTransaction}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
