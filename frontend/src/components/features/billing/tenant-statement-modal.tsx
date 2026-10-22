import { InvoiceModal, type InvoiceModalProps } from "./invoice-modal";

export type TenantStatementModalProps = InvoiceModalProps;

/**
 * TenantStatementModal
 * Re-exports the unified InvoiceModal for tenant-facing views.
 * Guarantees that tenants and admins share the exact same authentic receipt design.
 */
export function TenantStatementModal(props: TenantStatementModalProps) {
  return <InvoiceModal {...props} />;
}
