import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="full-loading">
        <div className="spinner" />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
