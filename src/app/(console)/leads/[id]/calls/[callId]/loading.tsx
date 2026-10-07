import { Skeleton } from "@/components/ui/misc";

export default function Loading() {
  return (
    <div className="grid gap-4 pt-10">
      <Skeleton className="h-12 w-2/5" />
      <Skeleton className="h-5 w-3/5" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
