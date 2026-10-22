import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function WorkspaceSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.8fr)]" role="status" aria-label="Loading circle data">
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Card><CardContent className="space-y-5 pt-6"><Skeleton className="h-6 w-32" /><Skeleton className="h-24 w-full" /><Skeleton className="h-12 w-44" /></CardContent></Card>
        <Card><CardContent className="space-y-3 pt-6"><Skeleton className="h-4 w-40" /><Skeleton className="h-10 w-full" /></CardContent></Card>
      </div>
      <Card><CardContent className="space-y-4 pt-6"><Skeleton className="h-5 w-44" /><Skeleton className="h-20 w-full" /><Skeleton className="h-20 w-full" /></CardContent></Card>
    </div>
  );
}
