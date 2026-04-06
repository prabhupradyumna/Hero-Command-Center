"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Pagination from "@/components/common/Pagination";
import { useAuth } from "@/context/AuthContext";
import { CreateHeroRequest, Hero, heroService } from "@/services/api.service";
import { downloadCsv } from "@/utils/csv";
import React, { useCallback, useEffect, useMemo, useState } from "react";

interface HeroFilters {
  search: string;
  squad: string;
  active: string;
  minClearance: string;
}

const initialFilters: HeroFilters = {
  search: "",
  squad: "",
  active: "",
  minClearance: "",
};

export default function HeroesPage() {
  const { user } = useAuth();
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState<HeroFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newHero, setNewHero] = useState<CreateHeroRequest>({
    name: "",
    power: "",
    city: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const canManageHeroes = user?.role === "admin" || user?.role === "Commander";

  const squadOptions = useMemo(() => {
    return Array.from(new Set(heroes.map((hero) => hero.squad).filter(Boolean) as string[]));
  }, [heroes]);

  const fetchHeroes = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await heroService.getAllHeroes(page, limit, {
        search: filters.search,
        squad: filters.squad,
        active: filters.active,
        minClearance: filters.minClearance,
      });
      setHeroes(response.data);
      setTotalPages(response.pages || 1);
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to load hero roster";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters.active, filters.minClearance, filters.search, filters.squad, limit, page]);

  useEffect(() => {
    fetchHeroes();
  }, [fetchHeroes]);

  const applyFilters = () => {
    setPage(1);
    fetchHeroes();
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setPage(1);
    setTimeout(fetchHeroes, 0);
  };

  const handleCreateHero = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!newHero.name.trim() || !newHero.power.trim() || !newHero.city.trim()) {
      setFormError("Name, power, and city are required");
      return;
    }

    setCreating(true);
    try {
      await heroService.createHero({
        name: newHero.name.trim(),
        power: newHero.power.trim(),
        city: newHero.city.trim(),
      });
      setNewHero({ name: "", power: "", city: "" });
      fetchHeroes();
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to recruit hero";
      setFormError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleRetireHero = async (heroId: number) => {
    if (!confirm("Retire this hero?")) return;

    try {
      await heroService.deleteHero(heroId);
      fetchHeroes();
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to retire hero";
      setError(message);
    }
  };

  const handleExportCsv = () => {
    const rows = heroes.map((hero) => ({
      id: hero.id,
      name: hero.name,
      power: hero.power,
      city: hero.city,
      squad: hero.squad || "Unassigned",
      clearanceLevel: hero.clearanceLevel || 1,
      status: hero.isActive ? "Active" : "Inactive",
      createdAt: new Date(hero.createdAt).toLocaleDateString(),
    }));

    downloadCsv("heroes-export.csv", rows);
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Hero Roster" />

      <ComponentCard title="Roster Filters" desc="Search and segment active heroes.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search by name"
            className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:text-white"
          />
          <select
            value={filters.squad}
            onChange={(event) => setFilters((prev) => ({ ...prev, squad: event.target.value }))}
            className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="">All squads</option>
            {squadOptions.map((squad) => (
              <option key={squad} value={squad}>
                {squad}
              </option>
            ))}
          </select>
          <select
            value={filters.active}
            onChange={(event) => setFilters((prev) => ({ ...prev, active: event.target.value }))}
            className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="">All activity states</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <select
            value={filters.minClearance}
            onChange={(event) => setFilters((prev) => ({ ...prev, minClearance: event.target.value }))}
            className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="">Any clearance</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
            <option value="5">5+</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={applyFilters}
            className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 dark:border-gray-700 dark:text-gray-200"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={!heroes.length}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
          >
            Export CSV
          </button>
        </div>
      </ComponentCard>

      {canManageHeroes && (
        <ComponentCard title="Recruit New Hero" desc="Validation mirrors backend requirements.">
          <form onSubmit={handleCreateHero} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <input
              value={newHero.name}
              onChange={(event) => setNewHero((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Hero name"
              className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:text-white"
            />
            <input
              value={newHero.power}
              onChange={(event) => setNewHero((prev) => ({ ...prev, power: event.target.value }))}
              placeholder="Primary power"
              className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:text-white"
            />
            <input
              value={newHero.city}
              onChange={(event) => setNewHero((prev) => ({ ...prev, city: event.target.value }))}
              placeholder="Assigned city"
              className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:text-white"
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {creating ? "Recruiting..." : "Recruit Hero"}
            </button>
          </form>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
        </ComponentCard>
      )}

      <ComponentCard title="Hero Operations Board" desc="Live roster with pagination and role-aware actions.">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading heroes...</p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Power</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">City</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Squad</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Clearance</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {heroes.map((hero) => (
                    <tr key={hero.id} className="border-b border-gray-100 text-sm dark:border-gray-800">
                      <td className="px-3 py-3 text-gray-900 dark:text-white">{hero.name}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{hero.power}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{hero.city}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{hero.squad || "Unassigned"}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{hero.clearanceLevel || 1}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${hero.isActive ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-700"}`}>
                          {hero.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {user?.role === "admin" ? (
                          <button
                            type="button"
                            onClick={() => handleRetireHero(hero.id)}
                            className="rounded-md bg-red-500 px-3 py-1 text-xs font-medium text-white hover:bg-red-600"
                          >
                            Retire
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">Admin only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!heroes.length && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No heroes found for this filter set.</p>
            )}

            <Pagination page={page} pages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
