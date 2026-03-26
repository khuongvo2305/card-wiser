'use client'

import { CreditCard, MoreVertical, Calendar, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatVND, getNextDateForDay, daysUntil, getUrgencyLevel, formatDateShort } from '@/lib/format'
import type { Card as CardType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface CardWidgetProps {
  card: CardType
  onEdit?: (card: CardType) => void
  onDelete?: (card: CardType) => void
  onViewDetails?: (card: CardType) => void
}

export function CardWidget({ card, onEdit, onDelete, onViewDetails }: CardWidgetProps) {
  const utilizationPercent = card.credit_limit > 0 
    ? (card.current_balance / card.credit_limit) * 100 
    : 0
  
  const nextDueDate = getNextDateForDay(card.due_date)
  const daysUntilDue = daysUntil(nextDueDate)
  const urgencyLevel = getUrgencyLevel(daysUntilDue)

  const getUtilizationColor = () => {
    if (utilizationPercent >= 80) return 'bg-red-500'
    if (utilizationPercent >= 50) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getUrgencyBadge = () => {
    const baseClasses = 'flex items-center gap-1'
    switch (urgencyLevel) {
      case 'critical':
        return (
          <Badge variant="destructive" className={baseClasses}>
            <AlertCircle className="size-3" />
            {daysUntilDue <= 0 ? 'Quá hạn' : `${daysUntilDue} ngày`}
          </Badge>
        )
      case 'warning':
        return (
          <Badge className={cn(baseClasses, 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20')}>
            <Calendar className="size-3" />
            {daysUntilDue} ngày
          </Badge>
        )
      default:
        return (
          <Badge variant="secondary" className={baseClasses}>
            <Calendar className="size-3" />
            {daysUntilDue} ngày
          </Badge>
        )
    }
  }

  return (
    <Card 
      className="relative overflow-hidden transition-all hover:shadow-md cursor-pointer"
      onClick={() => onViewDetails?.(card)}
    >
      {/* Color stripe at top */}
      <div 
        className="absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: card.card_color }}
      />
      
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="flex size-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${card.card_color}20` }}
            >
              <CreditCard className="size-5" style={{ color: card.card_color }} />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">{card.card_name}</h3>
              <p className="text-sm text-muted-foreground">{card.bank_name}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon-sm">
                <MoreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onViewDetails?.(card) }}>
                Xem chi tiết
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit?.(card) }}>
                Chỉnh sửa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={(e) => { e.stopPropagation(); onDelete?.(card) }}
              >
                Xóa thẻ
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Balance info */}
        <div className="mt-4 space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Dư nợ hiện tại</p>
              <p className="text-xl font-bold text-foreground">{formatVND(card.current_balance)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Hạn mức còn lại</p>
              <p className="text-sm font-medium text-muted-foreground">{formatVND(card.available_credit)}</p>
            </div>
          </div>

          {/* Utilization bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Sử dụng {utilizationPercent.toFixed(0)}%</span>
              <span>{formatVND(card.credit_limit)}</span>
            </div>
            <Progress 
              value={utilizationPercent} 
              className="h-2"
              indicatorClassName={getUtilizationColor()}
            />
          </div>

          {/* Due date */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Ngày đến hạn:</span>
              <span className="font-medium">{formatDateShort(nextDueDate)}</span>
            </div>
            {getUrgencyBadge()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
