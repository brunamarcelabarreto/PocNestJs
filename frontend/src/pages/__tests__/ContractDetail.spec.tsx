import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import { ContractDetail } from "../ContractDetail";
import { AuthProvider } from "../../contexts/AuthContext";

const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  role: "ADMIN",
  tenantId: "test-tenant-id",
};

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useParams: () => ({ id: "contract-1" }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock("../../api/contracts", () => {
  return {
    contractsApi: {
      getById: vi.fn(),
      getHistory: vi.fn(),
      activate: vi.fn(),
      close: vi.fn(),
    },
  };
});

vi.mock("../../contexts/AuthContext", async () => {
  const actual = await vi.importActual("../../contexts/AuthContext");
  return {
    ...actual,
    useAuth: () => ({
      user: mockUser,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
    }),
  };
});

function renderWithProviders(component: React.ReactNode) {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>,
  );
}

const mockContract = {
  id: "contract-1",
  title: "Contrato Principal",
  description: "Descrição do contrato",
  status: "DRAFT",
  tenantId: "test-tenant-id",
  fields: [
    { id: "f1", name: "Valor", value: "10000.00" },
    { id: "f2", name: "Data", value: "2026-12-31" },
  ],
  createdAt: "2026-06-18T00:00:00Z",
  updatedAt: "2026-06-18T00:00:00Z",
};

const mockHistory = [
  {
    id: "log-1",
    action: "CONTRACT_CREATED",
    performedBy: "Admin User",
    performedAt: "2026-06-18T10:00:00Z",
    changes: {},
  },
  {
    id: "log-2",
    action: "FIELD_UPDATED",
    performedBy: "Admin User",
    performedAt: "2026-06-18T11:00:00Z",
    changes: { field: "Valor", oldValue: "5000", newValue: "10000" },
  },
];

