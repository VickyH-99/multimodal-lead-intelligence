import { PropsWithChildren } from "react";

export default function Panel({
  children,
  className = ""
}: PropsWithChildren<{ className?: string }>) {
  return <section className={`panel p-5 ${className}`}>{children}</section>;
}

