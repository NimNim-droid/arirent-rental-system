import { DoorOpen, Edit2, MapPin, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { SkeletonRows } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/formatters";
import type { Room } from "@/lib/types";

interface RoomTableProps {
  rooms: Room[];
  totalRoomsCount: number;
  hasProperties: boolean;
  loading: boolean;
  onOpenAddRoom: () => void;
  onClearFilters: () => void;
  onEditRoom: (room: Room) => void;
  onDeleteRoom: (room: Room) => void;
}

export function RoomTable({
  rooms,
  totalRoomsCount,
  hasProperties,
  loading,
  onOpenAddRoom,
  onClearFilters,
  onEditRoom,
  onDeleteRoom,
}: RoomTableProps) {
  return (
    <Card className="overflow-hidden">
      {loading ? (
        <div className="p-6">
          <SkeletonRows rows={5} />
        </div>
      ) : rooms.length === 0 ? (
        <div className="p-8 text-center">
          <EmptyState
            icon={<DoorOpen className="h-6 w-6" />}
            title="No units match the selected filters"
            description={
              totalRoomsCount === 0
                ? "Start by adding your first unit to an existing building."
                : "Try adjusting your search query, status filter, or building selection."
            }
            action={
              totalRoomsCount === 0 && hasProperties ? (
                <Button variant="primary" onClick={onOpenAddRoom}>
                  <Plus className="h-4 w-4" />
                  <span>Add First Unit</span>
                </Button>
              ) : (
                <Button variant="secondary" onClick={onClearFilters}>
                  Clear Filters
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit / Room</TableHead>
                <TableHead>Property Building</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Monthly Rent</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rooms.map((room) => {
                const statusVariant: "success" | "warning" | "info" =
                  room.status === "vacant"
                    ? "success"
                    : room.status === "reserved"
                    ? "warning"
                    : "info";

                const statusLabel =
                  room.status === "vacant"
                    ? "Vacant (Ready)"
                    : room.status === "reserved"
                    ? "Reserved (Pending)"
                    : "Occupied";

                return (
                  <TableRow key={room.id} className="group hover:bg-hover/40">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-inset font-bold text-xs text-fg border border-edge">
                          {room.room_number}
                        </div>
                        <div>
                          <span className="font-semibold text-fg">
                            Room {room.room_number}
                          </span>
                          <p className="text-[11px] text-muted">ID: #{room.id}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-medium text-fg">
                        {room.property?.name ?? `Property #${room.property_id}`}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="text-xs text-muted flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-faint shrink-0" />
                        {room.property?.city ?? "—"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className="font-semibold text-fg">
                        {formatCurrency(room.rent)}
                      </span>
                      <span className="text-[11px] text-muted"> / mo</span>
                    </TableCell>

                    <TableCell>
                      <Badge variant={statusVariant}>{statusLabel}</Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs font-semibold text-muted hover:text-fg"
                          onClick={() => onEditRoom(room)}
                        >
                          <Edit2 className="h-3.5 w-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs font-semibold text-muted hover:text-danger-fg"
                          disabled={room.status === "occupied"}
                          title={
                            room.status === "occupied"
                              ? "Cannot delete an occupied room"
                              : "Delete room"
                          }
                          onClick={() => onDeleteRoom(room)}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
