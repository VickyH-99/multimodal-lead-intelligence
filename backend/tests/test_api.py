"""API-level verification tests for the lead intelligence platform."""

from __future__ import annotations


def test_health(client) -> None:
    """Health endpoint should expose the configured backend state."""

    response = client.get("/api/health")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ok"
    assert payload["api_prefix"] == "/api"
    assert payload["backend_url"] == "http://127.0.0.1:8000"


def test_dashboard_summary(client) -> None:
    """Executive dashboard summary should be populated from seed data."""

    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    payload = response.json()
    assert payload["total_leads_scored"] >= 10
    assert len(payload["score_distribution"]) == 5
    assert "feedback_loop_status" in payload


def test_lead_list_and_detail(client) -> None:
    """Lead list and detail endpoints should expose scored lead intelligence."""

    list_response = client.get("/api/leads")
    assert list_response.status_code == 200
    leads = list_response.json()
    assert leads

    lead_id = leads[0]["id"]
    detail_response = client.get(f"/api/leads/{lead_id}")
    assert detail_response.status_code == 200
    detail = detail_response.json()
    assert detail["profile"]["id"] == lead_id
    assert detail["decision"]["recommended_action"]
    assert detail["decision"]["agent_signals"]
    assert detail["decision"]["reasoning_trace"]
    assert detail["decision"]["feature_contributions"]
    assert detail["decision"]["governance_notes"]
    assert detail["decision"]["reasoning_trace"][0]["agent_name"] == "SupervisorAgent"


def test_score_new_lead(client) -> None:
    """A new multimodal lead should be scored through the supervisor pipeline."""

    payload = {
        "full_name": "Jordan Price",
        "company_name": "SignalPath Medical",
        "email": "jordan.price@signalpathmedical.com",
        "phone": "+1-555-111-2222",
        "title": "Director of Commercial Operations",
        "industry": "Healthcare",
        "region": "Texas",
        "source_channel": "partner referral",
        "lifecycle_stage": "evaluation",
        "current_status": "open",
        "annual_revenue_band": "$100M-$250M",
        "employee_count": 780,
        "budget_estimate": 95000,
        "engagement_score": 0.84,
        "product_fit_score": 0.9,
        "website_visits": 18,
        "email_open_rate": 0.62,
        "crm_notes": "Commercial and analytics leaders want a guided rollout this month.",
        "call_transcript": "The team is comparing options but wants to move quickly if governance checks out.",
        "speaking_speed": 146.0,
        "average_pause_duration": 0.9,
        "voice_sentiment_score": 0.38,
        "hesitation_score": 0.2,
        "historical_outcome": None,
        "behavior_events": [
            {
                "event_type": "lead_created",
                "channel": "crm",
                "notes": "Referral lead created.",
                "occurred_at": "2026-04-24T09:00:00"
            },
            {
                "event_type": "call_connected",
                "channel": "phone",
                "notes": "Qualification call completed.",
                "occurred_at": "2026-04-25T11:00:00"
            },
            {
                "event_type": "appointment_booked",
                "channel": "calendar",
                "notes": "Follow-up booked.",
                "occurred_at": "2026-04-26T15:00:00"
            }
        ],
        "metadata_json": {"segment": "enterprise"}
    }

    response = client.post("/api/leads/score", json=payload)
    assert response.status_code == 200
    result = response.json()
    assert result["lead_id"] > 0
    assert 0 <= result["base_score"] <= 1
    assert 0 <= result["multimodal_score"] <= 1
    assert result["recommended_action"]
    assert result["reasoning_trace"]
    assert result["feature_contributions"]
    assert result["governance_notes"]


def test_feedback_and_simulation(client) -> None:
    """Feedback and simulation endpoints should return learning and scenario outputs."""

    leads = client.get("/api/leads").json()
    open_lead = next(lead for lead in leads if lead["current_status"] == "open")

    feedback_response = client.post(
        f"/api/leads/{open_lead['id']}/feedback",
        json={
            "outcome": "not_converted",
            "reason": "Procurement stalled the evaluation.",
            "salesperson_feedback": "High intent but timing slipped."
        },
    )
    assert feedback_response.status_code == 200
    feedback_payload = feedback_response.json()
    assert feedback_payload["feedback"]["lead_id"] == open_lead["id"]
    assert "threshold_change_suggestions" in feedback_payload

    simulation_response = client.post(
        "/api/simulation/run",
        json={
            "thresholds": {"s": 0.87, "a": 0.74, "b": 0.56, "c": 0.41},
            "action_rules": {
                "s_band_action": "senior human call",
                "a_band_action": "normal human call",
                "b_band_action": "AI outbound call",
                "c_band_action": "delayed follow-up",
                "d_band_action": "nurture pool"
            },
            "human_capacity_limit": 15,
            "ai_call_capacity_limit": 36
        },
    )
    assert simulation_response.status_code == 200
    simulation_payload = simulation_response.json()
    assert "comparison" in simulation_payload
    assert "assumptions" in simulation_payload
    assert "why_result" in simulation_payload
    assert "recommended_next_policy" in simulation_payload
    assert "threshold_sensitivity_analysis" in simulation_payload
