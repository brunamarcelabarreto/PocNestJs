import { useState, useEffect, useCallback, useRef } from "react";
import { templatesApi } from "../api/templates";
import type { TemplateFieldInput } from "../api/templates";
import type { Template, TemplateField, FieldType } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { CreateTemplateSchema, validateForm } from "../lib/validations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Plus, Pencil } from "lucide-react";
import { USER_ROLE } from "../constants/auth";

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "TEXT", label: "Texto" },
  { value: "TEXTAREA", label: "Texto longo" },
  { value: "NUMBER", label: "Número" },
  { value: "DATE", label: "Data" },
  { value: "BOOLEAN", label: "Booleano" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Telefone" },
];

interface FieldDraft {
  _key: string;
  name: string;
  fieldType: FieldType;
  required: boolean;
  placeholder: string;
}

let _keyCounter = 0;
const emptyField = (): FieldDraft => ({
  _key: String(++_keyCounter),
  name: "",
  fieldType: "TEXT",
  required: false,
  placeholder: "",
});

export function TemplateConfig() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  // undefined = list view, null = create mode, Template = edit mode
  const [editingTemplate, setEditingTemplate] = useState<
    Template | null | undefined
  >(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [fields, setFields] = useState<FieldDraft[]>([emptyField()]);
  const loadingRef = useRef(false);

  const loadTemplates = useCallback(async () => {
    if (loadingRef.current) return; // Prevent duplicate requests
    loadingRef.current = true;
    setLoading(true);
    try {
      const data = await templatesApi.list();
      setTemplates(data);
    } catch {
      setTemplates([]);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleNew = () => {
    setEditingTemplate(null);
    setTemplateName("");
    setFields([emptyField()]);
    setError("");
    setSuccess("");
  };

  const handleEdit = (tmpl: Template) => {
    setEditingTemplate(tmpl);
    setTemplateName(tmpl.name);
    setFields(
      tmpl.fields.map((f: TemplateField) => ({
        _key: String(++_keyCounter),
        name: f.name,
        fieldType: f.fieldType,
        required: f.required,
        placeholder: f.placeholder || "",
      })),
    );
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setEditingTemplate(undefined);
    setError("");
  };

  const addField = () => setFields([...fields, emptyField()]);

  const removeField = (index: number) =>
    setFields(fields.filter((_, i) => i !== index));

  const updateField = (
    index: number,
    key: keyof FieldDraft,
    value: string | boolean,
  ) =>
    setFields(fields.map((f, i) => (i === index ? { ...f, [key]: value } : f)));

  const validateTemplate = (): string | null => {
    try {
      const validFields = fields.filter((f) => f.name.trim());
      const nameTrimed = templateName.trim();

      if (!nameTrimed) {
        return "Nome do template não pode estar vazio";
      }

      const result = validateForm(CreateTemplateSchema, {
        name: nameTrimed,
        fields: validFields,
      });

      if (!result.success) {
        return result.error || "Erro de validação";
      }

      if (!editingTemplate) {
        const existingNames = templates.map((t) => t.name.trim().toLowerCase());
        const nameToCheck = nameTrimed.toLowerCase();

        if (existingNames.includes(nameToCheck)) {
          return `Já existe um template com o nome "${nameTrimed}". Escolha outro nome.`;
        }
      }

      return null;
    } catch (err) {
      return "Erro ao validar template. Tente novamente.";
    }
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");

    const validationError = validateTemplate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    const validFields = fields.filter((f) => f.name.trim());
    const payload = {
      name: templateName,
      fields: validFields.map(
        (f, i): TemplateFieldInput => ({ ...f, order: i }),
      ),
    };

    try {
      if (editingTemplate) {
        await templatesApi.update(editingTemplate.id, payload);
      } else {
        await templatesApi.create(payload);
      }
      setSuccess("Template salvo com sucesso!");
      setEditingTemplate(undefined);
      await loadTemplates();
    } catch (err: unknown) {
      const msg = (
        err as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data?.message;
      setError(
        Array.isArray(msg) ? msg.join(", ") : msg || "Erro ao salvar template",
      );
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user?.role === USER_ROLE.ADMIN;

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
          <h1 className="text-2xl font-bold text-foreground">
            Templates de Contrato
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {editingTemplate === undefined
              ? `${templates.length} template(s) configurado(s)`
              : editingTemplate
                ? `Editando: ${editingTemplate.name}`
                : "Novo Template"}
          </p>
        </div>
        {isAdmin && editingTemplate === undefined && (
          <Button onClick={handleNew} className="rounded-full">
            <Plus size={14} className="mr-1.5" />
            Novo Template
          </Button>
        )}
      </div>

      {success && (
        <div
          className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded-lg px-3 py-2 cursor-pointer"
          onClick={() => setSuccess("")}
        >
          {success}
        </div>
      )}
      {error && (
        <div
          className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2 cursor-pointer"
          onClick={() => setError("")}
        >
          {error}
        </div>
      )}

      {editingTemplate === undefined ? (
        <Card>
          <CardContent className="p-0">
            {templates.length === 0 ? (
              <p className="text-muted-foreground text-sm p-6">
                Nenhum template configurado.
                {isAdmin && ' Clique em "Novo Template" para começar.'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Campos</TableHead>
                    {isAdmin && <TableHead className="w-20"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map((tmpl) => (
                    <TableRow key={tmpl.id}>
                      <TableCell className="font-medium">{tmpl.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        v{tmpl.version}
                      </TableCell>
                      <TableCell>
                        {tmpl.active ? (
                          <Badge variant="outline" className="status-active">
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="status-closed">
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {tmpl.fields.length} campo(s)
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary"
                            onClick={() => handleEdit(tmpl)}
                          >
                            <Pencil size={12} className="mr-1" /> Editar
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-1.5">
              <Label htmlFor="templateName">Nome do Template</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTemplateName(e.target.value)
                }
                placeholder="Ex: Contrato de Prestação de Serviços"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                Campos do Contrato
              </p>

              {fields.map((field, i) => (
                <div
                  key={field._key}
                  className="flex items-end gap-3 p-3 rounded-lg border border-border"
                >
                  <span className="text-xs text-muted-foreground w-5 pb-2 flex-shrink-0">
                    {i + 1}
                  </span>

                  <div className="space-y-1.5 flex-[2]">
                    <Label className="text-xs">Nome</Label>
                    <Input
                      value={field.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateField(i, "name", e.target.value)
                      }
                      placeholder="Ex: Nome"
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-[120px]">
                    <Label className="text-xs">Tipo</Label>
                    <Select
                      value={field.fieldType}
                      onValueChange={(v: string) =>
                        updateField(i, "fieldType", v)
                      }
                    >
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 flex-1">
                    <Label className="text-xs">Placeholder</Label>
                    <Input
                      value={field.placeholder}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateField(i, "placeholder", e.target.value)
                      }
                      placeholder="Opcional"
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 pb-2 flex-shrink-0">
                    <Checkbox
                      id={`req-${i}`}
                      checked={field.required}
                      onCheckedChange={(checked: boolean) =>
                        updateField(i, "required", checked === true)
                      }
                    />
                    <Label
                      htmlFor={`req-${i}`}
                      className="text-xs cursor-pointer"
                    >
                      Obrig.
                    </Label>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0 mb-0.5"
                    onClick={() => removeField(i)}
                    disabled={fields.length === 1}
                  ></Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={addField}
              >
                <Plus size={14} className="mr-1" /> Adicionar Campo
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="rounded-full"
                >
                  {saving
                    ? "Salvando..."
                    : editingTemplate
                      ? "Salvar Alterações"
                      : "Criar Template"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
