import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { contractsApi } from "../api/contracts";
import type { Contract } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  CheckCircle,
  Archive,
  LayoutDashboard,
  Settings,
} from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  CLOSED: "Encerrado",
};

export function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    active: 0,
    closed: 0,
  });
  const [recent, setRecent] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const loadingRef = useRef(false);

  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    const load = async () => {
      try {
        const [allRes, draftRes, activeRes, closedRes] = await Promise.all([
          contractsApi.list({ limit: 5 }),
          contractsApi.list({ status: "DRAFT", limit: 1 }),
          contractsApi.list({ status: "ACTIVE", limit: 1 }),
          contractsApi.list({ status: "CLOSED", limit: 1 }),
        ]);
        setRecent(allRes.data);
        setStats({
          total: allRes.pagination.total,
          draft: draftRes.pagination.total,
          active: activeRes.pagination.total,
          closed: closedRes.pagination.total,
        });
      } catch {
        // silently fail
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    };
    load();
  }, []);

  if (loading)
    return (
      <div className="full-loading">
        <div className="spinner" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Bem-vindo, {user?.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Contratos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <FileText size={12} /> Rascunhos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-amber-400">
              {stats.draft}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <CheckCircle size={12} /> Ativos
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-emerald-400">
              {stats.active}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Archive size={12} /> Encerrados
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-muted-foreground">
              {stats.closed}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="hover:border-primary/40 transition-colors cursor-pointer">
          <Link to="/templates" className="block p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                <Settings size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm">Configurar Template</p>
                <p className="text-xs text-muted-foreground">
                  Gerencie os campos padrão
                </p>
              </div>
            </div>
          </Link>
        </Card>
        <Card className="hover:border-primary/40 transition-colors cursor-pointer">
          <Link to="/contracts" className="block p-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary">
                <LayoutDashboard size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm">Lista de Contratos</p>
                <p className="text-xs text-muted-foreground">
                  Visualize e filtre contratos
                </p>
              </div>
            </div>
          </Link>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Contratos Recentes</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-primary h-7 text-xs"
          >
            <Link to="/contracts">Ver todos →</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <p className="text-muted-foreground text-sm px-6 pb-6">
              Nenhum contrato ainda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        to={`/contracts/${c.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {c.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`status-${c.status.toLowerCase()}`}
                      >
                        {STATUS_LABEL[c.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
