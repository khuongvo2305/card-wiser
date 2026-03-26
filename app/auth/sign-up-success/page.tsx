import Link from 'next/link'
import { Mail, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SignUpSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CreditCard className="size-6" />
          </div>
          <CardTitle className="text-2xl">Kiểm tra email của bạn</CardTitle>
          <CardDescription>
            Chúng tôi đã gửi một email xác nhận đến địa chỉ email của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="flex size-16 items-center justify-center rounded-full bg-muted">
            <Mail className="size-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            Vui lòng click vào link trong email để xác nhận tài khoản và bắt đầu sử dụng CardWise.
          </p>
          <Button asChild variant="outline" className="mt-2">
            <Link href="/auth/login">Quay lại đăng nhập</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
