/**
 * API Client Abstraction Layer
 * Handles all HTTP communication with the backend
 * Manages token refresh, error handling, and request/response intercepting
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
const TOKEN_KEY = "auth_token";

export interface ApiErrorResponse {
  message: string;
  details?: Record<string, string>;
  status?: number;
}

export class ApiClient {
  private static instance: ApiClient;
  private baseUrl: string;
  private tokenRefreshPromise: Promise<string> | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Get token from localStorage
   */
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Set token in localStorage
   */
  setToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  /**
   * Clear all auth tokens
   */
  clearTokens(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY);
    }
  }

  /**
   * Generic HTTP request method with token refresh capability
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount: number = 0
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (options.headers) {
      const normalized = new Headers(options.headers);
      normalized.forEach((value, key) => {
        headers[key] = value;
      });
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
      credentials: "include",
    };

    try {
      const response = await fetch(url, config);

      // Handle 401 Unauthorized - try to refresh token
      if (response.status === 401 && retryCount === 0 && this.getToken()) {
        // Wait for token refresh to complete
        await this.refreshAccessToken();
        // Retry the original request with new token
        return this.request<T>(endpoint, options, retryCount + 1);
      }

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiErrorResponse = {
          message: errorData.message || response.statusText,
          details: errorData.details,
          status: response.status,
        };
        throw error;
      }

      // Handle empty responses (204 No Content, 304 Not Modified)
      if (response.status === 204 || response.status === 304) {
        return {} as T;
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (typeof error === "object" && error !== null && "status" in error) {
        throw error;
      }
      throw {
        message: error instanceof Error ? error.message : "Network request failed",
        status: 0,
      } as ApiErrorResponse;
    }
  }

  /**
   * Refresh access token
   */
  private async refreshAccessToken(): Promise<string> {
    // If already refreshing, wait for the existing promise
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = this.performTokenRefresh();

    try {
      const newToken = await this.tokenRefreshPromise;
      this.tokenRefreshPromise = null;
      return newToken;
    } catch (error) {
      this.tokenRefreshPromise = null;
      this.clearTokens();
      throw error;
    }
  }

  /**
   * Perform the actual token refresh request
   */
  private async performTokenRefresh(): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Token refresh failed");
      }

      const data = await response.json();
      if (!data?.token) {
        throw new Error("No token received during refresh");
      }

      this.setToken(data.token);
      return data.token as string;
    } catch {
      this.clearTokens();
      throw new Error("Token refresh failed");
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }
}

export default ApiClient.getInstance();
