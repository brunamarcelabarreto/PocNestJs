import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Credenciais inválidas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="w-full max-w-sm border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="text-4xl mb-2 text-primary" style={{ filter: 'drop-shadow(0 0 12px hsl(263 84% 62% / 0.7))' }}>
            <img src="/logo.png" alt="Commandix Logo" className="w-14 h-14 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Commandix</h1>
          <p className="text-sm text-muted-foreground">Gestão de Contratos</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Não tem conta?{' '}
            <Link to="/register" className="text-primary hover:underline">
              Criar uma agora
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
