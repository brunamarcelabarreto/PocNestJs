import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider, useAuth } from "../AuthContext";

vi.mock("../../api/auth", () => {
  const mockAuthLogin = vi.fn();
  const mockAuthLogout = vi.fn();

  return {
    authApi: {
      login: mockAuthLogin,
      logout: mockAuthLogout,
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

const mockUser = {
  id: "test-user-id",
  email: "test@example.com",
  firstName: "Test",
  lastName: "User",
  role: "ADMIN",
  tenantId: "test-tenant-id",
};

const mockTokens = {
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  user: mockUser,
};

function TestComponent() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {user ? (
        <>
          <div data-testid="user-email">{user.email}</div>
          <div data-testid="user-role">{user.role}</div>
          <button onClick={() => logout()}>Logout</button>
        </>
      ) : (
        <>
          <div data-testid="no-user">No user</div>
          <button onClick={() => login("test@example.com", "password")}>
            Login
          </button>
        </>
      )}
    </div>
  );
}

function renderWithRouter(component: React.ReactNode) {
  return render(
    <MemoryRouter>
      <AuthProvider>{component}</AuthProvider>
    </MemoryRouter>,
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (localStorage.getItem as any).mockReturnValue(null);
    (localStorage.setItem as any).mockImplementation(() => {});
    (localStorage.removeItem as any).mockImplementation(() => {});
  });

  it("deve renderizar com usuário não autenticado", () => {
    renderWithRouter(<TestComponent />);
    expect(screen.getByTestId("no-user")).toBeInTheDocument();
  });

  it("deve fazer login com credenciais válidas", async () => {
    const { authApi } = await import("../../api/auth");
    vi.mocked(authApi.login).mockResolvedValue(mockTokens);

    renderWithRouter(<TestComponent />);

    const loginBtn = screen.getByText("Login");
    loginBtn.click();

    await waitFor(() => {
      expect(screen.getByTestId("user-email")).toHaveTextContent(
        "test@example.com",
      );
    });

    expect(localStorage.setItem).toHaveBeenCalledWith(
      "accessToken",
      "mock-access-token",
    );
    expect(localStorage.setItem).toHaveBeenCalledWith(
      "refreshToken",
      "mock-refresh-token",
    );
  });

  it("deve fazer logout e limpar localStorage", async () => {
    const { authApi } = await import("../../api/auth");
    vi.mocked(authApi.login).mockResolvedValue(mockTokens);
    vi.mocked(authApi.logout).mockResolvedValue({});

    renderWithRouter(<TestComponent />);

    const loginBtn = screen.getByText("Login");
    loginBtn.click();

    await waitFor(() => {
      expect(screen.getByTestId("user-email")).toBeInTheDocument();
    });

    const logoutBtn = screen.getByText("Logout");
    logoutBtn.click();

    await waitFor(() => {
      expect(localStorage.clear).toHaveBeenCalled();
    });
  });

  it("deve carregar usuário do localStorage se existir", async () => {
    const storedUser = JSON.stringify(mockUser);
    (localStorage.getItem as any).mockImplementation((key: string) => {
      if (key === "user") return storedUser;
      if (key === "accessToken") return "mock-access-token";
      return null;
    });

    renderWithRouter(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId("user-email")).toHaveTextContent(
        "test@example.com",
      );
    });
  });

  it("deve lançar erro se useAuth for usado fora do provider", () => {
    function ComponentWithoutProvider() {
      useAuth();
      return null;
    }

    expect(() => {
      render(<ComponentWithoutProvider />);
    }).toThrow("useAuth must be used within AuthProvider");
  });
});
