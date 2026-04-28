import { useDeferredValue, useState } from "react";
import { Link } from "react-router-dom";
import BandBadge from "../components/BandBadge";
import ConnectionStatusBadge from "../components/ConnectionStatusBadge";
import EmptyState from "../components/EmptyState";
import LoadingState from "../components/LoadingState";
import Panel from "../components/Panel";
import SectionHeader from "../components/SectionHeader";
import { useApi } from "../hooks/useApi";
import { LeadListItem } from "../types/api";
import { formatPercent, formatScore } from "../utils/format";

function buildPath(search: string, band: string, status: string) {
  const params = new URLSearchParams();
  if (search) {
    params.set("q", search);
  }
  if (band) {
    params.set("score_band", band);
  }
  if (status) {
    params.set("status", status);
  }
  return `/leads${params.toString() ? `?${params.toString()}` : ""}`;
}

export default function LeadWorkbenchPage() {
  const [search, setSearch] = useState("");
  const [band, setBand] = useState("");
  const [status, setStatus] = useState("");
  const deferredSearch = useDeferredValue(search);
  const { data, loading, error, isFallback } = useApi<LeadListItem[]>(
    buildPath(deferredSearch, band, status)
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Lead Intelligence Workbench"
        title="Search and route active opportunities"
        description="Use the workbench to inspect lead quality, review recommended actions, and drill into the full multimodal decision trace."
        badge={isFallback ? <ConnectionStatusBadge mode="fallback" /> : null}
      />

      <Panel>
        <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, company, or industry"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0"
          />
          <select
            value={band}
            onChange={(event) => setBand(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <option value="">All score bands</option>
            <option value="S">S band</option>
            <option value="A">A band</option>
            <option value="B">B band</option>
            <option value="C">C band</option>
            <option value="D">D band</option>
          </select>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm"
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="closed_won">Closed won</option>
            <option value="closed_lost">Closed lost</option>
          </select>
        </div>
      </Panel>

      {loading && !data ? (
        <LoadingState label="Loading scored leads..." />
      ) : !data ? (
        <EmptyState
          title="Lead workbench unavailable"
          description={error ?? "Lead list data is temporarily unavailable."}
        />
      ) : !data?.length ? (
        <EmptyState
          title="No leads match the current filters"
          description="Try widening the search or resetting the band and status filters."
        />
      ) : (
        <Panel className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-5 py-4">Lead</th>
                  <th className="px-5 py-4">Industry</th>
                  <th className="px-5 py-4">Band</th>
                  <th className="px-5 py-4">Score</th>
                  <th className="px-5 py-4">Action</th>
                  <th className="px-5 py-4">Confidence</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.map((lead) => (
                  <tr key={lead.id} className="text-sm text-slate-600 hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <Link to={`/leads/${lead.id}`} className="block">
                        <div className="font-semibold text-slate-950">{lead.company_name}</div>
                        <div className="mt-1 text-slate-500">{lead.full_name}</div>
                      </Link>
                    </td>
                    <td className="px-5 py-4">{lead.industry}</td>
                    <td className="px-5 py-4">
                      <BandBadge band={lead.latest_score_band} />
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-950">
                      {formatScore(lead.latest_multimodal_score)}
                    </td>
                    <td className="px-5 py-4">{lead.latest_action ?? "Unscored"}</td>
                    <td className="px-5 py-4">{formatPercent(lead.latest_confidence)}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                        {lead.current_status.replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
