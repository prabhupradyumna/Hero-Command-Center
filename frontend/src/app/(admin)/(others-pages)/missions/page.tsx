"use client";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Pagination from "@/components/common/Pagination";
import { useAuth } from "@/context/AuthContext";
import { CreateMissionRequest, Hero, Mission, heroService, missionService } from "@/services/api.service";
import { downloadCsv } from "@/utils/csv";
import React, { useCallback, useEffect, useMemo, useState } from "react";

interface MissionFilters {
  search: string;
  status: string;
}

const initialFilters: MissionFilters = {
  search: "",
  status: "",
};

const statusOptions: Array<Mission["status"]> = ["planned", "active", "completed", "failed"];

export default function MissionsPage() {
  const { user } = useAuth();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState<MissionFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newMission, setNewMission] = useState<CreateMissionRequest>({
    title: "",
    description: "",
    threatLevel: 1,
  });
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Record<number, string>>({});

  const canManageMissions = user?.role === "admin" || user?.role === "Commander";

  const metrics = useMemo(() => {
    const total = missions.length;
    const planned = missions.filter((mission) => mission.status === "planned").length;
    const active = missions.filter((mission) => mission.status === "active").length;
    const completed = missions.filter((mission) => mission.status === "completed").length;
    const failed = missions.filter((mission) => mission.status === "failed").length;
    return { total, planned, active, completed, failed };
  }, [missions]);

  const fetchMissions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await missionService.getAllMissions(page, 5, {
        search: filters.search,
        status: filters.status,
      });
      setMissions(response.data);
      setTotalPages(response.pages || 1);
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to load missions";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.status, page]);

  const fetchHeroesForAssignment = async () => {
    try {
      const response = await heroService.getAllHeroes(1, 100, { active: "true" });
      setHeroes(response.data);
    } catch {
      setHeroes([]);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  useEffect(() => {
    fetchHeroesForAssignment();
  }, []);

  const applyFilters = () => {
    setPage(1);
    fetchMissions();
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setPage(1);
    setTimeout(fetchMissions, 0);
  };

  const handleCreateMission = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!newMission.title.trim()) {
      setFormError("Title is required");
      return;
    }

    if (newMission.threatLevel < 1 || newMission.threatLevel > 5) {
      setFormError("Threat level must be between 1 and 5");
      return;
    }

    setCreating(true);
    try {
      await missionService.createMission({
        title: newMission.title.trim(),
        description: newMission.description?.trim() || "",
        threatLevel: newMission.threatLevel,
      });
      setNewMission({ title: "", description: "", threatLevel: 1 });
      fetchMissions();
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to create mission";
      setFormError(message);
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateStatus = async (missionId: number, status: Mission["status"]) => {
    try {
      await missionService.updateMissionStatus(missionId, status);
      fetchMissions();
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to update mission status";
      setError(message);
    }
  };

  const handleAssignHero = async (missionId: number) => {
    const heroId = Number(assignments[missionId]);
    if (!heroId) return;

    try {
      await missionService.assignHeroToMission(missionId, heroId);
      fetchMissions();
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: string }).message)
          : "Failed to assign hero";
      setError(message);
    }
  };

  const handleExportCsv = () => {
    const rows = missions.map((mission) => ({
      id: mission.id,
      title: mission.title,
      description: mission.description || "",
      threatLevel: mission.threatLevel,
      status: mission.status,
      assignedHeroes: mission.Heroes?.length || 0,
      createdAt: new Date(mission.createdAt).toLocaleDateString(),
    }));

    downloadCsv("missions-export.csv", rows);
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Mission Dashboard" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <ComponentCard title="Total Missions">
          <p className="text-2xl font-semibold text-gray-800 dark:text-white">{metrics.total}</p>
        </ComponentCard>
        <ComponentCard title="Planned">
          <p className="text-2xl font-semibold text-blue-600">{metrics.planned}</p>
        </ComponentCard>
        <ComponentCard title="Active">
          <p className="text-2xl font-semibold text-amber-500">{metrics.active}</p>
        </ComponentCard>
        <ComponentCard title="Completed">
          <p className="text-2xl font-semibold text-emerald-600">{metrics.completed}</p>
        </ComponentCard>
        <ComponentCard title="Failed">
          <p className="text-2xl font-semibold text-red-600">{metrics.failed}</p>
        </ComponentCard>
      </div>

      <ComponentCard title="Mission Filters">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <input
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
            placeholder="Search mission title"
            className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:text-white"
          />
          <select
            value={filters.status}
            onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
            className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:text-white"
          >
            <option value="">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={applyFilters}
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600"
            >
              Apply
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
              disabled={!missions.length}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
            >
              Export CSV
            </button>
          </div>
        </div>
      </ComponentCard>

      {canManageMissions && (
        <ComponentCard title="Create Mission" desc="Validation follows backend threat-level rules (1-5).">
          <form onSubmit={handleCreateMission} className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <input
              value={newMission.title}
              onChange={(event) => setNewMission((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Mission title"
              className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:text-white"
            />
            <input
              value={newMission.description}
              onChange={(event) => setNewMission((prev) => ({ ...prev, description: event.target.value }))}
              placeholder="Mission description"
              className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:text-white"
            />
            <input
              type="number"
              min={1}
              max={5}
              value={newMission.threatLevel}
              onChange={(event) => setNewMission((prev) => ({ ...prev, threatLevel: Number(event.target.value) || 1 }))}
              className="h-11 rounded-lg border border-gray-200 bg-transparent px-4 text-sm text-gray-800 dark:border-gray-700 dark:text-white"
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
            >
              {creating ? "Creating..." : "Create Mission"}
            </button>
          </form>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
        </ComponentCard>
      )}

      <ComponentCard title="Mission Control Board" desc="Track statuses, assignment load, and operational outcomes.">
        {error && <p className="text-sm text-red-500">{error}</p>}
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading missions...</p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Title</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Threat</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Assigned Heroes</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Created</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {missions.map((mission) => (
                    <tr key={mission.id} className="border-b border-gray-100 text-sm dark:border-gray-800">
                      <td className="px-3 py-3 text-gray-900 dark:text-white">{mission.title}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{mission.threatLevel}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{mission.status}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{mission.Heroes?.length || 0}</td>
                      <td className="px-3 py-3 text-gray-600 dark:text-gray-300">{new Date(mission.createdAt).toLocaleDateString()}</td>
                      <td className="px-3 py-3">
                        {canManageMissions ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={mission.status}
                              onChange={(event) => handleUpdateStatus(mission.id, event.target.value as Mission["status"])}
                              className="h-8 rounded-md border border-gray-200 bg-transparent px-2 text-xs dark:border-gray-700"
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            <select
                              value={assignments[mission.id] || ""}
                              onChange={(event) => setAssignments((prev) => ({ ...prev, [mission.id]: event.target.value }))}
                              className="h-8 rounded-md border border-gray-200 bg-transparent px-2 text-xs dark:border-gray-700"
                            >
                              <option value="">Select hero</option>
                              {heroes.map((hero) => (
                                <option key={hero.id} value={hero.id}>
                                  {hero.name}
                                </option>
                              ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => handleAssignHero(mission.id)}
                              className="rounded-md bg-brand-500 px-2 py-1 text-xs font-medium text-white"
                            >
                              Assign
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Commander/Admin only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!missions.length && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No missions found for this filter set.</p>
            )}

            <Pagination page={page} pages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </ComponentCard>
    </div>
  );
}
