import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { useAuthStore } from '@/store/auth'
import { toast } from 'sonner'
import { useNavigate, Link } from 'react-router-dom'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
})

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const loading = useAuthStore((s) => s.loading)

  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await login(values.email, values.password)
      navigate('/checklists', { replace: true })
    } catch (e: any) {
      toast.error(e.message ?? 'Falha no login')
    }
  }

  return (
    <div className="w-full flex items-center justify-center py-24">
      <Card className="w-full max-w-sm p-6">
        <div className="flex justify-center mb-6">
          <img src="/logo-vertical.png" alt="CheckMaster Logo" className="h-24 w-auto object-contain" />
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm mb-1 block">Email</label>
            <Input type="email" placeholder="seu@email.com" {...register('email')} />
            {formState.errors.email && <p className="text-xs text-red-400 mt-1">{formState.errors.email.message}</p>}
          </div>
          <div>
            <label className="text-sm mb-1 block">Senha</label>
            <Input type="password" placeholder="••••••" {...register('password')} />
            {formState.errors.password && <p className="text-xs text-red-400 mt-1">{formState.errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Entrar
          </Button>
        </form>
        <div className="mt-4 text-sm text-center">
          <span className="text-muted-foreground">Não tem conta?</span>{' '}
          <Link to="/register" className="text-primary">Cadastre-se</Link>
        </div>
      </Card>
    </div>
  )
}

