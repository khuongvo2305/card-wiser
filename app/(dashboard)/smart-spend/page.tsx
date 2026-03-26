'use client'

import useSWR from 'swr'
import { Lightbulb, CreditCard, TrendingUp, Star, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Empty } from '@/components/ui/empty'
import { Button } from '@/components/ui/button'
import { formatVND, formatPercent } from '@/lib/format'
import type { Card as CardType, CashbackPolicy, SpendingCategory, Transaction } from '@/lib/types'
import Link from 'next/link'

const fetchSmartSpendData = async () => {
  const supabase = createClient()
  
  const [cardsRes, policiesRes, categoriesRes, transactionsRes] = await Promise.all([
    supabase.from('cards').select('*').eq('is_active', true),
    supabase.from('cashback_policies').select('*').eq('is_active', true),
    supabase.from('spending_categories').select('*'),
    supabase.from('transactions').select('*').order('transaction_date', { ascending: false }).limit(100),
  ])

  if (cardsRes.error) throw cardsRes.error
  if (policiesRes.error) throw policiesRes.error
  if (categoriesRes.error) throw categoriesRes.error
  if (transactionsRes.error) throw transactionsRes.error

  return {
    cards: cardsRes.data as CardType[],
    policies: policiesRes.data as CashbackPolicy[],
    categories: categoriesRes.data as SpendingCategory[],
    transactions: transactionsRes.data as Transaction[],
  }
}

interface Recommendation {
  card: CardType
  category: SpendingCategory | null
  policy: CashbackPolicy
  reason: string
  potentialCashback: number
}

export default function SmartSpendPage() {
  const { data, error, isLoading } = useSWR('smart-spend', fetchSmartSpendData)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Không thể tải dữ liệu</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[200px] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const { cards, policies, categories, transactions } = data || { 
    cards: [], 
    policies: [], 
    categories: [],
    transactions: [],
  }

  // Generate recommendations based on cashback policies
  const recommendations: Recommendation[] = policies
    .filter((p) => p.is_active)
    .map((policy) => {
      const card = cards.find((c) => c.id === policy.card_id)
      if (!card) return null

      const category = policy.category_id 
        ? categories.find((c) => c.id === policy.category_id) 
        : null

      // Calculate potential cashback based on cap
      const potentialCashback = policy.cap_amount 
        ? Math.min(policy.cap_amount, 1000000 * (policy.cashback_percentage / 100))
        : 1000000 * (policy.cashback_percentage / 100)

      return {
        card,
        category,
        policy,
        reason: category 
          ? `Hoàn ${formatPercent(policy.cashback_percentage, 0)} cho ${category.name}`
          : `Hoàn ${formatPercent(policy.cashback_percentage, 0)} cho mọi giao dịch`,
        potentialCashback,
      }
    })
    .filter((r): r is Recommendation => r !== null)
    .sort((a, b) => b.policy.cashback_percentage - a.policy.cashback_percentage)

  // Group recommendations by category
  const categoryRecommendations = categories.map((cat) => {
    const relevantPolicies = recommendations.filter(
      (r) => r.category?.id === cat.id || (!r.category && r.policy.category_name?.toLowerCase().includes(cat.name.toLowerCase()))
    )
    
    const bestPolicy = relevantPolicies.sort((a, b) => b.policy.cashback_percentage - a.policy.cashback_percentage)[0]
    
    return {
      category: cat,
      bestPolicy,
      allPolicies: relevantPolicies,
    }
  }).filter((c) => c.bestPolicy)

  // Calculate total potential cashback
  const totalPotentialCashback = recommendations.reduce((sum, r) => sum + r.potentialCashback, 0)

  // Get most used categories from transactions
  const categoryUsage = new Map<string | null, number>()
  transactions.forEach((tx) => {
    const count = categoryUsage.get(tx.category_id) || 0
    categoryUsage.set(tx.category_id, count + tx.amount)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gợi ý chi tiêu</h1>
        <p className="text-muted-foreground">Tối ưu hóa cashback với thẻ phù hợp</p>
      </div>

      {policies.length === 0 ? (
        <Empty
          icon={<Lightbulb className="size-12 text-muted-foreground" />}
          title="Chưa có chính sách cashback"
          description="Thêm chính sách cashback cho thẻ để nhận gợi ý chi tiêu thông minh"
          action={
            <Button asChild>
              <Link href="/cards">Quản lý thẻ</Link>
            </Button>
          }
        />
      ) : (
        <>
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Sparkles className="size-4" />
                  Tổng cashback tiềm năng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">{formatVND(totalPotentialCashback)}</p>
                <p className="text-xs text-muted-foreground">mỗi tháng</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Star className="size-4" />
                  Chính sách tốt nhất
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations[0] && (
                  <>
                    <p className="text-2xl font-bold text-foreground">
                      {formatPercent(recommendations[0].policy.cashback_percentage, 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {recommendations[0].card.card_name}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CreditCard className="size-4" />
                  Thẻ có cashback
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {new Set(policies.map((p) => p.card_id)).size}
                </p>
                <p className="text-xs text-muted-foreground">thẻ</p>
              </CardContent>
            </Card>
          </div>

          {/* Top Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="size-5" />
                Cashback cao nhất
              </CardTitle>
              <CardDescription>
                Các thẻ có tỷ lệ hoàn tiền tốt nhất
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {recommendations.slice(0, 6).map((rec, index) => (
                  <div
                    key={`${rec.card.id}-${rec.policy.id}`}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div 
                          className="size-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${rec.card.card_color}20` }}
                        >
                          <CreditCard className="size-5" style={{ color: rec.card.card_color }} />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{rec.card.card_name}</p>
                          <p className="text-xs text-muted-foreground">{rec.card.bank_name}</p>
                        </div>
                      </div>
                      {index < 3 && (
                        <Badge className="bg-yellow-500/10 text-yellow-500">
                          <Star className="size-3 mr-1" />
                          Top {index + 1}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Hoàn tiền</span>
                        <span className="text-lg font-bold text-primary">
                          {formatPercent(rec.policy.cashback_percentage, 0)}
                        </span>
                      </div>
                      
                      {rec.category && (
                        <Badge 
                          variant="secondary"
                          style={{ 
                            backgroundColor: `${rec.category.color}20`,
                            color: rec.category.color,
                          }}
                        >
                          {rec.category.name}
                        </Badge>
                      )}
                      
                      {!rec.category && rec.policy.category_name && (
                        <Badge variant="secondary">
                          {rec.policy.category_name}
                        </Badge>
                      )}
                      
                      {rec.policy.cap_amount && (
                        <p className="text-xs text-muted-foreground">
                          Tối đa: {formatVND(rec.policy.cap_amount)}/tháng
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Category-based Recommendations */}
          {categoryRecommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="size-5" />
                  Gợi ý theo danh mục
                </CardTitle>
                <CardDescription>
                  Thẻ tốt nhất cho từng loại chi tiêu
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {categoryRecommendations.map(({ category, bestPolicy }) => (
                    <div
                      key={category.id}
                      className="flex items-center justify-between p-4 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="size-10 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          <span style={{ color: category.color }} className="text-lg">
                            {category.icon === 'tag' ? '#' : category.icon}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{category.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Dùng {bestPolicy.card.card_name}
                          </p>
                        </div>
                      </div>
                      <Badge className="bg-green-500/10 text-green-500">
                        {formatPercent(bestPolicy.policy.cashback_percentage, 0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
