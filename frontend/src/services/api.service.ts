/**
 * API Service Layer
 * High-level abstraction for API endpoints
 * Provides organized methods for auth, heroes, and missions
 */

import apiClient from "./api.client";

// ─────────────────────────────────────────────────────────────────────────────
// TYPE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "user" | "Commander";
  avatar?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  message: string;
  user: User;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}

export interface Hero {
  id: number;
  name: string;
  power: string;
  city: string;
  squad?: string | null;
  clearanceLevel?: number;
  isActive?: boolean;
  userId?: number;
  avatar?: string;
  createdAt: string;
  deletedAt?: string | null;
}

export interface CreateHeroRequest {
  name: string;
  power: string;
  city: string;
}

export interface Mission {
  id: number;
  title: string;
  description?: string;
  threatLevel: number;
  status: "planned" | "active" | "completed" | "failed";
  createdAt: string;
  Heroes?: Hero[];
}

export interface CreateMissionRequest {
  title: string;
  description?: string;
  threatLevel: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>("/auth/login", credentials);
  },

  async signup(data: SignUpRequest): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>("/auth/signup", data);
  },

  async getCurrentUser(): Promise<{ user: User }> {
    return apiClient.get<{ user: User }>("/auth/me");
  },

  async refresh(): Promise<LoginResponse> {
    return apiClient.post<LoginResponse>("/auth/refresh");
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
    apiClient.clearTokens();
  },

  async uploadMyAvatar(file: File): Promise<{ message: string; avatar: string; user: User }> {
    const formData = new FormData();
    formData.append("avatar", file);
    const token = apiClient.getToken();
    const headers: HeadersInit = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/auth/avatar`, {
      method: "POST",
      body: formData,
      credentials: "include",
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to upload avatar");
    }

    return response.json();
  },

  async removeMyAvatar(): Promise<{ message: string; user: User }> {
    return apiClient.delete<{ message: string; user: User }>("/auth/avatar");
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HERO SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const heroService = {
  async getAllHeroes(
    page?: number,
    limit?: number,
    filters?: Record<string, string>
  ): Promise<PaginatedResponse<Hero>> {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    
    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/heroes?${queryString}` : "/heroes";
    const response = await apiClient.get<{
      heroes: Hero[];
      totalHeroes: number;
      currentPage: number;
      totalPages: number;
    }>(endpoint);

    return {
      data: response.heroes,
      total: response.totalHeroes,
      page: response.currentPage,
      limit: limit || 10,
      pages: response.totalPages,
    };
  },

  async createHero(hero: CreateHeroRequest): Promise<Hero> {
    return apiClient.post<Hero>("/heroes", hero);
  },

  async uploadAvatar(heroId: number, file: File): Promise<{ avatar: string }> {
    const formData = new FormData();
    formData.append("avatar", file);

    return fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/heroes/${heroId}/avatar`, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: `Bearer ${apiClient.getToken()}`,
      },
    }).then((res) => res.json());
  },

  async deleteHero(heroId: number): Promise<void> {
    return apiClient.delete(`/heroes/${heroId}`);
  },

  async restoreHero(heroId: number): Promise<{ message: string }> {
    return apiClient.patch<{ message: string }>(`/heroes/${heroId}/restore`, {});
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// MISSION SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const missionService = {
  async getAllMissions(
    page?: number,
    limit?: number,
    filters?: Record<string, string>
  ): Promise<PaginatedResponse<Mission>> {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const queryString = params.toString();
    const endpoint = queryString ? `/missions?${queryString}` : "/missions";
    const response = await apiClient.get<{
      missions: Mission[];
      totalMissions: number;
      currentPage: number;
      totalPages: number;
    }>(endpoint);

    return {
      data: response.missions,
      total: response.totalMissions,
      page: response.currentPage,
      limit: limit || 5,
      pages: response.totalPages,
    };
  },

  async createMission(mission: CreateMissionRequest): Promise<Mission> {
    const response = await apiClient.post<{ mission: Mission }>("/missions", mission);
    return response.mission;
  },

  async assignHeroToMission(
    missionId: number,
    heroId: number
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/missions/${missionId}/assign`, {
      heroId,
    });
  },

  async removeHeroFromMission(
    missionId: number,
    heroId: number
  ): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`/missions/${missionId}/remove`, {
      heroId,
    });
  },

  async updateMissionStatus(
    missionId: number,
    status: "planned" | "active" | "completed" | "failed"
  ): Promise<Mission> {
    const response = await apiClient.patch<{ mission: Mission }>(`/missions/${missionId}/status`, {
      status,
    });

    return response.mission;
  },
};

const apiServices = {
  authService,
  heroService,
  missionService,
};

export default apiServices;
