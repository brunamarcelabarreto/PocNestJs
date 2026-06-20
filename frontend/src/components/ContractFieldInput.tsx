import type { TemplateField } from "../types";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContractFieldInputProps {
  field: TemplateField;
  value: string;
  onChange: (value: string) => void;
}

export function ContractFieldInput({
  field,
  value,
  onChange,
}: ContractFieldInputProps) {
  if (field.fieldType === "TEXTAREA") {
    return (
      <textarea
        className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={3}
        required={field.required}
      />
    );
  }

  if (field.fieldType === "BOOLEAN") {
    return (
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">Sim</SelectItem>
          <SelectItem value="false">Não</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  const typeMap: Record<string, string> = {
    DATE: "date",
    NUMBER: "number",
    EMAIL: "email",
  };

  return (
    <Input
      type={typeMap[field.fieldType] ?? "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      required={field.required}
      className="h-8 text-sm"
    />
  );
}
