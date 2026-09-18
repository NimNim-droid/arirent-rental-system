import { useCallback, useEffect, useRef, useState } from "react";
import { documentsService } from "@/lib/services/documents";
import { compressImage } from "@/lib/image";
import { getErrorMessage } from "@/lib/errors";
import type { DocumentItem } from "@/lib/types";

export const DEFAULT_DOCUMENTS: DocumentItem[] = [
  {
    id: "1",
    name: "AriRent Standard Lease Contract & Agreement.pdf",
    category: "Contracts & Agreements",
    type: "application/pdf",
    size: 2457600,
    url: "#",
    uploaded_at: "2026-08-15",
    uploaded_by: "Property Management",
    description: "Official residential tenancy agreement outlining lease terms, security deposits, and conditions.",
  },
  {
    id: "2",
    name: "AriRent House Rules & Safety Regulations.pdf",
    category: "House Rules & Regulations",
    type: "application/pdf",
    size: 1245184,
    url: "#",
    uploaded_at: "2026-08-15",
    uploaded_by: "Property Management",
    description: "Quiet hours, guest policies, garbage disposal, and emergency safety guidelines for all tenants.",
  },
  {
    id: "3",
    name: "Unit Move-In Checklist & Inspection Report.pdf",
    category: "Checklists & Guides",
    type: "application/pdf",
    size: 842100,
    url: "#",
    uploaded_at: "2026-08-15",
    uploaded_by: "Property Management",
    description: "Mandatory initial condition report covering unit fixtures, appliances, and utility meter baselines.",
  },
  {
    id: "4",
    name: "Billing Schedule & Payment Policy Notice.pdf",
    category: "Notices & Policies",
    type: "application/pdf",
    size: 512000,
    url: "#",
    uploaded_at: "2026-08-15",
    uploaded_by: "Property Management",
    description: "Detailed payment channels, GCash settlement procedures, due date rules, and penalty policies.",
  },
];

export function useDocuments() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<DocumentItem[]>(DEFAULT_DOCUMENTS);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [unavailableDoc, setUnavailableDoc] = useState<DocumentItem | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<DocumentItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await documentsService.getDocuments();
      if (res && res.length > 0) {
        setDocs(res);
      }
    } catch {
      // Fallback seamlessly to default documents for demo
      setDocs(DEFAULT_DOCUMENTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError("");
    setSuccessMsg("");
    try {
      const results = await Promise.allSettled(
        Array.from(files).map(async (file) => {
          const optimizedFile = await compressImage(file);
          return documentsService.uploadDocument(optimizedFile);
        })
      );
      const uploaded = results
        .filter((r): r is PromiseFulfilledResult<DocumentItem> => r.status === "fulfilled")
        .map((r) => r.value);
      const failed = results.filter((r) => r.status === "rejected").length;

      setDocs((prev) => [...uploaded.reverse(), ...prev]);
      if (failed > 0) {
        setSuccessMsg(`${uploaded.length} uploaded, ${failed} failed.`);
      } else {
        setSuccessMsg(
          uploaded.length > 1
            ? `${uploaded.length} files uploaded successfully!`
            : "File uploaded successfully!"
        );
      }
    } catch (err) {
      setError(getErrorMessage(err, "Unable to upload the file(s)."));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    if (!doc.url || doc.url === "#") {
      setUnavailableDoc(doc);
      return;
    }
    const link = document.createElement("a");
    link.href = doc.url;
    link.target = "_blank";
    link.click();
  };

  const handleDelete = async (doc: DocumentItem) => {
    setDeleteBusy(true);
    setError("");
    try {
      await documentsService.deleteDocument(doc.id);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
      setDeletingDoc(null);
    } catch (err) {
      setError(getErrorMessage(err, "Unable to delete the document."));
    } finally {
      setDeleteBusy(false);
    }
  };

  return {
    docs,
    fileInputRef,
    uploading,
    error,
    successMsg,
    loading,
    unavailableDoc,
    setUnavailableDoc,
    deletingDoc,
    setDeletingDoc,
    deleteBusy,
    loadDocs,
    handleFiles,
    handleDownload,
    handleDelete,
  };
}
