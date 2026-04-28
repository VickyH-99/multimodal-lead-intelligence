import { ReactNode } from "react";

export default function SectionHeader({
  eyebrow,
  title,
  description,
  badge
}: {
  eyebrow: string;
  title: string;
  description?: string;
  badge?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <div className="mt-2 text-2xl font-semibold text-slate-950">{title}</div>
        {description ? (
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>
        ) : null}
      </div>
      {badge ? <div className="shrink-0">{badge}</div> : null}
    </div>
  );
}
