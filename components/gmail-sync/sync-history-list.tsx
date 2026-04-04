'use client'

import { CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import type { GmailSyncLog } from '@/lib/types'
import { formatDateTime } from '@/lib/format'

interface SyncHistoryListProps {
  logs: GmailSyncLog[] | undefined
  isLoading: boolean
}

function StatusIcon({ status }: { status: GmailSyncLog['status'] }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="size-4 shrink-0 text-green-500" />
    case 'failed':
      return <XCircle className="size-4 shrink-0 text-destructive" />
    case 'running':
      return <Loader2 className="size-4 shrink-0 animate-spin text-blue-500" />
    default:
      return <Clock className="size-4 shrink-0 text-muted-foreground" />
  }
}

function StatusLabel({ status }: { status: GmailSyncLog['status'] }) {
  const map = {
    completed: { label: 'Thành công', variant: 'default' as const },
    failed: { label: 'Thất bại', variant: 'destructive' as const },
    running: { label: 'Đang chạy', variant: 'secondary' as const },
    pending: { label: 'Chờ xử lý', variant: 'outline' as const },
  }
  const { label, variant } = map[status] ?? map.pending
  return <Badge variant={variant} className="text-xs">{label}</Badge>
}

export function SyncHistoryList({ logs, isLoading }: SyncHistoryListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    )
  }

  if (!logs || logs.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        Chưa có lần đồng bộ nào
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="rounded-lg border p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <StatusIcon status={log.status} />
              <div>
                <p className="text-sm font-medium">
                  {formatDateTime(log.sync_started_at)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {log.emails_processed} email đã quét
                  {log.transactions_created > 0 && (
                    <> · <span className="text-green-600 dark:text-green-400">{log.transactions_created} giao dịch mới</span></>
                  )}
                </p>
              </div>
            </div>
            <StatusLabel status={log.status} />
          </div>

          {log.errors && log.errors.length > 0 && (
            <div className="mt-2 space-y-1">
              {log.errors.map((err, i) => (
                <p key={i} className="rounded bg-destructive/10 px-2 py-1 text-xs text-destructive">
                  {err}
                </p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
