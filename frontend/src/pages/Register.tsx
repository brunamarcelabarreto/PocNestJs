import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../api/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    tenantName: "",
    adminName: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authApi.register(
        form.tenantName,
        form.adminName,
        form.email,
        form.password,
      );
      navigate("/login");
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message;
      setError(
        Array.isArray(msg) ? msg.join(", ") : msg || "Erro ao criar conta",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <Card className="w-full max-w-sm border-border/60 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div
            className="text-4xl mb-2 text-primary"
            style={{ filter: "drop-shadow(0 0 12px hsl(263 84% 62% / 0.7))" }}
          >
            ⚡
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Criar Conta</h1>
          <p className="text-sm text-muted-foreground">
            Configure sua organização
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                {error}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="tenantName">Nome da Empresa</Label>
              <Input
                id="tenantName"
                name="tenantName"
                value={form.tenantName}
                onChange={handleChange}
                placeholder="Minha Empresa"
                required
                minLength={3}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="adminName">Seu Nome (Admin)</Label>
              <Input
                id="adminName"
                name="adminName"
                value={form.adminName}
                onChange={handleChange}
                placeholder="Meu nome"
                required
                minLength={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="admin@empresa.com"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Mínimo 8 caracteres"
                required
                minLength={8}
              />
            </div>
            <Button
              type="submit"
              className="w-full rounded-full"
              disabled={loading}
            >
              {loading ? "Criando..." : "Criar Conta"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
