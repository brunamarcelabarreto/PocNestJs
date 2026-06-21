import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { contractsApi } from "../api/contracts";
import { templatesApi } from "../api/templates";
import type { Template, TemplateField } from "../types";
import {
  CreateContractSchema,
  validateForm,
  validateRequiredFields,
} from "../lib/validations";
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
  const [contracts, setContracts] = useState<
    Array<{ id: string; title: string }>
  >([]);
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
      setContracts([]);
      setTitle("");
      setDescription("");
      setFieldValues({});
      setError("");
      return;
    }

    const loadData = async () => {
      try {
        console.log(
          "[CreateContractModal] Carregando templates e contratos...",
        );
        const [tmplList, contractList] = await Promise.all([
          templatesApi.list(),
          contractsApi.list(),
        ]);

        console.log("[CreateContractModal] Templates carregados:", tmplList);
        console.log(
          "[CreateContractModal] Contratos carregados:",
          contractList,
        );

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
        setContracts(contractList || []);
        const firstTemplate = tmplList[0];
        console.log("[CreateContractModal] Primeiro template:", firstTemplate);
        setTemplate(firstTemplate);
        initDefaults(firstTemplate);
        setTitle("");
        setDescription("");
        setError("");
      } catch (err) {
        console.error("[CreateContractModal] Erro ao carregar dados:", err);
        setError("Erro ao carregar dados. Tente novamente.");
        setTemplates([]);
        setTemplate(null);
      }
    };

    loadData();
  }, [open]);

  const handleTemplateChange = (templateId: string) => {
    const selected = templates.find((t) => t.id === templateId);
    if (selected) {
      setTemplate(selected);
      initDefaults(selected);
    }
  };

  const validateContract = (): string | null => {
    // Validação básica com Zod
    const result = validateForm(CreateContractSchema, {
      templateId: template?.id || "",
      title,
      description,
      fields: fieldValues,
    });

    if (!result.success) {
      return result.error || "Erro de validação";
    }

    // Validar título duplicado
    const titleTrimmed = title.trim().toLowerCase();
    const existingTitles = contracts.map((c) => c.title.toLowerCase());
    if (existingTitles.includes(titleTrimmed)) {
      return `Já existe um contrato com o título "${title}".`;
    }

    // Validar campos obrigatórios do template
    if (template) {
      const requiredFields = template.fields
        .filter((f) => f.required)
        .map((f) => ({ id: f.id, name: f.name }));

      const requiredValidation = validateRequiredFields(
        requiredFields,
        fieldValues,
      );
      if (!requiredValidation.success) {
        return (
          requiredValidation.error || "Erro ao validar campos obrigatórios"
        );
      }
    }

    return null;
  };

  const isFormValid = (): boolean => {
    return !validateContract() && template !== null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!template) return;

    const validationError = validateContract();
    if (validationError) {
      setError(validationError);
      return;
    }

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
            disabled={creating || !isFormValid()}
            className="rounded-full"
          >
            {creating ? "Criando..." : "Criar Contrato"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
