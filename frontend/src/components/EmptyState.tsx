export default function EmptyState({
  title,
  description
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="panel flex min-h-[220px] flex-col items-center justify-center text-center">
      <div className="text-lg font-semibold text-slate-950">{title}</div>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    </div>
  );
}

