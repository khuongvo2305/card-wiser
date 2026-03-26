'use client'

import { MoreVertical, Tag } from 'lucide-react'
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
}

export function TransactionList({ 
  transactions, 
  cards, 
  categories, 
  onEdit, 
  onDelete 
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
                    <p className="font-medium">{tx.merchant_name || 'Không rõ'}</p>
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
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
