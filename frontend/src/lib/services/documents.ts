import api from "@/lib/axios";
import type { DocumentItem } from "@/lib/types";

export const documentsService = {
  async getDocuments(): Promise<DocumentItem[]> {
    const res = await api.get<{ data: DocumentItem[] }>("/documents");
    return res.data.data;
  },

  async uploadDocument(file: File): Promise<DocumentItem> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post<{ data: DocumentItem }>("/documents", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data;
  },

  async deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
  },
};