import { BehaviorEvent } from "../types/api";
import { formatDate } from "../utils/format";

export default function Timeline({ events }: { events: BehaviorEvent[] }) {
  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={`${event.event_type}-${event.occurred_at}`} className="flex gap-4">
          <div className="flex w-20 shrink-0 flex-col items-center">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <div className="mt-2 h-full w-px bg-slate-200" />
          </div>
          <div className="pb-5">
            <div className="text-sm font-semibold text-slate-900">
              {event.event_type.replace(/_/g, " ")}
            </div>
            <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
              {event.channel} - {formatDate(event.occurred_at)}
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{event.notes}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
