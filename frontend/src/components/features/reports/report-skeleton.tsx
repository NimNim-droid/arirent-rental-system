import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonRows } from "@/components/ui/skeleton";

export function ReportSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading financial report">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
              <div className="w-full space-y-2">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-6 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 2xl:grid-cols-3">
        <Card className="p-5 2xl:col-span-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="mt-5 h-64 w-full" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-5 h-64 w-full rounded-full" />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-5 h-64 w-full" />
        </Card>
        <Card className="p-5">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="mt-5 h-64 w-full rounded-full" />
        </Card>
      </div>

      <Card className="p-5">
        <Skeleton className="h-5 w-40" />
        <SkeletonRows rows={6} className="mt-5" />
      </Card>
    </div>
  );
}

