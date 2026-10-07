"use client";

import type { ReactNode } from "react";
import { PageHeader } from "../ui/page-header";

export function SetupHeader({ status, action }: { status: ReactNode; action?: ReactNode }) {
  return (
    <PageHeader
      title="Setup"
      size="xl"
      status={status}
      action={action}
      tabs={[
        { href: "/setup", label: "Connections", exact: true },
        { href: "/setup/agent", label: "How the agent talks" },
        { href: "/setup/team", label: "Team" },
        { href: "/setup/rules", label: "Rules" },
        { href: "/setup/numbers", label: "Phone numbers" },
      ]}
    />
  );
}
