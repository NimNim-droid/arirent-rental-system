import { Card } from "@/components/ui/card";
import { Skeleton, SkeletonRows } from "@/components/ui/skeleton";

export function ReportSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading financial report">
      <Card className="overflow-hidden">
        <div className="grid grid-cols-1 divide-y divide-edge sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 xl:divide-x">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="p-5 space-y-2.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-28" />
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <Card className="p-5 xl:col-span-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-7 w-48 rounded-lg" />
          </div>
          <Skeleton className="mt-5 h-60 w-full" />
        </Card>
        <Card className="p-5 xl:col-span-4 space-y-5">
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-2.5 w-full rounded-full" />
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="border-t border-edge pt-4 space-y-2.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2.5 w-full rounded-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <Skeleton className="h-5 w-44" />
        <SkeletonRows rows={5} className="mt-5" />
      </Card>
    </div>
  );
}
