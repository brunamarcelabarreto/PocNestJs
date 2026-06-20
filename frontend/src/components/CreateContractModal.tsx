import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contractsApi } from "../api/contracts";
import { templatesApi } from "../api/templates";
import type { Template, TemplateField } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ContractFieldInput } from "./ContractFieldInput";

interface CreateContractModalProps {
  open: boolean;
  onClose: () => void;
}

export function CreateContractModal({
  open,
  onClose,
}: CreateContractModalProps) {
  const navigate = useNavigate();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [template, setTemplate] = useState<Template | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const initDefaults = (tmpl: Template) => {
    const defaults: Record<string, string> = {};
    tmpl.fields.forEach((f: TemplateField) => {
      defaults[f.id] = f.defaultValue || "";
    });
    setFieldValues(defaults);
  };

  useEffect(() => {

    if (!open) {
      console.log("[CreateContractModal] Modal fechando");
      setTemplate(null);
      setTemplates([]);
      setTitle("");
      setDescription("");
      setFieldValues({});
      setError("");
      return;
    }

    const loadTemplates = async () => {
      try {
        console.log("[CreateContractModal] Chamando templatesApi.list()...");
        const tmplList = await templatesApi.list();
        console.log("[CreateContractModal] Templates carregados:", tmplList);

        if (!tmplList || tmplList.length === 0) {
          console.warn("[CreateContractModal] Nenhum template encontrado");
          setError(
            "Nenhum template encontrado. Configure um template primeiro.",
          );
          setTemplates([]);
          setTemplate(null);
          return;
        }

        setTemplates(tmplList);
        const firstTemplate = tmplList[0];
        console.log("[CreateContractModal] Primeiro template:", firstTemplate);
        setTemplate(firstTemplate);
        initDefaults(firstTemplate);
        setTitle("");
        setDescription("");
        setError("");
      } catch (err) {
        console.error("[CreateContractModal] Erro ao carregar templates:", err);
        setError("Erro ao carregar templates. Tente novamente.");
        setTemplates([]);
        setTemplate(null);
      }
    };

    loadTemplates();
  }, [open]);

  const handleTemplateChange = (templateId: string) => {
    const selected = templates.find((t) => t.id === templateId);
    if (selected) {
      setTemplate(selected);
      initDefaults(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;
    setError("");
    setCreating(true);
    try {
      const contract = await contractsApi.create({
        templateId: template.id,
        title,
        description: description || undefined,
        fields: fieldValues,
      });
      onClose();
      navigate(`/contracts/${contract.id}`);
    } catch (err: unknown) {
      const msg = (
        err as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data?.message;
      setError(
        Array.isArray(msg) ? msg.join(", ") : msg || "Erro ao criar contrato",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Contrato</DialogTitle>
        </DialogHeader>
        <form
          id="create-contract-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Template *</Label>
            <div className="text-xs text-muted-foreground mb-2">
              Debug: {templates.length} templates carregados
            </div>
            {templates.length === 0 ? (
              <div className="text-sm text-destructive">
                Nenhum template disponível. Crie um template primeiro.
              </div>
            ) : (
              <Select
                value={template?.id || ""}
                onValueChange={handleTemplateChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-title">Título *</Label>
            <Input
              id="create-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do contrato"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="create-desc">Descrição</Label>
            <Input
              id="create-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                  <ContractFieldInput
                    field={field}
                    value={fieldValues[field.id] ?? ""}
                    onChange={(v) =>
                      setFieldValues({ ...fieldValues, [field.id]: v })
                    }
                  />
                </div>
              ))}
            </>
          )}
        </form>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
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
  );
}
