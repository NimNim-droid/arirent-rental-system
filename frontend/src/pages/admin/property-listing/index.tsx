import { Link, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShellSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BuildingPhotosCard,
  BuildingProfileForm,
  EditRoomListingModal,
  RoomListingsCard,
  useAdminPropertyListing,
} from "@/components/features/listings";

export default function AdminPropertyListingPage() {
  const { id } = useParams<{ id: string }>();
  const {
    property,
    loading,
    savingProfile,
    uploadingTarget,
    photoActionId,
    error,
    successMsg,
    profileForm,
    setProfileForm,
    customBuildingAmenity,
    setCustomBuildingAmenity,
    editingRoom,
    setEditingRoom,
    savingRoom,
    customRoomAmenity,
    setCustomRoomAmenity,
    roomForm,
    setRoomForm,
    handleSaveProfile,
    handleUploadPhotos,
    handleSetCover,
    handleDeletePhoto,
    handleToggleRoomListed,
    openRoomEditor,
    handleSaveRoom,
  } = useAdminPropertyListing(id);

  if (loading) {
    return <PageShellSkeleton />;
  }

  if (!property) {
    return (
      <Card>
        <EmptyState
          title="Building Not Found"
          description={error || "Return to Properties & Units to select a valid building."}
          action={
            <Link to="/admin/properties">
              <Button variant="secondary" size="sm">
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to Properties
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-1.5 text-xs text-muted">
        <Link to="/admin/properties" className="inline-flex items-center gap-1 hover:text-fg">
          <ArrowLeft className="h-3.5 w-3.5" />
          Properties &amp; Units
        </Link>
        <span>/</span>
        <span className="text-fg font-medium">{property.name}</span>
      </div>

      <PageHeader
        title={`${property.name} — Public Listing`}
        subtitle="Upload building and room photos, set landlord contact details, and control which rooms appear publicly"
        action={
          <Link to={`/properties/${property.id}`} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="sm">
              <ExternalLink className="h-3.5 w-3.5" />
              Preview Public Page
            </Button>
          </Link>
        }
      />

      {successMsg && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md border border-success-border bg-success-bg px-3.5 py-2.5 text-xs font-medium text-success-fg"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-danger-border bg-danger-bg px-3.5 py-2.5 text-xs font-medium text-danger-fg">
          {error}
        </div>
      )}

      <BuildingPhotosCard
        photos={property.photos ?? []}
        uploading={uploadingTarget === "building"}
        photoActionId={photoActionId}
        onUpload={(files) => handleUploadPhotos(files)}
        onSetCover={handleSetCover}
        onDelete={handleDeletePhoto}
      />

      <BuildingProfileForm
        formData={profileForm}
        onChange={setProfileForm}
        customAmenity={customBuildingAmenity}
        onCustomAmenityChange={setCustomBuildingAmenity}
        saving={savingProfile}
        onSubmit={handleSaveProfile}
      />

      <RoomListingsCard
        rooms={property.rooms ?? []}
        uploadingTarget={uploadingTarget}
        onUploadRoomPhotos={(files, roomId) => handleUploadPhotos(files, roomId)}
        onSetCoverPhoto={handleSetCover}
        onDeletePhoto={handleDeletePhoto}
        onEditRoom={openRoomEditor}
        onToggleRoomListed={handleToggleRoomListed}
      />

      <EditRoomListingModal
        room={editingRoom}
        formData={roomForm}
        onChange={setRoomForm}
        customAmenity={customRoomAmenity}
        onCustomAmenityChange={setCustomRoomAmenity}
        saving={savingRoom}
        onSubmit={handleSaveRoom}
        onClose={() => setEditingRoom(null)}
      />
    </div>
  );
}
