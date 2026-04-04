'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import type { BankEmailTemplate } from '@/lib/types'

const schema = z.object({
  bank_name: z.string().min(1, 'Tên ngân hàng không được để trống'),
  sender_email: z.string().email('Email không hợp lệ'),
  subject_pattern: z.string().optional(),
  amount_regex: z.string().optional(),
  merchant_regex: z.string().optional(),
  date_regex: z.string().optional(),
  card_regex: z.string().optional(),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface TemplateFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template?: BankEmailTemplate | null
  onSubmit: (data: Partial<BankEmailTemplate>) => Promise<void>
}

export function TemplateForm({ open, onOpenChange, template, onSubmit }: TemplateFormProps) {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bank_name: template?.bank_name ?? '',
      sender_email: template?.sender_email ?? '',
      subject_pattern: template?.subject_pattern ?? '',
      amount_regex: template?.amount_regex ?? '',
      merchant_regex: template?.merchant_regex ?? '',
      date_regex: template?.date_regex ?? '',
      card_regex: template?.card_regex ?? '',
      is_active: template?.is_active ?? true,
    },
  })

  // Reset form when template changes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset()
    } else if (template) {
      form.reset({
        bank_name: template.bank_name,
        sender_email: template.sender_email ?? '',
        subject_pattern: template.subject_pattern ?? '',
        amount_regex: template.amount_regex ?? '',
        merchant_regex: template.merchant_regex ?? '',
        date_regex: template.date_regex ?? '',
        card_regex: template.card_regex ?? '',
        is_active: template.is_active,
      })
    }
    onOpenChange(open)
  }

  const handleSubmit = async (values: FormValues) => {
    setIsLoading(true)
    try {
      await onSubmit({
        bank_name: values.bank_name,
        sender_email: values.sender_email,
        subject_pattern: values.subject_pattern || null,
        amount_regex: values.amount_regex || null,
        merchant_regex: values.merchant_regex || null,
        date_regex: values.date_regex || null,
        card_regex: values.card_regex || null,
        is_active: values.is_active,
      })
      onOpenChange(false)
      form.reset()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{template ? 'Sửa mẫu email' : 'Thêm mẫu email ngân hàng'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên ngân hàng *</FormLabel>
                  <FormControl>
                    <Input placeholder="Vd: Techcombank, BIDV, MSB..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sender_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email gửi *</FormLabel>
                  <FormControl>
                    <Input placeholder="no-reply@techcombank.com.vn" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject_pattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Từ khóa tiêu đề email</FormLabel>
                  <FormControl>
                    <Input placeholder="Vd: Thong bao giao dich" {...field} />
                  </FormControl>
                  <FormDescription>Để trống để lấy tất cả email từ địa chỉ trên</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="rounded-lg border p-4 space-y-3">
              <p className="text-sm font-medium">Regex tùy chỉnh (tùy chọn)</p>
              <p className="text-xs text-muted-foreground">
                Để trống tất cả các trường regex để dùng AI tự động phân tích email
              </p>

              <FormField
                control={form.control}
                name="amount_regex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Regex số tiền</FormLabel>
                    <FormControl>
                      <Input placeholder="Vd: Số tiền[\s:]+([0-9,.]+)" className="font-mono text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="merchant_regex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Regex tên cửa hàng</FormLabel>
                    <FormControl>
                      <Input placeholder="Vd: Tên đơn vị[\s:]+(.+)" className="font-mono text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date_regex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Regex ngày giao dịch</FormLabel>
                    <FormControl>
                      <Input placeholder="Vd: Ngày[\s:]+(\d{2}/\d{2}/\d{4})" className="font-mono text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="card_regex"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Regex số thẻ (4 số cuối)</FormLabel>
                    <FormControl>
                      <Input placeholder="Vd: Thẻ[\s:]+\*+(\d{4})" className="font-mono text-sm" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <FormLabel>Kích hoạt</FormLabel>
                    <FormDescription>Dùng mẫu này khi đồng bộ Gmail</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Đang lưu...' : template ? 'Lưu thay đổi' : 'Thêm mẫu'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
