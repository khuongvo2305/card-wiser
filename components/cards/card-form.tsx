'use client'

import { useState } from 'react'
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
import type { Card } from '@/lib/types'

const CARD_COLORS = [
  { name: 'Xanh dương', value: '#3B82F6' },
  { name: 'Xanh lá', value: '#22C55E' },
  { name: 'Đỏ', value: '#EF4444' },
  { name: 'Tím', value: '#8B5CF6' },
  { name: 'Cam', value: '#F97316' },
  { name: 'Hồng', value: '#EC4899' },
  { name: 'Xám', value: '#6B7280' },
  { name: 'Vàng', value: '#EAB308' },
]

const BANKS = [
  'Vietcombank',
  'Techcombank',
  'VPBank',
  'MB Bank',
  'ACB',
  'BIDV',
  'Agribank',
  'Sacombank',
  'TPBank',
  'VIB',
  'SHB',
  'HDBank',
  'MSB',
  'OCB',
  'SeABank',
  'Khác',
]

interface CardFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  card?: Card | null
  onSubmit: (data: Partial<Card>) => Promise<void>
}

export function CardForm({ open, onOpenChange, card, onSubmit }: CardFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Partial<Card>>({
    card_name: card?.card_name || '',
    bank_name: card?.bank_name || '',
    last_four_digits: card?.last_four_digits || '',
    credit_limit: card?.credit_limit || 0,
    current_balance: card?.current_balance || 0,
    statement_date: card?.statement_date || 1,
    due_date: card?.due_date || 15,
    billing_cycle_start: card?.billing_cycle_start || null,
    billing_cycle_end: card?.billing_cycle_end || null,
    card_color: card?.card_color || '#3B82F6',
    notes: card?.notes || '',
  })

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

  const updateField = <K extends keyof Card>(field: K, value: Card[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{card ? 'Chỉnh sửa thẻ' : 'Thêm thẻ mới'}</DialogTitle>
          <DialogDescription>
            {card ? 'Cập nhật thông tin thẻ tín dụng của bạn' : 'Nhập thông tin thẻ tín dụng mới'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="card_name">Tên thẻ *</FieldLabel>
              <Input
                id="card_name"
                placeholder="VD: Thẻ mua sắm"
                value={formData.card_name}
                onChange={(e) => updateField('card_name', e.target.value)}
                required
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="bank_name">Ngân hàng *</FieldLabel>
              <Select
                value={formData.bank_name}
                onValueChange={(value) => updateField('bank_name', value)}
              >
                <SelectTrigger id="bank_name">
                  <SelectValue placeholder="Chọn ngân hàng" />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((bank) => (
                    <SelectItem key={bank} value={bank}>
                      {bank}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="last_four_digits">4 số cuối thẻ</FieldLabel>
              <Input
                id="last_four_digits"
                placeholder="1234"
                maxLength={4}
                value={formData.last_four_digits || ''}
                onChange={(e) => updateField('last_four_digits', e.target.value.replace(/\D/g, ''))}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="credit_limit">Hạn mức (VND) *</FieldLabel>
                <Input
                  id="credit_limit"
                  type="number"
                  min={0}
                  placeholder="50000000"
                  value={formData.credit_limit || ''}
                  onChange={(e) => updateField('credit_limit', Number(e.target.value))}
                  required
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="current_balance">Dư nợ hiện tại (VND)</FieldLabel>
                <Input
                  id="current_balance"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={formData.current_balance || ''}
                  onChange={(e) => updateField('current_balance', Number(e.target.value))}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="statement_date">Ngày sao kê *</FieldLabel>
                <Select
                  value={String(formData.statement_date)}
                  onValueChange={(value) => updateField('statement_date', Number(value))}
                >
                  <SelectTrigger id="statement_date">
                    <SelectValue placeholder="Chọn ngày" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={String(day)}>
                        Ngày {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="due_date">Ngày đến hạn *</FieldLabel>
                <Select
                  value={String(formData.due_date)}
                  onValueChange={(value) => updateField('due_date', Number(value))}
                >
                  <SelectTrigger id="due_date">
                    <SelectValue placeholder="Chọn ngày" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <SelectItem key={day} value={String(day)}>
                        Ngày {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="card_color">Màu thẻ</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {CARD_COLORS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    className={`size-8 rounded-full border-2 transition-all ${
                      formData.card_color === color.value
                        ? 'border-foreground scale-110'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => updateField('card_color', color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="notes">Ghi chú</FieldLabel>
              <Textarea
                id="notes"
                placeholder="Ghi chú thêm về thẻ..."
                value={formData.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={3}
              />
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang lưu...
                </>
              ) : card ? (
                'Cập nhật'
              ) : (
                'Thêm thẻ'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
