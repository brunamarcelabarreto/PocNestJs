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

interface AlertDialogState {
  open: boolean;
  title: string;
  message: string;
}

const alertState: AlertDialogState = {
  open: false,
  title: "Aviso",
  message: "",
};

let resolveAlert: (() => void) | null = null;

export function useAlert() {
  const [state, setState] = useState<AlertDialogState>(alertState);

  const showAlert = useCallback((message: string, title = "Aviso") => {
    setState({ open: true, title, message });
    return new Promise<void>((resolve) => {
      resolveAlert = resolve;
    });
  }, []);

  const handleClose = useCallback(() => {
    setState((prev) => ({ ...prev, open: false }));
    if (resolveAlert) {
      resolveAlert();
      resolveAlert = null;
    }
  }, []);

  return {
    state,
    showAlert,
    handleClose,
  };
}

interface AlertDialogComponentProps {
  open: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export function AlertDialog({
  open,
  title,
  message,
  onClose,
}: AlertDialogComponentProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{message}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={onClose} className="rounded-full">
            OK
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
