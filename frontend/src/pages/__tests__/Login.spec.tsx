import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";

const MOCK_ASYNC_DELAY_MS = 100;

vi.mock("../../api/auth", () => {
  return {
    authApi: {
      login: vi.fn(),
    },
  };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

import { Login } from "../Login";
import { AuthProvider } from "../../contexts/AuthContext";

const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  role: "ADMIN",
  tenantId: "test-tenant-id",
};

function renderWithProviders(component: React.ReactNode) {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>,
  );
}

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (localStorage.getItem as any).mockReturnValue(null);
    (localStorage.setItem as any).mockImplementation(() => {});
  });

  it("deve renderizar o formulário de login", () => {
    renderWithProviders(<Login />);

    expect(screen.getByText("Commandix")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
  });

  it("deve ter link para página de registro", () => {
    renderWithProviders(<Login />);

    expect(screen.getByText("Criar uma agora")).toBeInTheDocument();
    const link = screen.getByRole("link", { name: /criar uma agora/i });
    expect(link).toHaveAttribute("href", "/register");
  });

  it("deve validar campo de email obrigatório", async () => {
    renderWithProviders(<Login />);

    const submitBtn = screen.getByRole("button", { name: /entrar/i });
    const emailInput = screen.getByLabelText("Email") as HTMLInputElement;

    submitBtn.click();

    // HTML5 validation should prevent submission
    expect(emailInput.validity.valid).toBe(false);
  });

  it("deve fazer login com credenciais válidas", async () => {
    const { authApi } = await import("../../api/auth");
    const mockTokens = {
      accessToken: "mock-token",
      refreshToken: "mock-refresh",
      user: mockUser,
    };
    vi.mocked(authApi.login).mockResolvedValue(mockTokens);

    const user = userEvent.setup();
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Senha");
    const submitBtn = screen.getByRole("button", { name: /entrar/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(vi.mocked(authApi.login)).toHaveBeenCalledWith(
        "test@example.com",
        "password123",
      );
    });
  });

  it("deve exibir mensagem de erro com credenciais inválidas", async () => {
    const { authApi } = await import("../../api/auth");
    vi.mocked(authApi.login).mockRejectedValue({
      response: { data: { message: "Credenciais inválidas" } },
    });

    const user = userEvent.setup();
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Senha");
    const submitBtn = screen.getByRole("button", { name: /entrar/i });

    await user.type(emailInput, "wrong@example.com");
    await user.type(passwordInput, "wrongpassword");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText("Credenciais inválidas")).toBeInTheDocument();
    });
  });

  it("deve mostrar estado de loading durante login", async () => {
    const { authApi } = await import("../../api/auth");
    vi.mocked(authApi.login).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, MOCK_ASYNC_DELAY_MS)),
    );

    const user = userEvent.setup();
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Senha");
    const submitBtn = screen.getByRole("button", { name: /entrar/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "password123");
    await user.click(submitBtn);

    expect(
      screen.getByRole("button", { name: /entrando/i }),
    ).toBeInTheDocument();
  });

  it("deve tratar múltiplas mensagens de erro como array", async () => {
    const { authApi } = await import("../../api/auth");
    vi.mocked(authApi.login).mockRejectedValue({
      response: {
        data: { message: ["Email não encontrado", "Senha incorreta"] },
      },
    });

    const user = userEvent.setup();
    renderWithProviders(<Login />);

    const emailInput = screen.getByLabelText("Email");
    const passwordInput = screen.getByLabelText("Senha");
    const submitBtn = screen.getByRole("button", { name: /entrar/i });

    await user.type(emailInput, "test@example.com");
    await user.type(passwordInput, "wrongpass");
    await user.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Email não encontrado, Senha incorreta"),
      ).toBeInTheDocument();
    });
  });
});
