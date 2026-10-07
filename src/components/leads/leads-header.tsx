"use client";

import { useRouter, usePathname } from "next/navigation";
import { useStore } from "@/lib/store";
import { useProjectLeads } from "@/lib/selectors";
import { useDraftList } from "@/lib/draft-list";
import { PageHeader } from "../ui/page-header";
import { Button } from "../ui/button";
import { Phone, Plus } from "../icons";
import { VIEWS } from "./views";

export function LeadsHeader() {
  const leads = useProjectLeads();
  const lists = useStore((s) => s.lists);
  const projectId = useStore((s) => s.projectId);
  const pathname = usePathname();
  const router = useRouter();
  const setDraft = useDraftList((s) => s.set);
  const onLists = pathname.startsWith("/leads/who-to-call");
  const view = VIEWS.find((v) => v.href === pathname) ?? VIEWS[0];
  const inView = leads.filter(view.match);
  const running = lists.filter((l) => l.projectId === projectId && l.status === "running").length;

  const hot = leads.filter((l) => l.stage === "hot").length;
  const status = onLists
    ? `${running} ${running === 1 ? "list is" : "lists are"} calling right now.`
    : `${leads.length} leads in this project. ${hot} hot ones need a person today.`;

  return (
    <PageHeader
      title="Leads"
      size="xl"
      status={status}
      action={
        onLists ? (
          <Button variant="primary" size="lg" icon={<Plus size={17} weight="bold" />} onClick={() => router.push("/who-to-call/new")}>
            New calling list
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            icon={<Phone size={17} weight="fill" />}
            disabled={inView.length === 0}
            onClick={() => {
              setDraft(
                inView.map((l) => l.id),
                view.label,
              );
              router.push("/who-to-call/new");
            }}
          >
            Call these
          </Button>
        )
      }
      tabs={[
        ...VIEWS.map((v) => ({ href: v.href, label: v.label, count: leads.filter(v.match).length, exact: true })),
        { href: "/leads/who-to-call", label: "Who to call" },
      ]}
    />
  );
}
