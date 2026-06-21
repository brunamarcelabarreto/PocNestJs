import { z } from "zod";

export const TemplateFieldSchema = z.object({
  _key: z.string(),
  name: z.string().min(1, "Nome do campo não pode estar vazio"),
  fieldType: z.string().min(1, "Tipo do campo é obrigatório"),
  required: z.boolean(),
  placeholder: z.string().optional(),
});

export const CreateTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Nome do template não pode estar vazio")
    .trim(),
  fields: z
    .array(TemplateFieldSchema)
    .min(1, "Adicione pelo menos um campo com nome")
    .refine(
      (fields) => {
        const names = fields
          .filter((f) => f.name.trim())
          .map((f) => f.name.trim().toLowerCase());
        return new Set(names).size === names.length;
      },
      {
        message: "Campos com nomes duplicados não são permitidos",
      },
    ),
});

export const UpdateTemplateSchema = CreateTemplateSchema;

export type CreateTemplateInput = z.infer<typeof CreateTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof UpdateTemplateSchema>;
export type TemplateField = z.infer<typeof TemplateFieldSchema>;

export const CreateContractSchema = z.object({
  templateId: z.string().optional(), // Validação feita na UI
  title: z
    .string()
    .min(1, "Título do contrato não pode estar vazio")
    .trim(),
  description: z.string().optional(),
  fields: z.record(z.string(), z.string()),
});

export const UpdateContractSchema = z.object({
  title: z
    .string()
    .min(1, "Título do contrato não pode estar vazio")
    .trim()
    .optional(),
  description: z.string().optional(),
  fields: z.record(z.string(), z.string()).optional(),
});

export type CreateContractInput = z.infer<typeof CreateContractSchema>;
export type UpdateContractInput = z.infer<typeof UpdateContractSchema>;

export const validateForm = (
  schema: z.ZodSchema,
  data: unknown,
): { success: boolean; error?: string } => {
  try {
    schema.parse(data);
    return { success: true };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const firstError = err.issues[0];
      return {
        success: false,
        error: firstError.message,
      };
    }
    return {
      success: false,
      error: "Erro ao validar dados",
    };
  }
};
export const validateRequiredFields = (
  requiredFields: Array<{ id: string; name: string }>,
  fieldValues: Record<string, string>,
): { success: boolean; error?: string } => {
  for (const field of requiredFields) {
    if (!fieldValues[field.id]?.trim()) {
      return {
        success: false,
        error: `Campo obrigatório "${field.name}" não pode estar vazio`,
      };
    }
  }
  return { success: true };
};
