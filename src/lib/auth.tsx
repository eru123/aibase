import React, { useEffect } from "react";
import type { User } from "@/types";
import axios from "axios";
import { create } from "zustand";

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setRefreshToken: (refreshToken: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;

  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<{
    status: "authenticated" | "pending" | "verification_required";
    message?: string;
    verificationId?: string;
    expiresAt?: string;
  }>;
  login: (
    identifier: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<void>;
  logout: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Configure axios defaults
axios.defaults.baseURL = API_BASE_URL;
// Allow API cookies when needed
axios.defaults.withCredentials = true;

let axiosInterceptorsConfigured =
  (globalThis as any).__JIANPMS_AXIOS_INTERCEPTOR__ || false;

let refreshPromise: Promise<string | null> | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem("token"),
  refreshToken: localStorage.getItem("refreshToken"),
  isLoading: true,

  setUser: (user) => set({ user }),

  setToken: (token) => {
    set({ token });
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      localStorage.setItem("token", token);
    } else {
      delete axios.defaults.headers.common["Authorization"];
      localStorage.removeItem("token");
    }
  },

  setRefreshToken: (refreshToken) => {
    set({ refreshToken });
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    } else {
      localStorage.removeItem("refreshToken");
    }
  },

  setIsLoading: (isLoading) => set({ isLoading }),

  logout: () => {
    set({ user: null, token: null, refreshToken: null });
    delete axios.defaults.headers.common["Authorization"];
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
  },

  register: async (username, email, password) => {
    try {
      const response = await axios.post("/api/auth/register", {
        username,
        email,
        password,
      });

      const payload = response.data?.data ?? response.data ?? {};
      if (payload.status === "verification_required") {
        return {
          status: "verification_required" as const,
          message: payload.message,
          verificationId: payload.verification_id,
          expiresAt: payload.expires_at,
        };
      }

      if (
        response.data.success !== false &&
        (response.data.user || response.data.data?.user)
      ) {
        const userData = response.data.user || response.data.data.user;
        const tokenFromTopLevel = response.data.token;
        const tokenFromNested = response.data.data?.token;
        const tokensTopLevel = response.data.tokens;
        const tokensNested = response.data.data?.tokens;
        const accessTokenTop = tokensTopLevel?.accessToken;
        const accessTokenNested = tokensNested?.accessToken;

        const resolvedToken =
          tokenFromTopLevel ||
          tokenFromNested ||
          accessTokenTop ||
          accessTokenNested;
        const refreshTokenTop =
          tokensTopLevel?.refreshToken ||
          response.data.refreshToken ||
          response.data.refresh_token;
        const refreshTokenNested =
          tokensNested?.refreshToken ||
          response.data.data?.refreshToken ||
          response.data.data?.refresh_token;
        const resolvedRefreshToken = refreshTokenTop || refreshTokenNested;

        if (resolvedToken && resolvedRefreshToken) {
          get().setUser(userData);
          get().setToken(resolvedToken);
          get().setRefreshToken(resolvedRefreshToken);
          return { status: "authenticated" };
        }

        return {
          status: "pending",
          message: response.data.message || response.data.data?.message,
        };
      } else {
        throw new Error(
          response.data.message || response.data.error || "Registration failed",
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        (typeof error.response?.data?.error === "string"
          ? error.response?.data?.error
          : null) ||
        error.message ||
        "Registration failed";
      throw new Error(errorMessage);
    }
  },

  login: async (identifier, password, rememberMe = false) => {
    try {
      const response = await axios.post("/api/auth/login", {
        identifier,
        password,
        remember_me: rememberMe,
      });

      if (
        response.data.success !== false &&
        (response.data.user || response.data.data?.user)
      ) {
        const userData = response.data.user || response.data.data.user;
        const tokenFromTopLevel = response.data.token;
        const tokenFromNested = response.data.data?.token;
        const tokensTopLevel = response.data.tokens;
        const tokensNested = response.data.data?.tokens;
        const accessTokenTop = tokensTopLevel?.accessToken;
        const accessTokenNested = tokensNested?.accessToken;

        const resolvedToken =
          tokenFromTopLevel ||
          tokenFromNested ||
          accessTokenTop ||
          accessTokenNested;
        const refreshTokenTop =
          tokensTopLevel?.refreshToken ||
          response.data.refreshToken ||
          response.data.refresh_token;
        const refreshTokenNested =
          tokensNested?.refreshToken ||
          response.data.data?.refreshToken ||
          response.data.data?.refresh_token;
        const resolvedRefreshToken = refreshTokenTop || refreshTokenNested;

        if (!resolvedToken) {
          throw new Error(
            "Login succeeded but token was not provided by the server",
          );
        }

        if (!resolvedRefreshToken) {
          throw new Error(
            "Login succeeded but refresh token was not provided by the server",
          );
        }

        get().setUser(userData);
        get().setToken(resolvedToken);
        get().setRefreshToken(resolvedRefreshToken);
      } else {
        throw new Error(
          response.data.message || response.data.error || "Login failed",
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        (typeof error.response?.data?.error === "string"
          ? error.response?.data?.error
          : null) ||
        error.message ||
        "Login failed";
      throw new Error(errorMessage);
    }
  },
}));

// Attempt to refresh access token using stored refresh token
const refreshAccessToken = async (): Promise<string | null> => {
  const store = useAuthStore.getState();
  const currentRefreshToken = store.refreshToken;

  if (!currentRefreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const response = await axios.post("/api/auth/refresh", {
          refreshToken: currentRefreshToken,
        });

        const tokensPayload =
          response.data?.tokens || response.data?.data?.tokens;
        const newAccessToken =
          tokensPayload?.accessToken ??
          response.data?.accessToken ??
          response.data?.access_token;
        const newRefreshToken =
          tokensPayload?.refreshToken ??
          response.data?.refreshToken ??
          response.data?.refresh_token;

        if (!newAccessToken || !newRefreshToken) {
          throw new Error("Malformed refresh response");
        }

        store.setToken(newAccessToken);
        store.setRefreshToken(newRefreshToken);

        return newAccessToken;
      } catch (error) {
        console.error("Token refresh failed:", error);
        store.logout();
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
};

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.user !== null);

  useEffect(() => {
    // Only configure interceptors once
    if (!axiosInterceptorsConfigured) {
      axios.interceptors.request.use((config) => {
        const t = localStorage.getItem("token");
        if (t) {
          if (!config.headers) {
            config.headers = {} as any;
          }
          if (!("Authorization" in config.headers)) {
            (config.headers as any)["Authorization"] = `Bearer ${t}`;
          }
        }
        return config;
      });

      axios.interceptors.response.use(
        (response) => response,
        async (error) => {
          const status = error?.response?.status;
          const originalRequest = error?.config || {};
          if (status === 401) {
            const requestUrl: string = originalRequest?.url || "";
            const bypassEndpoints = [
              "/api/auth/login",
              "/api/auth/register",
              "/api/auth/guest-auth",
              "/api/auth/refresh",
            ];
            const shouldBypass = bypassEndpoints.some((endpoint) =>
              requestUrl.includes(endpoint),
            );

            if (!shouldBypass && !originalRequest._retry) {
              originalRequest._retry = true;
              const newToken = await refreshAccessToken();

              if (newToken) {
                originalRequest.headers = {
                  ...(originalRequest.headers || {}),
                  Authorization: `Bearer ${newToken}`,
                };
                return axios(originalRequest);
              }

              if (
                typeof window !== "undefined" &&
                !window.location.pathname.startsWith("/login")
              ) {
                window.location.href = "/login?sessionExpired=1";
              }
            }
          }

          return Promise.reject(error);
        },
      );
      (globalThis as any).__JIANPMS_AXIOS_INTERCEPTOR__ = true;
    }
  }, []);

  // Check if user is authenticated on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      const store = useAuthStore.getState();
      const storedToken = localStorage.getItem("token");

      if (storedToken) {
        try {
          console.log(
            "Checking auth with token:",
            storedToken.substring(0, 20) + "...",
          );
          // Synchronize token state since it defaults from localStorage
          store.setToken(storedToken);

          const response = await axios.get("/api/auth/me", {
            headers: { Authorization: `Bearer ${storedToken}` },
          });
          console.log("Auth response:", response.data);

          if (
            response.data &&
            response.data.success &&
            response.data.data &&
            response.data.data.id
          ) {
            console.log("Setting user:", response.data.data);
            store.setUser(response.data.data);

            const storedRefreshToken = localStorage.getItem("refreshToken");
            if (storedRefreshToken) {
              store.setRefreshToken(storedRefreshToken);
            }
          } else {
            console.log("No valid user data in response, logging out");
            store.logout();
          }
        } catch (error: any) {
          console.error(
            "Auth check failed:",
            error.response?.data || error.message,
          );
          store.logout();
        }
      } else {
        console.log("No stored token found");
        store.logout();
      }
      store.setIsLoading(false);
    };

    checkAuthStatus();
  }, []); // Run once on mount

  return <>{children}</>;
}

// Keep the same useAuth hook signature for compatibility
export function useAuth() {
  return useAuthStore();
}

// Protected Route HOC
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return <>{children}</>;
}
