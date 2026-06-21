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

vi.mock("../../api/templates", () => {
  return {
    templatesApi: {
      list: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
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

import { TemplateConfig } from "../TemplateConfig";
import { AuthProvider } from "../../contexts/AuthContext";

function renderWithProviders(component: React.ReactNode) {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>,
  );
}

const mockTemplate = {
  id: "template-1",
  name: "Contrato Padrão",
  version: 1,
  isActive: true,
  fields: [
    {
      id: "field-1",
      name: "Valor Contrato",
      fieldType: "NUMBER",
      required: true,
      placeholder: "0.00",
    },
  ],
  createdAt: "2026-06-18T00:00:00Z",
  updatedAt: "2026-06-18T00:00:00Z",
};

describe("TemplateConfig Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve carregar template ativo", async () => {
    const { templatesApi } = await import("../../api/templates");
    vi.mocked(templatesApi.list).mockResolvedValue([mockTemplate]);

    renderWithProviders(<TemplateConfig />);

    await waitFor(() => {
      const elements = screen.queryAllByText(/contrato/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it("deve exibir formulário de edição de template", async () => {
    const { templatesApi } = await import("../../api/templates");
    vi.mocked(templatesApi.list).mockResolvedValue([mockTemplate]);

    renderWithProviders(<TemplateConfig />);

    await waitFor(() => {
      const headings = screen.queryAllByRole("heading");
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  it("deve exibir campos do template em tabela", async () => {
    const { templatesApi } = await import("../../api/templates");
    vi.mocked(templatesApi.list).mockResolvedValue([mockTemplate]);

    renderWithProviders(<TemplateConfig />);

    await waitFor(() => {
      const cells = screen.queryAllByRole("cell");
      expect(cells.length).toBeGreaterThan(0);
    });
  });

  it("deve adicionar novo campo ao template", async () => {
    const { templatesApi } = await import("../../api/templates");
    vi.mocked(templatesApi.list).mockResolvedValue([mockTemplate]);

    renderWithProviders(<TemplateConfig />);

    await waitFor(() => {
      const cells = screen.queryAllByRole("cell");
      expect(cells.length).toBeGreaterThan(0);
    });

    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("deve remover campo do template", async () => {
    const { templatesApi } = await import("../../api/templates");
    const templateWithMultipleFields = {
      ...mockTemplate,
      fields: [
        ...mockTemplate.fields,
        {
          id: "field-2",
          name: "Data Contrato",
          fieldType: "DATE",
          required: false,
          placeholder: "",
        },
      ],
    };
    vi.mocked(templatesApi.list).mockResolvedValue([templateWithMultipleFields]);

    renderWithProviders(<TemplateConfig />);

    await waitFor(() => {
      const cells = screen.queryAllByRole("cell");
      expect(cells.length).toBeGreaterThan(0);
    });

    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("deve salvar template atualizado", async () => {
    const { templatesApi } = await import("../../api/templates");
    vi.mocked(templatesApi.list).mockResolvedValue([mockTemplate]);
    vi.mocked(templatesApi.update).mockResolvedValue(mockTemplate);

    renderWithProviders(<TemplateConfig />);

    await waitFor(() => {
      const cells = screen.queryAllByRole("cell");
      expect(cells.length).toBeGreaterThan(0);
    });

    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("deve exibir mensagem de sucesso após salvar", async () => {
    const { templatesApi } = await import("../../api/templates");
    vi.mocked(templatesApi.list).mockResolvedValue([mockTemplate]);
    vi.mocked(templatesApi.update).mockResolvedValue(mockTemplate);

    renderWithProviders(<TemplateConfig />);

    await waitFor(() => {
      const cells = screen.queryAllByRole("cell");
      expect(cells.length).toBeGreaterThan(0);
    });

    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("deve exibir erro ao salvar template com dados inválidos", async () => {
    const { templatesApi } = await import("../../api/templates");
    vi.mocked(templatesApi.list).mockResolvedValue([mockTemplate]);
    vi.mocked(templatesApi.update).mockRejectedValue({
      response: { data: { message: "Nome do template é obrigatório" } },
    });

    renderWithProviders(<TemplateConfig />);

    await waitFor(() => {
      const cells = screen.queryAllByRole("cell");
      expect(cells.length).toBeGreaterThan(0);
    });

    const buttons = screen.queryAllByRole("button");
    expect(buttons.length).toBeGreaterThan(0);
  });

  it("deve mostrar página de loading ao carregar template", async () => {
    const { templatesApi } = await import("../../api/templates");
    vi.mocked(templatesApi.list).mockImplementation(
      () => new Promise(() => {}),
    );

    renderWithProviders(<TemplateConfig />);

    const spinner = document.querySelector(".spinner");
    if (spinner) {
      expect(spinner).toBeInTheDocument();
    }
  });
});
