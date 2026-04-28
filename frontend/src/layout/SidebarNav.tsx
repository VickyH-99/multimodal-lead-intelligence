import {
  BrainCircuit,
  FlaskConical,
  Gauge,
  LayoutDashboard,
  MessageSquareCode,
  UsersRound
} from "lucide-react";
import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/dashboard", label: "Executive Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Lead Workbench", icon: UsersRound },
  { to: "/orchestration", label: "Agent Orchestration", icon: BrainCircuit },
  { to: "/simulation", label: "Strategy Simulation", icon: FlaskConical },
  { to: "/feedback", label: "Feedback Learning", icon: MessageSquareCode }
];

function LinkTile({
  to,
  label,
  icon: Icon
}: {
  to: string;
  label: string;
  icon: typeof Gauge;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
          isActive
            ? "bg-slate-950 text-white shadow-lg"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
        ].join(" ")
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function SidebarNav() {
  return (
    <>
      <aside className="hidden w-[290px] shrink-0 flex-col border-r border-white/60 bg-white/70 px-5 py-6 backdrop-blur lg:flex">
        <div className="mb-8">
          <div className="eyebrow">Lead OS</div>
          <div className="mt-3 text-2xl font-semibold text-slate-950">
            Multimodal Lead Intelligence
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            A multi-agent operating system for scoring, routing, explanation, and
            feedback optimization.
          </p>
        </div>

        <div className="space-y-2">
          {navItems.map((item) => (
            <LinkTile key={item.to} {...item} />
          ))}
        </div>

        <div className="mt-auto rounded-3xl border border-slate-200 bg-slate-950 p-5 text-white">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
            SupervisorAgent
          </div>
          <div className="mt-3 text-lg font-semibold">Decision loop online</div>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Structured, text, voice, and behavior signals are fused into one live
            operating view.
          </p>
        </div>
      </aside>

      <div className="border-b border-white/70 bg-white/80 px-4 py-4 backdrop-blur lg:hidden">
        <div className="mb-3 text-lg font-semibold text-slate-950">Lead Intelligence OS</div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {navItems.map((item) => (
            <LinkTile key={item.to} {...item} />
          ))}
        </div>
      </div>
    </>
  );
}

