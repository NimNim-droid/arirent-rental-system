import { Plus, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import {
  useProperties,
  PropertyStats,
  PropertyGrid,
  RoomFilters,
  RoomTable,
  PropertyFormModal,
  RoomFormModal,
  DeleteConfirmModal,
} from "@/components/features/property";

export default function AdminProperties() {
  const {
    properties,
    rooms,
    filteredRooms,
    loading,
    actionLoading,
    error,
    successMsg,
    stats,
    selectedPropertyFilter,
    selectedStatusFilter,
    searchQuery,
    setSelectedPropertyFilter,
    setSelectedStatusFilter,
    setSearchQuery,
    loadData,
    isAddPropertyOpen,
    setIsAddPropertyOpen,
    isEditPropertyOpen,
    setIsEditPropertyOpen,
    propertyToEdit,
    isDeletePropertyOpen,
    setIsDeletePropertyOpen,
    propertyToDelete,
    propertyForm,
    setPropertyForm,
    openAddProperty,
    handleCreateProperty,
    openEditProperty,
    handleUpdateProperty,
    openDeleteProperty,
    handleDeleteProperty,
    isAddRoomOpen,
    setIsAddRoomOpen,
    isEditRoomOpen,
    setIsEditRoomOpen,
    roomToEdit,
    isDeleteRoomOpen,
    setIsDeleteRoomOpen,
    roomToDelete,
    roomForm,
    setRoomForm,
    openAddRoom,
    handleCreateRoom,
    openEditRoom,
    handleUpdateRoom,
    openDeleteRoom,
    handleDeleteRoom,
  } = useProperties();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Properties & Rooms"
        subtitle="Manage your building properties, unit inventory, and occupancy"
        action={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={openAddProperty}
              className="font-semibold text-xs"
            >
              <Plus className="h-4 w-4" />
              Add Building
            </Button>
            <Button
              size="sm"
              onClick={() => openAddRoom()}
              disabled={properties.length === 0}
              className="font-semibold text-xs"
            >
              <Plus className="h-4 w-4" />
              Add Unit
            </Button>
          </div>
        }
      />

      {/* Success Notification Banner */}
      {successMsg && (
        <div
          className="flex animate-fade-in-up items-center gap-2.5 rounded-xl border border-success-border bg-success-bg p-4 text-sm font-semibold text-success-fg shadow-sm"
          role="status"
        >
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Alert Banner */}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-danger-border bg-danger-bg px-4 py-3 text-xs font-semibold text-danger-fg">
          <span className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </span>
          <Button variant="ghost" size="sm" onClick={loadData}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      {/* 1. Overall KPI Statistics */}
      <PropertyStats loading={loading} stats={stats} />

      {/* 2. Managed Properties Grid */}
      <PropertyGrid
        properties={properties}
        loading={loading}
        selectedFilter={selectedPropertyFilter}
        onSelectFilter={(id) =>
          setSelectedPropertyFilter(selectedPropertyFilter === id ? "all" : id)
        }
        onOpenAdd={openAddProperty}
        onAddRoom={openAddRoom}
        onEdit={openEditProperty}
        onDelete={openDeleteProperty}
      />

      {/* 3. Rooms Filter Controls & Table */}
      <div className="space-y-4">
        <RoomFilters
          rooms={rooms}
          filteredCount={filteredRooms.length}
          properties={properties}
          searchQuery={searchQuery}
          selectedPropertyFilter={selectedPropertyFilter}
          selectedStatusFilter={selectedStatusFilter}
          onSearchChange={setSearchQuery}
          onPropertyFilterChange={setSelectedPropertyFilter}
          onStatusFilterChange={setSelectedStatusFilter}
        />

        <RoomTable
          rooms={filteredRooms}
          totalRoomsCount={rooms.length}
          hasProperties={properties.length > 0}
          loading={loading}
          onOpenAddRoom={() => openAddRoom()}
          onClearFilters={() => {
            setSelectedPropertyFilter("all");
            setSelectedStatusFilter("all");
            setSearchQuery("");
          }}
          onEditRoom={openEditRoom}
          onDeleteRoom={openDeleteRoom}
        />
      </div>

      {/* Modals */}
      <PropertyFormModal
        open={isAddPropertyOpen}
        isEdit={false}
        actionLoading={actionLoading}
        formData={propertyForm}
        onChange={setPropertyForm}
        onSubmit={handleCreateProperty}
        onClose={() => setIsAddPropertyOpen(false)}
      />

      <PropertyFormModal
        open={isEditPropertyOpen}
        isEdit={true}
        actionLoading={actionLoading}
        formData={propertyForm}
        onChange={setPropertyForm}
        onSubmit={handleUpdateProperty}
        onClose={() => setIsEditPropertyOpen(false)}
      />

      <RoomFormModal
        open={isAddRoomOpen}
        isEdit={false}
        actionLoading={actionLoading}
        properties={properties}
        formData={roomForm}
        onChange={setRoomForm}
        onSubmit={handleCreateRoom}
        onClose={() => setIsAddRoomOpen(false)}
      />

      <RoomFormModal
        open={isEditRoomOpen}
        isEdit={true}
        actionLoading={actionLoading}
        properties={properties}
        formData={roomForm}
        onChange={setRoomForm}
        onSubmit={handleUpdateRoom}
        onClose={() => setIsEditRoomOpen(false)}
      />

      <DeleteConfirmModal
        open={isDeletePropertyOpen}
        title="Delete Building"
        description={`Are you sure you want to delete "${propertyToDelete?.name}"?`}
        warningNote="This will permanently delete this building and all its associated rooms and tenant leases."
        confirmText="Delete Building"
        actionLoading={actionLoading}
        onConfirm={handleDeleteProperty}
        onClose={() => setIsDeletePropertyOpen(false)}
      />

      <DeleteConfirmModal
        open={isDeleteRoomOpen}
        title="Delete Unit"
        description={`Are you sure you want to delete Room "${roomToDelete?.room_number}"?`}
        warningNote="This action cannot be undone."
        confirmText="Delete Unit"
        actionLoading={actionLoading}
        onConfirm={handleDeleteRoom}
        onClose={() => setIsDeleteRoomOpen(false)}
      />
    </div>
  );
}
