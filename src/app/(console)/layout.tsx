import { CallDesk } from "@/components/shell/call-desk";
import { CommandPalette } from "@/components/shell/command-palette";
import { MobileBottomNav, MobileTopBar, Rail } from "@/components/shell/nav";
import { DemoNotice } from "@/components/shell/demo-notice";

export default function ConsoleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      <a
        href="#main"
        className="sr-only z-[100] rounded bg-accent-fill px-3 py-2 text-accent-ink focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>
      <Rail />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileTopBar />
        <DemoNotice />
        <main id="main" className="mx-auto w-full min-w-0 max-w-[1320px] flex-1 px-4 pb-44 sm:px-6 md:pb-32 lg:px-10">
          {children}
        </main>
      </div>
      <MobileBottomNav />
      <CallDesk />
      <CommandPalette />
    </div>
  );
}
