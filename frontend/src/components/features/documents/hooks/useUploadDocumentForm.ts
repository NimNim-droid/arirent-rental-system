import { useState, useRef, type DragEvent, type FormEvent } from "react";
import { documentsService } from "@/lib/services/documents";
import { getErrorMessage } from "@/lib/errors";
import type { DocumentItem } from "@/lib/types";

export const DOCUMENT_CATEGORIES = [
  "Contracts & Agreements",
  "House Rules & Regulations",
  "Checklists & Guides",
  "Notices & Policies",
  "Other Documentation",
];

interface UseUploadDocumentFormProps {
  onSuccess: (newDoc: DocumentItem) => void;
  onClose: () => void;
}

export function useUploadDocumentForm({ onSuccess, onClose }: UseUploadDocumentFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(DOCUMENT_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (incomingFile: File | null) => {
    if (!incomingFile) return;
    setFile(incomingFile);
    setError("");
    if (!name) {
      const baseName = incomingFile.name.replace(/\.[^/.]+$/, "");
      setName(baseName);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
  };

  const resetForm = () => {
    setFile(null);
    setName("");
    setCategory(DOCUMENT_CATEGORIES[0]);
    setDescription("");
    setError("");
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClose = () => {
    if (uploading) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file to upload.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const doc = await documentsService.uploadDocument(file, {
        name: name.trim() || file.name,
        category,
        description: description.trim() || undefined,
      });

      resetForm();
      onSuccess(doc);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload document. Please try again."));
    } finally {
      setUploading(false);
    }
  };

  return {
    fileInputRef,
    file,
    setFile,
    name,
    setName,
    category,
    setCategory,
    description,
    setDescription,
    dragActive,
    uploading,
    error,
    handleFileChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    handleClose,
    handleSubmit,
  };
}

