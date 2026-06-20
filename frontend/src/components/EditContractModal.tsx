import { useState, useEffect } from "react";
import { contractsApi } from "../api/contracts";
import type { Contract } from "../types";
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
import { Separator } from "@/components/ui/separator";
import { ContractFieldInput } from "./ContractFieldInput";

interface EditContractModalProps {
  contract: Contract | null;
  onClose: () => void;
  onSaved: () => void;
}

export function EditContractModal({
  contract,
  onClose,
  onSaved,
}: EditContractModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (contract) {
      setTitle(contract.title);
      setDescription(contract.description || "");
      const vals: Record<string, string> = {};
      contract.fields.forEach((cf) => {
        vals[cf.fieldId] = cf.value || "";
      });
      setFieldValues(vals);
      setError("");
    }
  }, [contract]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;
    setError("");
    setUpdating(true);
    try {
      await contractsApi.update(contract.id, {
        title,
        description: description || undefined,
        fields: fieldValues,
      });
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (
        err as { response?: { data?: { message?: string | string[] } } }
      )?.response?.data?.message;
      setError(
        Array.isArray(msg)
          ? msg.join(", ")
          : msg || "Erro ao atualizar contrato",
      );
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Dialog open={!!contract} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Contrato</DialogTitle>
        </DialogHeader>
        <form
          id="edit-contract-form"
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="edit-title">Título *</Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do contrato"
              required
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-desc">Descrição</Label>
            <Input
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional"
            />
          </div>
          {contract && contract.fields.length > 0 && (
            <>
              <Separator />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Campos do Contrato
              </p>
              {contract.fields.map((cf) => (
                <div key={cf.id} className="space-y-1.5">
                  <Label>
                    {cf.field?.name}{" "}
                    {cf.field?.required && (
                      <span className="text-destructive">*</span>
                    )}
                  </Label>
                  {cf.field && (
                    <ContractFieldInput
                      field={cf.field}
                      value={fieldValues[cf.fieldId] ?? ""}
                      onChange={(v) =>
                        setFieldValues({ ...fieldValues, [cf.fieldId]: v })
                      }
                    />
                  )}
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
            form="edit-contract-form"
            disabled={updating}
            className="rounded-full"
          >
            {updating ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
