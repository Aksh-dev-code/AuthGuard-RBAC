import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("authUser")) || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  const persistSession = useCallback((token, nextUser) => {
    if (token) localStorage.setItem("accessToken", token);
    if (nextUser) localStorage.setItem("authUser", JSON.stringify(nextUser));
    setUser(nextUser);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("authUser");
    setUser(null);
  }, []);

  // Revalidate the session on load (in case the stored user is stale/expired)
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await api.get("/auth/me");
        const freshUser = response.data.user || response.data.data?.user;
        if (!cancelled && freshUser) {
          localStorage.setItem("authUser", JSON.stringify(freshUser));
          setUser(freshUser);
        }
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [clearSession]);

  /*
   * Login
   */
  async function login(email, password) {
    const response = await api.post("/auth/login", { email, password });
    const data = response.data;

    const token = data.token || data.accessToken || data.data?.token;
    const loggedInUser = data.user || data.data?.user;

    if (!token) {
      throw new Error("Login succeeded but no token was returned.");
    }

    persistSession(token, loggedInUser);
    return data;
  }

  /*
   * Register
   */
  async function register(name, email, password) {
    const response = await api.post("/auth/register", { name, email, password });
    const data = response.data;

    const token = data.token || data.accessToken || data.data?.token;
    const registeredUser = data.user || data.data?.user;

    if (!token) {
      throw new Error("Registration succeeded but no token was returned.");
    }

    persistSession(token, registeredUser);
    return data;
  }

  /*
   * Logout
   */
  function logout() {
    clearSession();
  }

  const hasRole = useCallback((roleName) => !!user?.roles?.includes(roleName), [user]);

  const hasPermission = useCallback(
    (permissionName) =>
      !!user?.roles?.includes("admin") || !!user?.permissions?.includes(permissionName),
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      isAdmin: !!user?.roles?.includes("admin"),
      login,
      register,
      logout,
      hasRole,
      hasPermission,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, hasRole, hasPermission]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- hook colocated with its provider by design
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}