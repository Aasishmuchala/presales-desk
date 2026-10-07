import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4">
      <div className="max-w-md">
        <p className="display text-[56px] text-fg">Not here</p>
        <p className="mt-3 text-[15px] text-fg-2">This page doesn&apos;t exist. The link may be old, or the lead or document was removed.</p>
        <Link href="/today" className="mt-6 inline-block text-sm font-medium text-accent hover:underline">
          Go to Today
        </Link>
      </div>
    </div>
  );
}
