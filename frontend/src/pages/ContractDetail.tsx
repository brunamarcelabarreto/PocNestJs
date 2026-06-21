import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { contractsApi } from "../api/contracts";
import type { Contract, AuditLog } from "../types";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, CheckCircle, XCircle } from "lucide-react";
import { AlertDialog } from "../components/AlertDialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { STATUS_LABEL, ACTION_LABEL, LOCALE } from "../constants/contracts";
import { USER_ROLE } from "../constants/auth";

export function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [history, setHistory] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Alert states
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertTitle, setAlertTitle] = useState("Aviso");
  const [alertMessage, setAlertMessage] = useState("");

  // Confirm states
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState("Confirmação");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [pendingAction, setPendingAction] = useState<
    (() => Promise<void>) | null
  >(null);
  const [pendingErrorMessage, setPendingErrorMessage] = useState("");

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [contractData, historyData] = await Promise.all([
        contractsApi.getById(id),
        contractsApi.getHistory(id),
      ]);
      setContract(contractData);
      setHistory(historyData.data ?? historyData);
    } catch {
      navigate("/contracts");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusAction = async (
    action: () => Promise<void>,
    confirmMessage: string,
    errorMessage: string,
  ) => {
    setConfirmOpen(true);
    setConfirmTitle("Confirmação");
    setConfirmMessage(confirmMessage);
    setPendingAction(() => action);
    setPendingErrorMessage(errorMessage);
  };

  const handleConfirmAction = async () => {
    if (!contract || !pendingAction) return;
    setConfirmOpen(false);
    setActionLoading(true);
    try {
      await pendingAction();
      await load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })
        ?.response?.data?.message;
      setAlertTitle("Erro");
      setAlertMessage(msg || pendingErrorMessage);
      setAlertOpen(true);
    } finally {
      setActionLoading(false);
      setPendingAction(null);
      setPendingErrorMessage("");
    }
  };

  const handleActivate = () =>
    handleStatusAction(
      () => contractsApi.activate(contract!.id),
      "Ativar este contrato?",
      "Erro ao ativar",
    );

  const handleClose = () =>
    handleStatusAction(
      () => contractsApi.close(contract!.id),
      "Encerrar este contrato? Esta ação não pode ser desfeita.",
      "Erro ao encerrar",
    );

  if (loading)
    return (
      <div className="full-loading">
        <div className="spinner" />
      </div>
    );
  if (!contract) return null;

  const isAdmin = user?.role === USER_ROLE.ADMIN;

  return (
    <div className="space-y-6">
      <AlertDialog
        open={alertOpen}
        title={alertTitle}
        message={alertMessage}
        onClose={() => setAlertOpen(false)}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmOpen(false)}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/contracts")}
            className="h-7 text-muted-foreground -ml-2 mb-1 hover:bg-transparent hover:text-foreground"
          >
            <ChevronLeft size={14} className="mr-0.5" /> Contratos
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-foreground">
              {contract.title}
            </h1>
            <Badge
              variant="outline"
              className={`status-${contract.status.toLowerCase()}`}
            >
              {STATUS_LABEL[contract.status]}
            </Badge>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-2 flex-shrink-0">
            {contract.status === "DRAFT" && (
              <Button
                onClick={handleActivate}
                disabled={actionLoading}
                className="rounded-full bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <CheckCircle size={15} className="mr-1.5" /> Ativar Contrato
              </Button>
            )}
            {contract.status === "ACTIVE" && (
              <Button
                variant="destructive"
                onClick={handleClose}
                disabled={actionLoading}
                className="rounded-full"
              >
                <XCircle size={15} className="mr-1.5" /> Encerrar Contrato
              </Button>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="fields">
        <TabsList className="mb-4">
          <TabsTrigger value="fields">Dados do Contrato</TabsTrigger>
          <TabsTrigger value="history">
            Histórico
            <span className="ml-1.5 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
              {history.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fields">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {contract.description && (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Descrição
                    </p>
                    <p className="text-sm text-foreground">
                      {contract.description}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Template
                  </p>
                  <p className="text-sm text-foreground">
                    {contract.template?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Criado por
                  </p>
                  <p className="text-sm text-foreground">
                    {contract.createdByUser?.name || "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Criado em
                  </p>
                  <p className="text-sm text-foreground">
                    {new Date(contract.createdAt).toLocaleString(LOCALE)}
                  </p>
                </div>
                {contract.activatedAt && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Ativado em
                    </p>
                    <p className="text-sm text-foreground">
                      {new Date(contract.activatedAt).toLocaleString(LOCALE)}
                    </p>
                  </div>
                )}
                {contract.closedAt && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Encerrado em
                    </p>
                    <p className="text-sm text-foreground">
                      {new Date(contract.closedAt).toLocaleString(LOCALE)}
                    </p>
                  </div>
                )}
              </div>

              {contract.fields.length > 0 && (
                <>
                  <Separator className="my-5" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">
                    Campos do Contrato
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {contract.fields.map((cf) => (
                      <div key={cf.id}>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                          {cf.field?.name || cf.fieldId}
                        </p>
                        <p className="text-sm text-foreground">
                          {cf.value || (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-6">
              {history.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Nenhum histórico registrado.
                </p>
              ) : (
                <div className="timeline">
                  {history.map((log) => (
                    <div key={log.id} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <strong className="text-sm text-foreground">
                            {ACTION_LABEL[log.action] || log.action}
                          </strong>
                          <span className="text-xs text-muted-foreground">
                            {log.user?.name} ·{" "}
                            {new Date(log.createdAt).toLocaleString(LOCALE)}
                          </span>
                        </div>
                        {log.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {log.description}
                          </p>
                        )}
                        {log.oldValue && log.newValue && (
                          <div className="timeline-change">
                            <span className="change-old">{log.oldValue}</span>
                            <span className="change-arrow">→</span>
                            <span className="change-new">{log.newValue}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
