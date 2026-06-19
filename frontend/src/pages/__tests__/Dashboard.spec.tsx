import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";

const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  name: "Test User",
  role: "ADMIN",
  tenantId: "test-tenant-id",
};

vi.mock("../../api/contracts", () => {
  return {
    contractsApi: {
      list: vi.fn(),
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

import { Dashboard } from "../Dashboard";
import { AuthProvider } from "../../contexts/AuthContext";

const mockContracts = [
  {
    id: "1",
    title: "Contract 1",
    status: "DRAFT",
    createdAt: "2026-06-18T00:00:00Z",
    tenantId: "test-tenant-id",
    fields: [],
  },
  {
    id: "2",
    title: "Contract 2",
    status: "ACTIVE",
    createdAt: "2026-06-17T00:00:00Z",
    tenantId: "test-tenant-id",
    fields: [],
  },
];

function renderWithProviders(component: React.ReactNode) {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>,
  );
}

describe("Dashboard Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve carregar e exibir estatísticas de contratos", async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.list).mockImplementation((params: any) => {
      if (params?.status === "DRAFT") {
        return Promise.resolve({
          data: [],
          pagination: { total: 3, page: 1, pageSize: 1 },
        });
      } else if (params?.status === "ACTIVE") {
        return Promise.resolve({
          data: [],
          pagination: { total: 5, page: 1, pageSize: 1 },
        });
      } else if (params?.status === "CLOSED") {
        return Promise.resolve({
          data: [],
          pagination: { total: 2, page: 1, pageSize: 1 },
        });
      } else {
        return Promise.resolve({
          data: mockContracts,
          pagination: { total: 10, page: 1, pageSize: 5 },
        });
      }
    });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      // Verifica se os stats são exibidos
      expect(screen.getByText("10")).toBeInTheDocument(); // total
      expect(screen.getByText("3")).toBeInTheDocument(); // draft
      expect(screen.getByText("5")).toBeInTheDocument(); // active
      expect(screen.getByText("2")).toBeInTheDocument(); // closed
    });
  });

  it("deve exibir contratos recentes em tabela", async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.list).mockImplementation((params: any) => {
      if (params?.status) {
        return Promise.resolve({
          data: [],
          pagination: { total: 0, page: 1, pageSize: 1 },
        });
      } else {
        return Promise.resolve({
          data: mockContracts,
          pagination: { total: 2, page: 1, pageSize: 5 },
        });
      }
    });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Contract 1")).toBeInTheDocument();
      expect(screen.getByText("Contract 2")).toBeInTheDocument();
    });
  });

  it("deve exibir mensagem quando não há contratos", async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.list).mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, pageSize: 5 },
    });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Nenhum contrato ainda.")).toBeInTheDocument();
    });
  });

  it('deve mostrar botão "Novo Contrato" para ADMIN', async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.list).mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, pageSize: 5 },
    });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      const btn = screen.getByRole("link", { name: /novo contrato/i });
      expect(btn).toBeInTheDocument();
      expect(btn).toHaveAttribute("href", "/contracts");
    });
  });

  it("deve exibir nome do usuário na saudação", async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.list).mockResolvedValue({
      data: [],
      pagination: { total: 0, page: 1, pageSize: 5 },
    });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Bem-vindo, Test User")).toBeInTheDocument();
    });
  });

  it("deve exibir status dos contratos com badges corretas", async () => {
    const { contractsApi } = await import("../../api/contracts");
    vi.mocked(contractsApi.list).mockImplementation((params: any) => {
      if (params?.status) {
        return Promise.resolve({
          data: [],
          pagination: { total: 0, page: 1, pageSize: 1 },
        });
      } else {
        return Promise.resolve({
          data: mockContracts,
          pagination: { total: 2, page: 1, pageSize: 5 },
        });
      }
    });

    renderWithProviders(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText("Rascunho")).toBeInTheDocument();
      expect(screen.getByText("Ativo")).toBeInTheDocument();
    });
  });
});
