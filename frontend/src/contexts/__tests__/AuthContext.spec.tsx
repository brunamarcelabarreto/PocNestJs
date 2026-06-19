import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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

// Component for testing the hook
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

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (localStorage.getItem as any).mockReturnValue(null);
    (localStorage.setItem as any).mockImplementation(() => {});
    (localStorage.removeItem as any).mockImplementation(() => {});
  });

  it("deve renderizar com usuário não autenticado", () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    expect(screen.getByTestId("no-user")).toBeInTheDocument();
  });

  it("deve fazer login com credenciais válidas", async () => {
    const { authApi } = await import("../../api/auth");
    vi.mocked(authApi.login).mockResolvedValue(mockTokens);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

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

    const { rerender } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

    // Login first
    const loginBtn = screen.getByText("Login");
    loginBtn.click();

    await waitFor(() => {
      expect(screen.getByTestId("user-email")).toBeInTheDocument();
    });

    // Logout
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

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>,
    );

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
