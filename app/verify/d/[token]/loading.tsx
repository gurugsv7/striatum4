import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-abyss-900 px-6">
      <Skeleton className="size-10 rounded-full" />
      <Skeleton className="h-40 w-full max-w-[380px] rounded-lg" />
    </main>
  );
}
