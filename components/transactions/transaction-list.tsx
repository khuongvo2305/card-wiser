'use client'

import { MoreVertical, Tag, CheckCircle2, XCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatVND, formatDate } from '@/lib/format'
import type { Transaction, Card, SpendingCategory } from '@/lib/types'

interface TransactionListProps {
  transactions: Transaction[]
  cards: Card[]
  categories: SpendingCategory[]
  onEdit: (transaction: Transaction) => void
  onDelete: (transaction: Transaction) => void
  onConfirm?: (transaction: Transaction) => void
  onReject?: (transaction: Transaction) => void
}

export function TransactionList({
  transactions,
  cards,
  categories,
  onEdit,
  onDelete,
  onConfirm,
  onReject,
}: TransactionListProps) {
  const getCard = (cardId: string) => cards.find((c) => c.id === cardId)
  const getCategory = (categoryId: string | null) => 
    categoryId ? categories.find((c) => c.id === categoryId) : null

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ngày</TableHead>
            <TableHead>Nơi giao dịch</TableHead>
            <TableHead>Thẻ</TableHead>
            <TableHead>Danh mục</TableHead>
            <TableHead className="text-right">Số tiền</TableHead>
            <TableHead className="w-[50px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((tx) => {
            const card = getCard(tx.card_id)
            const category = getCategory(tx.category_id)

            return (
              <TableRow key={tx.id}>
                <TableCell className="font-medium">
                  {formatDate(tx.transaction_date)}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{tx.merchant_name || 'Không rõ'}</p>
                      {tx.status === 'pending_review' && (
                        <Badge variant="outline" className="gap-1 text-xs text-amber-600 border-amber-300 dark:text-amber-400">
                          <Mail className="size-3" />
                          Chờ xác nhận
                        </Badge>
                      )}
                    </div>
                    {tx.description && (
                      <p className="text-xs text-muted-foreground">{tx.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {card && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="size-3 rounded-full"
                        style={{ backgroundColor: card.card_color }}
                      />
                      <span className="text-sm">{card.card_name}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {category ? (
                    <Badge 
                      variant="secondary"
                      className="flex w-fit items-center gap-1"
                      style={{ 
                        backgroundColor: `${category.color}20`,
                        color: category.color,
                      }}
                    >
                      <Tag className="size-3" />
                      {category.name}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-semibold text-foreground">
                  {formatVND(tx.amount)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    {tx.status === 'pending_review' && onConfirm && onReject && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                          title="Xác nhận"
                          onClick={() => onConfirm(tx)}
                        >
                          <CheckCircle2 className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          title="Từ chối"
                          onClick={() => onReject(tx)}
                        >
                          <XCircle className="size-4" />
                        </Button>
                      </>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(tx)}>
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => onDelete(tx)}
                        >
                          Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
