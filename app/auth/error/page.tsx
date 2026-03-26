import Link from 'next/link'
import { AlertCircle, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CreditCard className="size-6" />
          </div>
          <CardTitle className="text-2xl">Có lỗi xảy ra</CardTitle>
          <CardDescription>
            Không thể xác thực tài khoản của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="size-8 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">
            Link xác nhận có thể đã hết hạn hoặc không hợp lệ. Vui lòng thử đăng ký lại.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/auth/login">Đăng nhập</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Đăng ký lại</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
