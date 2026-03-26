'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import type { Transaction, Card, SpendingCategory } from '@/lib/types'

interface TransactionFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction?: Transaction | null
  cards: Card[]
  categories: SpendingCategory[]
  onSubmit: (data: Partial<Transaction>) => Promise<void>
}

export function TransactionForm({ 
  open, 
  onOpenChange, 
  transaction, 
  cards,
  categories,
  onSubmit 
}: TransactionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Transaction>>({
    card_id: transaction?.card_id || '',
    category_id: transaction?.category_id || null,
    amount: transaction?.amount || 0,
    merchant_name: transaction?.merchant_name || '',
    description: transaction?.description || '',
    transaction_date: transaction?.transaction_date || new Date().toISOString().split('T')[0],
    notes: transaction?.notes || '',
  })

  // Reset form when transaction changes
  useEffect(() => {
    if (transaction) {
      setFormData({
        card_id: transaction.card_id,
        category_id: transaction.category_id,
        amount: transaction.amount,
        merchant_name: transaction.merchant_name || '',
        description: transaction.description || '',
        transaction_date: transaction.transaction_date,
        notes: transaction.notes || '',
      })
    } else {
      setFormData({
        card_id: cards[0]?.id || '',
        category_id: null,
        amount: 0,
        merchant_name: '',
        description: '',
        transaction_date: new Date().toISOString().split('T')[0],
        notes: '',
      })
    }
  }, [transaction, cards])

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

  const updateField = <K extends keyof Transaction>(field: K, value: Transaction[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transaction ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch'}</DialogTitle>
          <DialogDescription>
            {transaction ? 'Cập nhật thông tin giao dịch' : 'Nhập thông tin giao dịch mới'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="card_id">Thẻ *</FieldLabel>
              <Select
                value={formData.card_id}
                onValueChange={(value) => updateField('card_id', value)}
              >
                <SelectTrigger id="card_id">
                  <SelectValue placeholder="Chọn thẻ" />
                </SelectTrigger>
                <SelectContent>
                  {cards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="size-3 rounded-full"
                          style={{ backgroundColor: card.card_color }}
                        />
                        {card.card_name} - {card.bank_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="amount">Số tiền (VND) *</FieldLabel>
              <Input
                id="amount"
                type="number"
                min={0}
                placeholder="500000"
                value={formData.amount || ''}
                onChange={(e) => updateField('amount', Number(e.target.value))}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="merchant_name">Nơi giao dịch</FieldLabel>
              <Input
                id="merchant_name"
                placeholder="VD: Shopee, Grab, Big C..."
                value={formData.merchant_name || ''}
                onChange={(e) => updateField('merchant_name', e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="category_id">Danh mục</FieldLabel>
              <Select
                value={formData.category_id || 'none'}
                onValueChange={(value) => updateField('category_id', value === 'none' ? null : value)}
              >
                <SelectTrigger id="category_id">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Không phân loại</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="size-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="transaction_date">Ngày giao dịch *</FieldLabel>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date || ''}
                onChange={(e) => updateField('transaction_date', e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="description">Mô tả</FieldLabel>
              <Input
                id="description"
                placeholder="Mô tả ngắn gọn"
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">Ghi chú</FieldLabel>
              <Textarea
                id="notes"
                placeholder="Ghi chú thêm..."
                value={formData.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={2}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading || !formData.card_id}>
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang lưu...
                </>
              ) : transaction ? (
                'Cập nhật'
              ) : (
                'Thêm giao dịch'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
