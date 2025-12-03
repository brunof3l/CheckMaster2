import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { toast } from 'sonner'
import { useNavigate, Link } from 'react-router-dom'
import { signUp, signIn } from '@/services/auth'

const schema = z
  .object({
    name: z.string().min(2, 'Informe seu nome'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo de 6 caracteres'),
    confirmPassword: z.string().min(6),
  })
  .refine((v) => v.password === v.confirmPassword, { message: 'Senhas diferentes', path: ['confirmPassword'] })

export default function Register() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })

  async function onSubmit(values: z.infer<typeof schema>) {
    try {
      await signUp({ name: values.name, email: values.email, password: values.password })
      await signIn({ email: values.email, password: values.password })
      toast.success('Cadastro concluído')
      navigate('/checklists', { replace: true })
    } catch (e: any) {
      toast.error(e.message ?? 'Falha no cadastro')
    }
  }

  return (
    <div className="w-full flex items-center justify-center py-24">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold">Cadastro</h1>
          <p className="text-muted-foreground text-sm">Crie sua conta</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="text-sm mb-1 block">Nome</label>
            <Input placeholder="Seu nome" {...register('name')} />
            {formState.errors.name && <p className="text-xs text-red-400 mt-1">{formState.errors.name.message}</p>}
          </div>
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
          <div>
            <label className="text-sm mb-1 block">Confirmar senha</label>
            <Input type="password" placeholder="••••••" {...register('confirmPassword')} />
            {formState.errors.confirmPassword && (
              <p className="text-xs text-red-400 mt-1">{formState.errors.confirmPassword.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full">
            Cadastrar
          </Button>
        </form>
        <div className="mt-4 text-sm text-center">
          <span className="text-muted-foreground">Já tem conta?</span>{' '}
          <Link to="/login" className="text-primary">Fazer login</Link>
        </div>
      </Card>
    </div>
  )
}

