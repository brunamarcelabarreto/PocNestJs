import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { contractsApi } from "../api/contracts";
import type { Contract } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, ChevronLeft, ChevronRight, Search, Pencil } from "lucide-react";
import { CreateContractModal } from "../components/CreateContractModal";
import { EditContractModal } from "../components/EditContractModal";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  CLOSED: "Encerrado",
};

export function ContractList() {
  const { user } = useAuth();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const loadingRef = useRef(false);

  const loadContracts = useCallback(async () => {
    if (loadingRef.current) return; 
    loadingRef.current = true;
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, limit: 10 };
      if (status) params.status = status;
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const data = await contractsApi.list(params);
      setContracts(data.data);
      setPagination(data.pagination);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [page, status, search, startDate, endDate]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contratos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {pagination.total} contrato(s) encontrado(s)
          </p>
        </div>
        {user?.role === "ADMIN" && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="rounded-full"
          >
            <Plus size={16} className="mr-1" /> Novo Contrato
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="space-y-1.5 lg:col-span-1">
              <Label className="text-xs">Buscar</Label>
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Titulo, descricao..."
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Status</Label>
              <Select
                value={status || "_all"}
                onValueChange={(v) => {
                  setStatus(v === "_all" ? "" : v);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">Todos</SelectItem>
                  <SelectItem value="DRAFT">Rascunho</SelectItem>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="CLOSED">Encerrado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">De</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Ate</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="h-8 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner" />
            </div>
          ) : contracts.length === 0 ? (
            <p className="text-muted-foreground text-sm p-6">
              Nenhum contrato encontrado.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titulo</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <Link
                        to={`/contracts/${c.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {c.title}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {c.template?.name || "-"}
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
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {user?.role === "ADMIN" && c.status === "DRAFT" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setEditingContract(c)}
                          >
                            <Pencil size={12} className="mr-1" /> Editar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="h-7 text-xs text-primary"
                        >
                          <Link to={`/contracts/${c.id}`}>Ver</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-7"
              >
                <ChevronLeft size={14} className="mr-1" /> Anterior
              </Button>
              <span className="text-xs text-muted-foreground">
                {page} / {pagination.pages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page === pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="h-7"
              >
                Proxima <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <CreateContractModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      <EditContractModal
        contract={editingContract}
        onClose={() => setEditingContract(null)}
        onSaved={loadContracts}
      />
    </div>
  );
}
