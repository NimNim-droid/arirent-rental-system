import api from "@/lib/axios";
import type { DocumentItem } from "@/lib/types";

export interface DocumentUploadMeta {
  name?: string;
  category?: string;
  description?: string;
}

export const documentsService = {
  async getDocuments(params?: { search?: string; category?: string }): Promise<DocumentItem[]> {
    const res = await api.get<{ data: DocumentItem[] }>("/documents", { params });
    return res.data.data;
  },

  async uploadDocument(file: File, meta?: DocumentUploadMeta): Promise<DocumentItem> {
    const form = new FormData();
    form.append("file", file);
    if (meta?.name) form.append("name", meta.name);
    if (meta?.category) form.append("category", meta.category);
    if (meta?.description) form.append("description", meta.description);
    const res = await api.post<{ data: DocumentItem }>("/documents", form);
    return res.data.data;
  },

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};