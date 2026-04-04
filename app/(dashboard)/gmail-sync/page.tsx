'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import useSWR from 'swr'
import { Mail, RefreshCw, Unlink, Plus, CheckCircle2, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TemplateList } from '@/components/gmail-sync/template-list'
import { TemplateForm } from '@/components/gmail-sync/template-form'
import { SyncHistoryList } from '@/components/gmail-sync/sync-history-list'
import type { Profile, BankEmailTemplate, GmailSyncLog } from '@/lib/types'
import { toast } from 'sonner'
import { getRelativeTime } from '@/lib/format'

const fetchProfile = async () => {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('profiles')
    .select('gmail_connected, last_gmail_sync_at')
    .eq('id', user.id)
    .single()
  if (error) throw error
  return data as Pick<Profile, 'gmail_connected' | 'last_gmail_sync_at'>
}

const fetchTemplates = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bank_email_templates')
    .select('*')
    .order('bank_name')
  if (error) throw error
  return data as BankEmailTemplate[]
}

const fetchSyncLogs = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('gmail_sync_logs')
    .select('*')
    .order('sync_started_at', { ascending: false })
    .limit(20)
  if (error) throw error
  return data as GmailSyncLog[]
}

export default function GmailSyncPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isSyncing, setIsSyncing] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [isTemplateFormOpen, setIsTemplateFormOpen] = useState(false)

  const { data: profile, isLoading: profileLoading, mutate: mutateProfile } = useSWR('gmail-profile', fetchProfile)
  const { data: templates, isLoading: templatesLoading, mutate: mutateTemplates } = useSWR('bank-email-templates', fetchTemplates)
  const { data: syncLogs, isLoading: logsLoading, mutate: mutateLogs } = useSWR('gmail-sync-logs', fetchSyncLogs)

  // Handle OAuth redirect result
  useEffect(() => {
    const connected = searchParams.get('connected')
    const error = searchParams.get('error')

    if (connected === 'true') {
      toast.success('Đã kết nối Gmail thành công')
      mutateProfile()
      router.replace('/gmail-sync')
    } else if (error) {
      const errorMessages: Record<string, string> = {
        access_denied: 'Bạn đã từ chối cấp quyền truy cập Gmail',
        invalid_callback: 'Yêu cầu không hợp lệ',
        auth_failed: 'Xác thực thất bại',
        token_exchange_failed: 'Không thể lấy token từ Google',
        no_refresh_token: 'Google không trả về refresh token. Hãy thử lại.',
      }
      toast.error('Kết nối Gmail thất bại', {
        description: errorMessages[error] ?? error,
      })
      router.replace('/gmail-sync')
    }
  }, [searchParams, mutateProfile, router])

  const handleConnect = () => {
    router.push('/api/auth/gmail/connect')
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error('Vui lòng đăng nhập lại')
        return
      }

      const { error } = await supabase.functions.invoke('gmail-sync', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (error) {
        toast.error('Đồng bộ thất bại', { description: error.message })
        return
      }

      toast.success('Đồng bộ Gmail hoàn tất')
      mutateProfile()
      mutateLogs()
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnect = async () => {
    setIsDisconnecting(true)
    try {
      const res = await fetch('/api/auth/gmail/disconnect', { method: 'POST' })
      if (!res.ok) {
        toast.error('Không thể ngắt kết nối Gmail')
        return
      }
      toast.success('Đã ngắt kết nối Gmail')
      mutateProfile()
    } finally {
      setIsDisconnecting(false)
    }
  }

  const handleAddTemplate = async (data: Partial<BankEmailTemplate>) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error('Vui lòng đăng nhập lại')
      return
    }

    const { error } = await supabase.from('bank_email_templates').insert({
      ...data,
      user_id: user.id,
    })

    if (error) {
      toast.error('Không thể thêm mẫu email', { description: error.message })
      throw error
    }

    toast.success('Đã thêm mẫu email')
    mutateTemplates()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gmail Sync</h1>
        <p className="text-muted-foreground">Tự động nhập giao dịch từ email thông báo ngân hàng</p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Mail className="size-4" />
            Kết nối Gmail
          </CardTitle>
          <CardDescription>
            Cấp quyền đọc email để đồng bộ thông báo giao dịch ngân hàng
          </CardDescription>
        </CardHeader>
        <CardContent>
          {profileLoading ? (
            <Skeleton className="h-10 w-48 rounded-lg" />
          ) : profile?.gmail_connected ? (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-500" />
                  <span className="font-medium text-green-600 dark:text-green-400">Đã kết nối</span>
                </div>
                {profile.last_gmail_sync_at && (
                  <p className="text-sm text-muted-foreground">
                    Đồng bộ lần cuối: {getRelativeTime(profile.last_gmail_sync_at)}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSync} disabled={isSyncing}>
                  <RefreshCw className={`size-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  {isSyncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDisconnect}
                  disabled={isDisconnecting}
                >
                  <Unlink className="size-4" />
                  {isDisconnecting ? 'Đang ngắt...' : 'Ngắt kết nối'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">Chưa kết nối</span>
              </div>
              <Button onClick={handleConnect}>
                <Mail className="size-4" />
                Kết nối Gmail
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Email Templates */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Mẫu email ngân hàng</CardTitle>
              <CardDescription>
                Cấu hình email từ ngân hàng nào cần đồng bộ
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {templates && templates.length > 0 && (
                <Badge variant="secondary">{templates.filter(t => t.is_active).length} đang hoạt động</Badge>
              )}
              <Button size="sm" onClick={() => setIsTemplateFormOpen(true)}>
                <Plus className="size-4" />
                Thêm mẫu
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TemplateList
            templates={templates}
            isLoading={templatesLoading}
            onMutate={mutateTemplates}
          />
        </CardContent>
      </Card>

      {/* Sync History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Lịch sử đồng bộ</CardTitle>
          <CardDescription>20 lần đồng bộ gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <SyncHistoryList logs={syncLogs} isLoading={logsLoading} />
        </CardContent>
      </Card>

      {/* Add Template Dialog */}
      <TemplateForm
        open={isTemplateFormOpen}
        onOpenChange={setIsTemplateFormOpen}
        onSubmit={handleAddTemplate}
      />
    </div>
  )
}
