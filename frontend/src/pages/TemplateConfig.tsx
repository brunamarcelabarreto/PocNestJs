import { useState, useEffect } from 'react';
import { templatesApi } from '../api/templates';
import type { TemplateFieldInput } from '../api/templates';
import type { Template, TemplateField, FieldType } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Pencil } from 'lucide-react';

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'TEXT', label: 'Texto' },
  { value: 'TEXTAREA', label: 'Texto longo' },
  { value: 'NUMBER', label: 'Número' },
  { value: 'DATE', label: 'Data' },
  { value: 'BOOLEAN', label: 'Booleano' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'PHONE', label: 'Telefone' },
];

interface FieldDraft {
  name: string;
  fieldType: FieldType;
  required: boolean;
  placeholder: string;
}

const emptyField = (): FieldDraft => ({
  name: '',
  fieldType: 'TEXT',
  required: false,
  placeholder: '',
});

export function TemplateConfig() {
  const { user } = useAuth();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [templateName, setTemplateName] = useState('Contrato Padrão');
  const [fields, setFields] = useState<FieldDraft[]>([emptyField()]);

  const loadTemplate = async () => {
    setLoading(true);
    try {
      const data = await templatesApi.getActive();
      setTemplate(data);
      setTemplateName(data.name);
      setFields(
        data.fields.map((f: TemplateField) => ({
          name: f.name,
          fieldType: f.fieldType,
          required: f.required,
          placeholder: f.placeholder || '',
        })),
      );
    } catch {
      setTemplate(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplate();
  }, []);

  const addField = () => setFields([...fields, emptyField()]);

  const removeField = (index: number) =>
    setFields(fields.filter((_, i) => i !== index));

  const updateField = (index: number, key: keyof FieldDraft, value: string | boolean) =>
    setFields(fields.map((f, i) => (i === index ? { ...f, [key]: value } : f)));

  const handleSave = async () => {
    setError('');
    setSuccess('');
    setSaving(true);

    const validFields = fields.filter((f) => f.name.trim());
    if (validFields.length === 0) {
      setError('Adicione pelo menos um campo com nome.');
      setSaving(false);
      return;
    }

    const payload = {
      name: templateName,
      fields: validFields.map((f, i): TemplateFieldInput => ({ ...f, order: i })),
    };

    try {
      if (template) {
        await templatesApi.update(template.id, payload);
      } else {
        await templatesApi.create(payload);
      }
      setSuccess('Template salvo com sucesso!');
      setEditing(false);
      await loadTemplate();
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join(', ') : msg || 'Erro ao salvar template');
    } finally {
      setSaving(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';

  if (loading) return <div className="full-loading"><div className="spinner" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Template de Contrato</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {template
              ? `Versão ${template.version} · Ativo`
              : 'Nenhum template configurado'}
          </p>
        </div>
        {isAdmin && !editing && (
          <Button onClick={() => setEditing(true)} className="rounded-full">
            <Pencil size={14} className="mr-1.5" />
            {template ? 'Editar Template' : 'Criar Template'}
          </Button>
        )}
      </div>

      {success && (
        <div
          className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/30 rounded-lg px-3 py-2 cursor-pointer"
          onClick={() => setSuccess('')}
        >
          {success}
        </div>
      )}
      {error && (
        <div
          className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2 cursor-pointer"
          onClick={() => setError('')}
        >
          {error}
        </div>
      )}

      {!editing ? (
        <Card>
          <CardContent className="p-0">
            {!template ? (
              <p className="text-muted-foreground text-sm p-6">
                Nenhum template configurado.
                {isAdmin && ' Clique em "Criar Template" para começar.'}
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <Badge variant="outline" className="status-active">v{template.version}</Badge>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">#</TableHead>
                      <TableHead>Campo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Obrigatório</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {template.fields.map((field, i) => (
                      <TableRow key={field.id}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{field.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {FIELD_TYPES.find((t) => t.value === field.fieldType)?.label}
                        </TableCell>
                        <TableCell>
                          {field.required ? (
                            <Badge variant="outline" className="status-active text-xs">Sim</Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
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
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateName(e.target.value)}
                placeholder="Ex: Contrato de Prestação de Serviços"
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Campos do Contrato</p>

              {fields.map((field, i) => (
                <div
                  key={i}
                  className="flex items-end gap-3 p-3 rounded-lg border border-border bg-muted/20"
                >
                  <span className="text-xs text-muted-foreground w-5 pb-2 flex-shrink-0">{i + 1}</span>

                  <div className="space-y-1.5 flex-[2]">
                    <Label className="text-xs">Nome</Label>
                    <Input
                      value={field.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField(i, 'name', e.target.value)}
                      placeholder="Ex: Nome do Cliente"
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-[120px]">
                    <Label className="text-xs">Tipo</Label>
                    <Select
                      value={field.fieldType}
                      onValueChange={(v: string) => updateField(i, 'fieldType', v)}
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
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField(i, 'placeholder', e.target.value)}
                      placeholder="Opcional"
                      className="h-8 text-sm"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 pb-2 flex-shrink-0">
                    <Checkbox
                      id={`req-${i}`}
                      checked={field.required}
                      onCheckedChange={(checked: boolean) => updateField(i, 'required', checked === true)}
                    />
                    <Label htmlFor={`req-${i}`} className="text-xs cursor-pointer">Obrig.</Label>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0 mb-0.5"
                    onClick={() => removeField(i)}
                    disabled={fields.length === 1}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="outline" size="sm" onClick={addField}>
                <Plus size={14} className="mr-1" /> Adicionar Campo
              </Button>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
                <Button type="button" onClick={handleSave} disabled={saving} className="rounded-full">
                  {saving ? 'Salvando...' : 'Salvar Template'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
