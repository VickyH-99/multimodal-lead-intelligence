import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./layout/AppShell";
import AgentOrchestrationPage from "./pages/AgentOrchestrationPage";
import DashboardPage from "./pages/DashboardPage";
import FeedbackLearningPage from "./pages/FeedbackLearningPage";
import LeadDetailPage from "./pages/LeadDetailPage";
import LeadWorkbenchPage from "./pages/LeadWorkbenchPage";
import StrategySimulationPage from "./pages/StrategySimulationPage";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/leads" element={<LeadWorkbenchPage />} />
        <Route path="/leads/:leadId" element={<LeadDetailPage />} />
        <Route path="/orchestration" element={<AgentOrchestrationPage />} />
        <Route path="/simulation" element={<StrategySimulationPage />} />
        <Route path="/feedback" element={<FeedbackLearningPage />} />
      </Route>
    </Routes>
  );
}

