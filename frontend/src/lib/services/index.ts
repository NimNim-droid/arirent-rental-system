export { authService } from "./auth";
export { propertiesService } from "./properties";
export { dashboardService } from "./dashboard";
export { tenantsService } from "./tenants";
export { utilitiesService } from "./utilities";
export { billingService } from "./billing";
export { maintenanceService } from "./maintenance";
export { documentsService } from "./documents";
export { settingsService } from "./settings";
export { reportsService } from "./reports";
export { excessChargesService } from "./excess-charges";

export type { TenantQuery } from "./tenants";
export type { ReadingPayload, ReadingQuery } from "./utilities";
export type { BillQuery } from "./billing";
export type { TicketQuery, TicketUpdatePayload } from "./maintenance";
export type {
  FinancialReportData,
  FinancialReportParams,
  RevenuePeriod,
} from "./reports";
