import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
}

const confirmState: ConfirmDialogState = {
  open: false,
  title: "Confirmação",
  message: "",
};

let resolveConfirm: ((value: boolean) => void) | null = null;

export function useConfirm() {
  const [state, setState] = useState<ConfirmDialogState>(confirmState);

  const showConfirm = useCallback((message: string, title = "Confirmação") => {
    setState({ open: true, title, message });
    return new Promise<boolean>((resolve) => {
      resolveConfirm = resolve;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
    if (resolveConfirm) {
      resolveConfirm(true);
      resolveConfirm = null;
    }
  }, []);

  const handleCancel = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
    if (resolveConfirm) {
      resolveConfirm(false);
      resolveConfirm = null;
    }
  }, []);

  return {
    state,
    showConfirm,
    handleConfirm,
    handleCancel,
  };
}

interface ConfirmDialogComponentProps {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogComponentProps) {
  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onCancel} className="rounded-full">
            Cancelar
          </Button>
          <Button onClick={onConfirm} className="rounded-full">
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
