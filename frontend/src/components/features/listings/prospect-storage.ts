export interface ProspectDraft {
  inquiry_id?: string;
  property_id?: string;
  room_id?: string;
  name: string;
  phone: string;
  email?: string;
}

const DRAFT_KEY = "arirent_prospect_draft";

export function saveProspectDraft(draft: ProspectDraft): void {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Ignore storage quota errors in private browsing
  }
}

export function loadProspectDraft(): ProspectDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ProspectDraft;
  } catch {
    return null;
  }
}

export function clearProspectDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Ignore
  }
}
