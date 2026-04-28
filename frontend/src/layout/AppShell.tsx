import { useEffect } from "react";
import { Bell, Search, ShieldCheck } from "lucide-react";
import { Outlet } from "react-router-dom";
import { ApiHealthResponse } from "../types/api";
import { apiGet, useBackendStatus } from "../api/client";
import ConnectionStatusBadge from "../components/ConnectionStatusBadge";
import SidebarNav from "./SidebarNav";

export default function AppShell() {
  const backendStatus = useBackendStatus();

  useEffect(() => {
    void apiGet<ApiHealthResponse>("/health").catch(() => {
      // The shared client updates status and logging; the shell only triggers the check.
    });
  }, []);

  return (
    <div className="min-h-screen bg-mesh-grid">
      <div className="flex min-h-screen">
        <SidebarNav />

        <div className="flex-1">
          <header className="sticky top-0 z-20 border-b border-white/70 bg-white/60 backdrop-blur">
            <div className="flex items-center justify-between gap-4 px-5 py-4 lg:px-8">
              <div>
                <div className="eyebrow">Production Demo</div>
                <div className="mt-1 text-xl font-semibold text-slate-950">
                  Multimodal Lead Intelligence Agent Platform
                </div>
              </div>

              <div className="flex items-center gap-3">
                <ConnectionStatusBadge mode={backendStatus.mode} />
                <div className="hidden items-center gap-3 md:flex">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                    <Search className="h-4 w-4" />
                    Portfolio-wide intelligence view
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                    <ShieldCheck className="h-4 w-4" />
                    Agents healthy
                  </div>
                  <button className="rounded-2xl border border-slate-200 bg-white p-3 text-slate-500">
                    <Bell className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 py-5 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
