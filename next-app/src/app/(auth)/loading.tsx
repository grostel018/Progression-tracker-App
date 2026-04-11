import { Skeleton } from "@/components/ui/skeleton";

export default function AuthLoading(): JSX.Element {
  return (
    <main className="section-shell flex min-h-screen items-center py-10" id="main-content">
      <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,460px)]">
        <div className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-16 w-full max-w-xl rounded-[2rem]" />
          <Skeleton className="h-6 w-full max-w-2xl" />
          <Skeleton className="h-6 w-4/5 max-w-xl" />
        </div>
        <div className="surface-panel space-y-4 p-8">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-12 w-full rounded-[1.5rem]" />
          <Skeleton className="h-12 w-full rounded-[1.5rem]" />
          <Skeleton className="h-12 w-full rounded-[1.5rem]" />
        </div>
      </div>
    </main>
  );
}