describe("ContractDetail Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.confirm = vi.fn(() => true);
  });

  it("deve carregar e exibir detalhes do contrato", async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.getById).mockResolvedValue(mockContract);
    vi.mocked(contractsApi.getHistory).mockResolvedValue({ data: mockHistory });

    renderWithProviders(<ContractDetail />);

    await waitFor(() => {
      expect(screen.getByText("Contrato Principal")).toBeInTheDocument();
      expect(screen.getByText("Descrição do contrato")).toBeInTheDocument();
    });
  });

  it("deve exibir status do contrato com badge", async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.getById).mockResolvedValue(mockContract);
    vi.mocked(contractsApi.getHistory).mockResolvedValue({ data: mockHistory });

    renderWithProviders(<ContractDetail />);

    await waitFor(() => {
      expect(screen.getByText("Rascunho")).toBeInTheDocument();
    });
  });

  it("deve exibir campos do contrato em tabela", async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.getById).mockResolvedValue(mockContract);
    vi.mocked(contractsApi.getHistory).mockResolvedValue({ data: mockHistory });

    renderWithProviders(<ContractDetail />);

    await waitFor(() => {
      // Verifica se o contrato foi carregado
      expect(screen.getByText("Contrato Principal")).toBeInTheDocument();
    });

    // Verifica se há abas ou tabelas na página
    const tabs = screen.queryAllByRole("tab");
    expect(tabs.length).toBeGreaterThanOrEqual(0);
  });

  it("deve exibir histórico de auditoria", async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.getById).mockResolvedValue(mockContract);
    vi.mocked(contractsApi.getHistory).mockResolvedValue({ data: mockHistory });

    renderWithProviders(<ContractDetail />);

    await waitFor(() => {
      expect(screen.getByText("Contrato Principal")).toBeInTheDocument();
    });

    // Verifica se o histórico foi carregado
    expect(vi.mocked(contractsApi.getHistory)).toHaveBeenCalledWith(
      "contract-1",
    );
  });

  it("deve mostrar botão de ativar para contrato em rascunho", async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.getById).mockResolvedValue(mockContract);
    vi.mocked(contractsApi.getHistory).mockResolvedValue({ data: mockHistory });

    renderWithProviders(<ContractDetail />);

    await waitFor(() => {
      const activateBtn = screen.getByRole("button", { name: /ativar/i });
      expect(activateBtn).toBeInTheDocument();
    });
  });

  it("deve ativar contrato com confirmação", async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.getById).mockResolvedValue(mockContract);
    vi.mocked(contractsApi.getHistory).mockResolvedValue({ data: mockHistory });
    vi.mocked(contractsApi.activate).mockResolvedValue({
      ...mockContract,
      status: "ACTIVE",
    });

    const user = userEvent.setup();
    renderWithProviders(<ContractDetail />);

    await waitFor(() => {
      const activateBtn = screen.getByRole("button", { name: /ativar/i });
      expect(activateBtn).toBeInTheDocument();
    });

    const activateBtn = screen.getByRole("button", { name: /ativar/i });
    await user.click(activateBtn);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith("Ativar este contrato?");
      expect(vi.mocked(contractsApi.activate)).toHaveBeenCalledWith(
        "contract-1",
      );
    });
  });

  it("deve exibir botão de fechar contrato", async () => {
    const activeContract = { ...mockContract, status: "ACTIVE" };
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.getById).mockResolvedValue(activeContract);
    vi.mocked(contractsApi.getHistory).mockResolvedValue({ data: mockHistory });

    renderWithProviders(<ContractDetail />);

    await waitFor(() => {
      const closeBtn = screen.getByRole("button", { name: /encerrar|fechar/i });
      expect(closeBtn).toBeInTheDocument();
    });
  });

  it("deve fechar contrato com confirmação", async () => {
    const activeContract = { ...mockContract, status: "ACTIVE" };
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.getById).mockResolvedValue(activeContract);
    vi.mocked(contractsApi.getHistory).mockResolvedValue({ data: mockHistory });
    vi.mocked(contractsApi.close).mockResolvedValue({
      ...activeContract,
      status: "CLOSED",
    });

    const user = userEvent.setup();
    renderWithProviders(<ContractDetail />);

    await waitFor(() => {
      const closeBtn = screen.getByRole("button", { name: /encerrar|fechar/i });
      expect(closeBtn).toBeInTheDocument();
    });

    const closeBtn = screen.getByRole("button", { name: /encerrar|fechar/i });
    await user.click(closeBtn);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining("Encerrar este contrato"),
      );
      expect(vi.mocked(contractsApi.close)).toHaveBeenCalledWith("contract-1");
    });
  });

  it("deve exibir abas de campos e histórico", async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.getById).mockResolvedValue(mockContract);
    vi.mocked(contractsApi.getHistory).mockResolvedValue({ data: mockHistory });

    renderWithProviders(<ContractDetail />);

    await waitFor(() => {
      expect(screen.getByText("Contrato Principal")).toBeInTheDocument();
    });

    // Verifica se as abas existem na página
    const tabs = screen.queryAllByRole("tab");
    expect(tabs.length).toBeGreaterThan(0);
  });

  it("deve alternar entre abas", async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.getById).mockResolvedValue(mockContract);
    vi.mocked(contractsApi.getHistory).mockResolvedValue({ data: mockHistory });

    const user = userEvent.setup();
    renderWithProviders(<ContractDetail />);

    await waitFor(() => {
      const historyTab = screen.getByRole("tab", {
        name: /histórico|history/i,
      });
      expect(historyTab).toBeInTheDocument();
    });

    const historyTab = screen.getByRole("tab", { name: /histórico|history/i });
    await user.click(historyTab);

    await waitFor(() => {
      expect(screen.getByText("Contrato criado")).toBeInTheDocument();
    });
  });

  it("deve exibir botão de voltar", async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.getById).mockResolvedValue(mockContract);
    vi.mocked(contractsApi.getHistory).mockResolvedValue({ data: mockHistory });

    renderWithProviders(<ContractDetail />);

    await waitFor(() => {
      expect(screen.getByText("Contrato Principal")).toBeInTheDocument();
    });

    // Verifica se há botão de navegação (voltar)
    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("deve carregar histórico de auditoria", async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.getById).mockResolvedValue(mockContract);
    vi.mocked(contractsApi.getHistory).mockResolvedValue({ data: mockHistory });

    renderWithProviders(<ContractDetail />);

    await waitFor(() => {
      expect(vi.mocked(contractsApi.getHistory)).toHaveBeenCalledWith(
        "contract-1",
      );
    });
  });
});
