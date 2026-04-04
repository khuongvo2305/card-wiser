'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { Loader2, Download, Trash2, User, DollarSign, Database, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
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
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import type { Profile, Card as CardType } from '@/lib/types'
import { toast } from 'sonner'
import { SEED_CARDS, SEED_CATEGORIES, SEED_CASHBACK_POLICIES, SEED_BANK_EMAIL_TEMPLATES } from '@/lib/seed-data'

const CURRENCIES = [
  { value: 'VND', label: 'VND - Việt Nam Đồng' },
  { value: 'USD', label: 'USD - US Dollar' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'JPY', label: 'JPY - Japanese Yen' },
  { value: 'SGD', label: 'SGD - Singapore Dollar' },
]

const fetchProfile = async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data as Profile
}

export default function SettingsPage() {
  const { data: profile, error, isLoading, mutate } = useSWR('profile', fetchProfile)
  const [displayName, setDisplayName] = useState('')
  const [currency, setCurrency] = useState('VND')
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [isSeeding, setIsSeeding] = useState(false)

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '')
      setCurrency(profile.default_currency || 'VND')
    }
  }, [profile])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          default_currency: currency,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile!.id)

      if (error) {
        toast.error('Không thể lưu cài đặt', { description: error.message })
        return
      }

      toast.success('Đã lưu cài đặt')
      mutate()
    } finally {
      setIsSaving(false)
    }
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const supabase = createClient()

      // Fetch all data in parallel
      const [cardsRes, transactionsRes, categoriesRes, installmentsRes, policiesRes] =
        await Promise.all([
          supabase.from('cards').select('*').order('card_name'),
          supabase.from('transactions').select('*').order('transaction_date', { ascending: false }),
          supabase.from('spending_categories').select('*').order('name'),
          supabase.from('installments').select('*').order('start_date', { ascending: false }),
          supabase.from('cashback_policies').select('*').order('created_at'),
        ])

      const download = (filename: string, headers: string[], rows: Record<string, unknown>[]) => {
        if (rows.length === 0) return
        const csvContent = [
          headers.join(','),
          ...rows.map((row) =>
            headers.map((h) => {
              const val = row[h]
              if (val == null) return ''
              const str = String(val)
              return str.includes(',') || str.includes('"') || str.includes('\n')
                ? `"${str.replace(/"/g, '""')}"`
                : str
            }).join(',')
          ),
        ].join('\n')

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        link.click()
        URL.revokeObjectURL(url)
      }

      if (cardsRes.data?.length) {
        download(
          'cardwise_cards.csv',
          ['id', 'card_name', 'bank_name', 'last_four_digits', 'credit_limit', 'current_balance', 'statement_date', 'due_date', 'card_color', 'is_active', 'created_at'],
          cardsRes.data
        )
      }

      if (transactionsRes.data?.length) {
        download(
          'cardwise_transactions.csv',
          ['id', 'card_id', 'category_id', 'amount', 'merchant_name', 'description', 'transaction_date', 'source', 'cashback_earned', 'created_at'],
          transactionsRes.data
        )
      }

      if (categoriesRes.data?.length) {
        download(
          'cardwise_categories.csv',
          ['id', 'name', 'icon', 'color', 'budget_limit', 'is_system', 'created_at'],
          categoriesRes.data
        )
      }

      if (installmentsRes.data?.length) {
        download(
          'cardwise_installments.csv',
          ['id', 'card_id', 'original_amount', 'total_months', 'monthly_payment', 'interest_rate', 'remaining_months', 'remaining_balance', 'merchant_name', 'start_date', 'is_active', 'created_at'],
          installmentsRes.data
        )
      }

      if (policiesRes.data?.length) {
        download(
          'cardwise_cashback_policies.csv',
          ['id', 'card_id', 'category_name', 'cashback_percentage', 'cap_amount', 'min_spend', 'valid_from', 'valid_until', 'is_active', 'created_at'],
          policiesRes.data
        )
      }

      toast.success('Đã xuất dữ liệu thành công')
    } catch {
      toast.error('Không thể xuất dữ liệu')
    } finally {
      setIsExporting(false)
    }
  }

  const handleDeleteAllData = async () => {
    if (deleteConfirmText !== 'XOA TAT CA') return

    setIsDeleting(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Delete in order to respect foreign keys
      await supabase.from('transactions').delete().eq('user_id', user.id)
      await supabase.from('cashback_policies').delete().eq('user_id', user.id)
      await supabase.from('installments').delete().eq('user_id', user.id)
      await supabase.from('spending_categories').delete().eq('user_id', user.id)
      await supabase.from('cards').delete().eq('user_id', user.id)

      toast.success('Đã xóa toàn bộ dữ liệu')
      setShowDeleteDialog(false)
      setDeleteConfirmText('')
      mutate()
    } catch {
      toast.error('Không thể xóa dữ liệu')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleSeedData = async () => {
    setIsSeeding(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Vui lòng đăng nhập lại')
        return
      }

      // 1. Seed categories
      const categoryRows = SEED_CATEGORIES.map((cat, index) => ({
        user_id: user.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        is_system: true,
        sort_order: index,
      }))

      const { data: insertedCategories, error: catError } = await supabase
        .from('spending_categories')
        .insert(categoryRows)
        .select()

      if (catError) {
        toast.error('Không thể tạo danh mục', { description: catError.message })
        return
      }

      // 2. Seed cards
      const cardRows = SEED_CARDS.map((card) => ({
        ...card,
        user_id: user.id,
      }))

      const { data: insertedCards, error: cardError } = await supabase
        .from('cards')
        .insert(cardRows)
        .select()

      if (cardError) {
        toast.error('Không thể tạo thẻ', { description: cardError.message })
        return
      }

      // 3. Seed cashback policies — map card_name → card.id, category_name → category.id
      const cardMap = new Map((insertedCards as CardType[]).map((c) => [c.card_name, c.id]))
      const catMap = new Map(
        (insertedCategories as { id: string; name: string }[]).map((c) => [c.name, c.id])
      )

      const policyRows: {
        card_id: string
        user_id: string
        category_id: string | null
        category_name: string
        cashback_percentage: number
        cap_amount: number | null
        min_spend: number | null
        notes: string | null
        is_active: boolean
      }[] = []

      for (const group of SEED_CASHBACK_POLICIES) {
        const cardId = cardMap.get(group.card_name)
        if (!cardId) continue

        for (const policy of group.policies) {
          policyRows.push({
            card_id: cardId,
            user_id: user.id,
            category_id: catMap.get(policy.category_name) || null,
            category_name: policy.category_name,
            cashback_percentage: policy.cashback_percentage,
            cap_amount: policy.cap_amount,
            min_spend: policy.min_spend,
            notes: policy.notes,
            is_active: policy.is_active,
          })
        }
      }

      if (policyRows.length > 0) {
        const { error: policyError } = await supabase
          .from('cashback_policies')
          .insert(policyRows)

        if (policyError) {
          toast.error('Không thể tạo chính sách cashback', { description: policyError.message })
          return
        }
      }

      // 4. Seed bank email templates
      const templateRows = SEED_BANK_EMAIL_TEMPLATES.map((t) => ({
        ...t,
        user_id: user.id,
      }))
      await supabase.from('bank_email_templates').insert(templateRows)

      toast.success(
        `Đã tạo ${insertedCards.length} thẻ, ${insertedCategories.length} danh mục, ${policyRows.length} chính sách cashback, ${templateRows.length} mẫu email ngân hàng`
      )
      mutate()
    } catch {
      toast.error('Không thể tạo dữ liệu mẫu')
    } finally {
      setIsSeeding(false)
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Không thể tải cài đặt</p>
        <Button variant="outline" className="mt-4" onClick={() => mutate()}>
          Thử lại
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cài đặt</h1>
        <p className="text-muted-foreground">Quản lý tài khoản và tùy chọn ứng dụng</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] rounded-xl" />
          <Skeleton className="h-[150px] rounded-xl" />
          <Skeleton className="h-[150px] rounded-xl" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="size-5 text-muted-foreground" />
                <CardTitle>Hồ sơ</CardTitle>
              </div>
              <CardDescription>Thông tin tài khoản của bạn</CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    value={profile?.email || ''}
                    disabled
                    className="bg-muted"
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="display_name">Tên hiển thị</FieldLabel>
                  <Input
                    id="display_name"
                    placeholder="Nhập tên hiển thị..."
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
          </Card>

          {/* Currency Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="size-5 text-muted-foreground" />
                <CardTitle>Tiền tệ</CardTitle>
              </div>
              <CardDescription>Đơn vị tiền tệ mặc định cho ứng dụng</CardDescription>
            </CardHeader>
            <CardContent>
              <Field>
                <FieldLabel htmlFor="currency">Đơn vị tiền tệ</FieldLabel>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="currency" className="w-[280px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu thay đổi'
              )}
            </Button>
          </div>

          <Separator />

          {/* Seed Data Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="size-5 text-muted-foreground" />
                <CardTitle>Dữ liệu mẫu</CardTitle>
              </div>
              <CardDescription>
                Tạo dữ liệu thẻ tín dụng thực tế gồm 7 thẻ (LPBank, Techcombank, MSB, Sacombank, UOB, BIDV),
                11 danh mục chi tiêu, và chính sách cashback tương ứng.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Sẽ tạo:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>7 thẻ tín dụng (tổng hạn mức ~502 triệu VND)</li>
                  <li>11 danh mục chi tiêu mặc định</li>
                  <li>11 chính sách cashback cho các thẻ</li>
                  <li>7 mẫu email ngân hàng (LPBank, Techcombank, MSB, Sacombank, UOB, BIDV)</li>
                </ul>
              </div>
              <Button onClick={handleSeedData} disabled={isSeeding}>
                {isSeeding ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang tạo dữ liệu...
                  </>
                ) : (
                  <>
                    <CreditCard className="size-4" />
                    Tạo dữ liệu mẫu
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Export Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Download className="size-5 text-muted-foreground" />
                <CardTitle>Xuất dữ liệu</CardTitle>
              </div>
              <CardDescription>
                Tải xuống toàn bộ dữ liệu dưới dạng tệp CSV
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" onClick={handleExportCSV} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Đang xuất...
                  </>
                ) : (
                  <>
                    <Download className="size-4" />
                    Xuất CSV
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Trash2 className="size-5 text-destructive" />
                <CardTitle className="text-destructive">Vùng nguy hiểm</CardTitle>
              </div>
              <CardDescription>
                Các thao tác không thể hoàn tác. Hãy cân nhắc kỹ trước khi thực hiện.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="size-4" />
                Xóa toàn bộ dữ liệu
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete All Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa toàn bộ dữ liệu?</AlertDialogTitle>
            <AlertDialogDescription>
              Thao tác này sẽ xóa vĩnh viễn tất cả thẻ, giao dịch, trả góp, danh mục và chính sách cashback.
              Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Nhập <span className="font-mono font-semibold text-foreground">XOA TAT CA</span> để xác nhận:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="XOA TAT CA"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteConfirmText !== 'XOA TAT CA' || isDeleting}
              onClick={handleDeleteAllData}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                'Xóa toàn bộ'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
