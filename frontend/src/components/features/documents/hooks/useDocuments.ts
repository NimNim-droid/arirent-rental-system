import { useCallback, useEffect, useRef, useState } from "react";
import { documentsService } from "@/lib/services/documents";
import { compressImage } from "@/lib/image";
import { getErrorMessage } from "@/lib/errors";
import type { DocumentItem } from "@/lib/types";

export function useDocuments() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docs, setDocs] = useState<DocumentItem[]>([]);
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
      setDocs(res ?? []);
    } catch (err) {
      setDocs([]);
      setError(getErrorMessage(err, "Unable to load documents."));
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
