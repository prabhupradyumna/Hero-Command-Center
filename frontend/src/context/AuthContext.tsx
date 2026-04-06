"use client";

/**
 * Authentication Context
 * Manages user authentication state and provides auth functions
 * Handles token storage, refresh, and user state
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from "react";
import { authService, User, LoginRequest, SignUpRequest } from "@/services/api.service";
import apiClient from "@/services/api.client";

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (data: SignUpRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; token: string } }
  | { type: "LOGIN_ERROR"; payload: string }
  | { type: "AUTH_RESTORE"; payload: { user: User; token: string } }
  | { type: "AUTH_LOADING" }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_USER"; payload: User };

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT SETUP
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN_START":
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    case "LOGIN_SUCCESS":
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
        error: null,
      };
    case "LOGIN_ERROR":
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        user: null,
        token: null,
      };
    case "AUTH_LOADING":
      return {
        ...state,
        isLoading: true,
      };
    case "AUTH_RESTORE":
      return {
        ...state,
        isLoading: false,
        user: action.payload.user,
        token: action.payload.token,
      };
    case "LOGOUT":
      return {
        ...initialState,
      };
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH PROVIDER
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from stored token
  useEffect(() => {
    const token = apiClient.getToken();
    if (!token) return;

    dispatch({ type: "AUTH_LOADING" });
    authService
      .getCurrentUser()
      .then((response) => {
        dispatch({
          type: "AUTH_RESTORE",
          payload: { user: response.user, token },
        });
      })
      .catch(() => {
        apiClient.clearTokens();
        dispatch({ type: "LOGOUT" });
      });
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const response = await authService.login(credentials);
      apiClient.setToken(response.token);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: response.user,
          token: response.token,
        },
      });
    } catch (error) {
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: string }).message)
          : "Login failed";
      dispatch({ type: "LOGIN_ERROR", payload: errorMessage });
      throw error;
    }
  }, []);

  const signup = useCallback(async (data: SignUpRequest) => {
    dispatch({ type: "LOGIN_START" });
    try {
      const response = await authService.signup(data);
      apiClient.setToken(response.token);
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: {
          user: response.user,
          token: response.token,
        },
      });
    } catch (error) {
      const errorMessage =
        typeof error === "object" && error !== null && "message" in error
          ? String((error as { message: string }).message)
          : "Signup failed";
      dispatch({ type: "LOGIN_ERROR", payload: errorMessage });
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    authService.logout();
    dispatch({ type: "LOGOUT" });
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const value: AuthContextType = {
    user: state.user,
    token: state.token,
    isAuthenticated: !!state.token,
    isLoading: state.isLoading,
    error: state.error,
    login,
    signup,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
