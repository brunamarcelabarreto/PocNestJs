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
    if (Array.isArray(tmpl.fields)) {
      tmpl.fields.forEach((f: TemplateField) => {
        defaults[f.id] = f.defaultValue || "";
      });
    }
    setFieldValues(defaults);
  };

  useEffect(() => {
    if (!open) {
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
        const [tmplList, contractList] = await Promise.all([
          templatesApi.list(),
          contractsApi.list(),
        ]);

        if (!tmplList || tmplList.length === 0) {
          setError(
            "Nenhum template encontrado. Configure um template primeiro.",
          );
          setTemplates([]);
          setTemplate(null);
          return;
        }

        setTemplates(tmplList);
        const contractsData = Array.isArray(contractList?.data)
          ? contractList.data
          : [];
        setContracts(contractsData);
        const firstTemplate = tmplList[0];
        setTemplate(firstTemplate);
        initDefaults(firstTemplate);
        setTitle("");
        setDescription("");
        setError("");
      } catch (err) {
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
    try {
      if (!template) {
        return "Selecione um template para criar o contrato";
      }

      const result = validateForm(CreateContractSchema, {
        templateId: template.id,
        title,
        description,
        fields: fieldValues,
      });

      if (!result.success) {
        return result.error || "Erro de validação";
      }

      const existingTitles = Array.isArray(contracts)
        ? contracts.map((c) => c.title.toLowerCase())
        : [];
      const titleTrimmed = title.trim().toLowerCase();
      if (existingTitles.includes(titleTrimmed)) {
        return `Já existe um contrato com o título "${title}".`;
      }

      if (
        template &&
        Array.isArray(template.fields) &&
        template.fields.length > 0
      ) {
        const requiredFields = template.fields
          .filter((f) => f.required)
          .map((f) => ({ id: f.id, name: f.name }));

        if (requiredFields.length > 0) {
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
      }

      return null;
    } catch (err) {
      return "Erro ao validar formulário. Tente novamente.";
    }
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

          {template &&
            Array.isArray(template.fields) &&
            template.fields.length > 0 && (
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
