import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { contractsApi } from "../api/contracts";
import { templatesApi } from "../api/templates";
import type { Contract, Template, TemplateField } from "../types";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Plus, ChevronLeft, ChevronRight, Search } from "lucide-react";

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  ACTIVE: "Ativo",
  CLOSED: "Encerrado",
};

export function ContractList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [template, setTemplate] = useState<Template | null>(null);

  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);

  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const loadContracts = useCallback(async () => {
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
    }
  }, [page, status, search, startDate, endDate]);

  useEffect(() => {
    loadContracts();
  }, [loadContracts]);

  const openCreateModal = async () => {
    try {
      const tmpl = await templatesApi.getActive();
      setTemplate(tmpl);
      const defaults: Record<string, string> = {};
      tmpl.fields.forEach((f: TemplateField) => {
        defaults[f.id] = f.defaultValue || "";
      });
      setFieldValues(defaults);
      setNewTitle("");
      setNewDescription("");
      setCreateError("");
      setShowModal(true);
    } catch {
      alert(
        "Nenhum template ativo encontrado. Configure um template primeiro.",
      );
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const contract = await contractsApi.create({
        templateId: template!.id,
        title: newTitle,
        description: newDescription || undefined,
        fields: fieldValues,
      });
      setShowModal(false);
      navigate(`/contracts/${contract.id}`);
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message;
      setCreateError(
        Array.isArray(msg) ? msg.join(", ") : msg || "Erro ao criar contrato",
      );
    } finally {
      setCreating(false);
    }
  };

  const renderFieldInput = (field: TemplateField) => {
    const value = fieldValues[field.id] ?? "";
    const onChange = (v: string) =>
      setFieldValues({ ...fieldValues, [field.id]: v });

    switch (field.fieldType) {
      case "TEXTAREA":
        return (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            required={field.required}
          />
        );
      case "BOOLEAN":
        return (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
          >
            <option value="">Selecione</option>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        );
      case "DATE":
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={field.required}
            className="h-8 text-sm"
          />
        );
      case "NUMBER":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="h-8 text-sm"
          />
        );
      case "EMAIL":
        return (
          <Input
            type="email"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="h-8 text-sm"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="h-8 text-sm"
          />
        );
    }
  };

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
          <Button onClick={openCreateModal} className="rounded-full">
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
                  placeholder="Título, descrição..."
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
              <Label className="text-xs">Até</Label>
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
                  <TableHead>Título</TableHead>
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
                      {c.template?.name || "—"}
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
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="h-7 text-xs text-primary"
                      >
                        <Link to={`/contracts/${c.id}`}>Ver →</Link>
                      </Button>
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
                Próxima <ChevronRight size={14} className="ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showModal && !!template}
        onOpenChange={(open) => !open && setShowModal(false)}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Contrato</DialogTitle>
          </DialogHeader>
          <form
            id="create-contract-form"
            onSubmit={handleCreate}
            className="space-y-4"
          >
            {createError && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
                {createError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="newTitle">Título *</Label>
              <Input
                id="newTitle"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Título do contrato"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newDesc">Descrição</Label>
              <Input
                id="newDesc"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Descrição opcional"
              />
            </div>

            {template && template.fields.length > 0 && (
              <>
                <Separator />
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Campos do Template: {template.name}
                </p>
                {template.fields.map((field) => (
                  <div key={field.id} className="space-y-1.5">
                    <Label>
                      {field.name}{" "}
                      {field.required && (
                        <span className="text-destructive">*</span>
                      )}
                    </Label>
                    {field.fieldType === "TEXTAREA" ? (
                      <textarea
                        className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        value={fieldValues[field.id] ?? ""}
                        onChange={(e) =>
                          setFieldValues({
                            ...fieldValues,
                            [field.id]: e.target.value,
                          })
                        }
                        placeholder={field.placeholder}
                        rows={3}
                        required={field.required}
                      />
                    ) : field.fieldType === "BOOLEAN" ? (
                      <Select
                        value={fieldValues[field.id] ?? ""}
                        onValueChange={(v) =>
                          setFieldValues({ ...fieldValues, [field.id]: v })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Sim</SelectItem>
                          <SelectItem value="false">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      renderFieldInput(field)
                    )}
                  </div>
                ))}
              </>
            )}
          </form>
          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowModal(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              form="create-contract-form"
              disabled={creating}
              className="rounded-full"
            >
              {creating ? "Criando..." : "Criar Contrato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
