import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-abyss-900 px-6">
      <Skeleton className="size-14 rounded-full" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-32" />
    </main>
  );
}
