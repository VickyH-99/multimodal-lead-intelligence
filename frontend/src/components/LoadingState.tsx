export default function LoadingState({ label = "Loading intelligence..." }: { label?: string }) {
  return (
    <div className="panel flex min-h-[220px] items-center justify-center text-sm text-slate-500">
      {label}
    </div>
  );
}

