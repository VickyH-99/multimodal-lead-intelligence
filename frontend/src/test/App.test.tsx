import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import DashboardPage from "../pages/DashboardPage";
import LeadWorkbenchPage from "../pages/LeadWorkbenchPage";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("frontend pages", () => {
  it("renders the executive dashboard with fetched metrics", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          total_leads_scored: 14,
          open_leads: 6,
          converted_leads: 6,
          score_distribution: [
            { band: "S", count: 2, conversion_rate: 1 },
            { band: "A", count: 4, conversion_rate: 0.75 },
            { band: "B", count: 4, conversion_rate: 0.5 },
            { band: "C", count: 2, conversion_rate: 0.25 },
            { band: "D", count: 2, conversion_rate: 0 }
          ],
          action_breakdown: [
            { action: "senior human call", count: 2, avg_conversion_rate: 1 },
            { action: "normal human call", count: 4, avg_conversion_rate: 0.75 }
          ],
          confidence_summary: {
            average_confidence: 0.84,
            high_confidence_share: 0.5,
            low_confidence_share: 0.1
          },
          feedback_loop_status: {
            total_feedback_records: 8,
            high_score_non_converted: 1,
            low_score_converted: 1,
            drift_warnings: [],
            threshold_change_suggestions: []
          }
        })
      })
    );

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText(/Lead portfolio performance at a glance/i)).toBeInTheDocument();
    });

    expect(screen.getByText("14")).toBeInTheDocument();
    expect(screen.getByText(/Recommended action mix/i)).toBeInTheDocument();
  });

  it("renders lead workbench rows from the API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            id: 1,
            full_name: "Maya Patel",
            company_name: "Northbridge Health",
            industry: "Healthcare",
            source_channel: "partner referral",
            current_status: "open",
            historical_outcome: null,
            latest_score_band: "S",
            latest_multimodal_score: 0.91,
            latest_action: "senior human call",
            latest_confidence: 0.92,
            created_at: "2026-04-20T09:00:00",
            updated_at: "2026-04-20T09:00:00"
          }
        ]
      })
    );

    render(
      <MemoryRouter>
        <LeadWorkbenchPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Northbridge Health")).toBeInTheDocument();
    });

    expect(screen.getByText(/senior human call/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search name, company, or industry/i)).toBeInTheDocument();
  });
});
