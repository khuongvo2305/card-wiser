'use client'

import { useState, useEffect } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
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
import type { Installment, Card } from '@/lib/types'

interface InstallmentFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  installment?: Installment | null
  cards: Card[]
  onSubmit: (data: Partial<Installment>) => Promise<void>
  onDelete?: () => void
}

export function InstallmentForm({ 
  open, 
  onOpenChange, 
  installment, 
  cards,
  onSubmit,
  onDelete,
}: InstallmentFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Installment>>({
    card_id: installment?.card_id || '',
    original_amount: installment?.original_amount || 0,
    total_months: installment?.total_months || 12,
    monthly_payment: installment?.monthly_payment || 0,
    interest_rate: installment?.interest_rate || 0,
    remaining_months: installment?.remaining_months || 12,
    remaining_balance: installment?.remaining_balance || 0,
    merchant_name: installment?.merchant_name || '',
    description: installment?.description || '',
    start_date: installment?.start_date || new Date().toISOString().split('T')[0],
    next_payment_date: installment?.next_payment_date || null,
  })

  // Reset form when installment changes
  useEffect(() => {
    if (installment) {
      setFormData({
        card_id: installment.card_id,
        original_amount: installment.original_amount,
        total_months: installment.total_months,
        monthly_payment: installment.monthly_payment,
        interest_rate: installment.interest_rate,
        remaining_months: installment.remaining_months,
        remaining_balance: installment.remaining_balance,
        merchant_name: installment.merchant_name || '',
        description: installment.description || '',
        start_date: installment.start_date,
        next_payment_date: installment.next_payment_date,
      })
    } else {
      setFormData({
        card_id: cards[0]?.id || '',
        original_amount: 0,
        total_months: 12,
        monthly_payment: 0,
        interest_rate: 0,
        remaining_months: 12,
        remaining_balance: 0,
        merchant_name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        next_payment_date: null,
      })
    }
  }, [installment, cards])

  // Auto-calculate monthly payment and remaining balance
  useEffect(() => {
    if (formData.original_amount && formData.total_months && !installment) {
      const interestMultiplier = 1 + (formData.interest_rate || 0) / 100
      const totalWithInterest = formData.original_amount * interestMultiplier
      const monthly = totalWithInterest / formData.total_months
      
      setFormData((prev) => ({
        ...prev,
        monthly_payment: Math.round(monthly),
        remaining_balance: Math.round(totalWithInterest),
        remaining_months: formData.total_months,
      }))
    }
  }, [formData.original_amount, formData.total_months, formData.interest_rate, installment])

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

  const updateField = <K extends keyof Installment>(field: K, value: Installment[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{installment ? 'Chỉnh sửa trả góp' : 'Thêm trả góp'}</DialogTitle>
          <DialogDescription>
            {installment ? 'Cập nhật thông tin trả góp' : 'Nhập thông tin khoản trả góp mới'}
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
              <FieldLabel htmlFor="merchant_name">Nơi mua hàng</FieldLabel>
              <Input
                id="merchant_name"
                placeholder="VD: Thế Giới Di Động, Điện Máy Xanh..."
                value={formData.merchant_name || ''}
                onChange={(e) => updateField('merchant_name', e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="original_amount">Giá trị gốc (VND) *</FieldLabel>
              <Input
                id="original_amount"
                type="number"
                min={0}
                placeholder="20000000"
                value={formData.original_amount || ''}
                onChange={(e) => updateField('original_amount', Number(e.target.value))}
                required
                disabled={!!installment}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="total_months">Số kỳ *</FieldLabel>
                <Select
                  value={String(formData.total_months)}
                  onValueChange={(value) => updateField('total_months', Number(value))}
                  disabled={!!installment}
                >
                  <SelectTrigger id="total_months">
                    <SelectValue placeholder="Chọn số kỳ" />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 6, 9, 12, 18, 24, 36].map((months) => (
                      <SelectItem key={months} value={String(months)}>
                        {months} tháng
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="interest_rate">Lãi suất (%)</FieldLabel>
                <Input
                  id="interest_rate"
                  type="number"
                  min={0}
                  step={0.1}
                  placeholder="0"
                  value={formData.interest_rate || ''}
                  onChange={(e) => updateField('interest_rate', Number(e.target.value))}
                  disabled={!!installment}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="monthly_payment">Trả hàng tháng (VND)</FieldLabel>
                <Input
                  id="monthly_payment"
                  type="number"
                  value={formData.monthly_payment || ''}
                  onChange={(e) => updateField('monthly_payment', Number(e.target.value))}
                  disabled={!installment}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="remaining_months">Còn lại (kỳ)</FieldLabel>
                <Input
                  id="remaining_months"
                  type="number"
                  min={0}
                  max={formData.total_months}
                  value={formData.remaining_months || ''}
                  onChange={(e) => updateField('remaining_months', Number(e.target.value))}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="remaining_balance">Dư nợ còn lại (VND)</FieldLabel>
              <Input
                id="remaining_balance"
                type="number"
                value={formData.remaining_balance || ''}
                onChange={(e) => updateField('remaining_balance', Number(e.target.value))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="start_date">Ngày bắt đầu *</FieldLabel>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date || ''}
                  onChange={(e) => updateField('start_date', e.target.value)}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="next_payment_date">Ngày trả kế tiếp</FieldLabel>
                <Input
                  id="next_payment_date"
                  type="date"
                  value={formData.next_payment_date || ''}
                  onChange={(e) => updateField('next_payment_date', e.target.value || null)}
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="description">Mô tả</FieldLabel>
              <Textarea
                id="description"
                placeholder="Ghi chú thêm..."
                value={formData.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                rows={2}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
            {installment && onDelete && (
              <Button 
                type="button" 
                variant="destructive" 
                onClick={onDelete}
                className="sm:mr-auto"
              >
                <Trash2 className="size-4" />
                Xóa
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading || !formData.card_id}>
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang lưu...
                </>
              ) : installment ? (
                'Cập nhật'
              ) : (
                'Thêm trả góp'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
