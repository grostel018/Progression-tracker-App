import { Skeleton } from "@/components/ui/skeleton";

export default function ProtectedAppLoading(): JSX.Element {
  return (
    <main className="section-shell space-y-6 py-8" id="main-content">
      <Skeleton className="h-10 w-48" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 w-full rounded-[2rem]" />
        <Skeleton className="h-64 w-full rounded-[2rem]" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Skeleton className="h-52 w-full rounded-[2rem]" />
        <Skeleton className="h-52 w-full rounded-[2rem]" />
        <Skeleton className="h-52 w-full rounded-[2rem]" />
        <Skeleton className="h-52 w-full rounded-[2rem]" />
      </div>
    </main>
  );
}

