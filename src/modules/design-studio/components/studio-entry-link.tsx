"use client";

import Link, { useLinkStatus } from "next/link";
import type { ReactNode } from "react";

function NavigationStatus({ label }: { label: string }) {
  const { pending } = useLinkStatus();
  return (
    <span className="studio-navigation-status" role="status">
      {pending ? label : ""}
    </span>
  );
}

export function StudioEntryLink({
  href,
  loadingLabel,
  children,
}: {
  href: string;
  loadingLabel: string;
  children: ReactNode;
}) {
  return (
    <Link className="studio-cta" href={href} transitionTypes={["studio-open"]}>
      {children}
      <NavigationStatus label={loadingLabel} />
    </Link>
  );
}
