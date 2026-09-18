import { Building, DoorOpen, Percent, CheckCircle2 } from "lucide-react";
import { StatsCard } from "@/components/common/stats-card";
import { SkeletonCards } from "@/components/ui/skeleton";

interface PropertyStatsProps {
  loading: boolean;
  stats: {
    totalProps: number;
    totalRooms: number;
    occupancyRate: number;
    vacantRooms: number;
  };
}

export function PropertyStats({ loading, stats }: PropertyStatsProps) {
  if (loading) {
    return <SkeletonCards cards={4} />;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
      <StatsCard
        title="Total Properties"
        value={stats.totalProps}
        icon={<Building className="h-5 w-5 text-accent" />}
      />
      <StatsCard
        title="Total Units / Rooms"
        value={stats.totalRooms}
        icon={<DoorOpen className="h-5 w-5 text-accent" />}
      />
      <StatsCard
        title="Occupancy Rate"
        value={`${stats.occupancyRate}%`}
        icon={<Percent className="h-5 w-5 text-success-fg" />}
      />
      <StatsCard
        title="Vacant Units"
        value={stats.vacantRooms}
        icon={<CheckCircle2 className="h-5 w-5 text-warning-fg" />}
      />
    </div>
  );
}
