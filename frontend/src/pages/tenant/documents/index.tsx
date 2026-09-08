import { useState } from "react";
import { FileText, ShieldCheck, Printer, Eye } from "lucide-react";
import { PageHeader } from "@/components/common/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export default function TenantDocuments() {
  const [activeDoc, setActiveDoc] = useState<string | null>(null);

  const rawUser = localStorage.getItem("arirent_current_user");
  const user = rawUser ? JSON.parse(rawUser) : { name: "Maria Santos" };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Official Documents & Policies"
        subtitle="Review your active residential lease agreement and community house rules"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Lease Agreement */}
        <Card className="p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-sky-50 text-sky-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Residential Lease Contract</h3>
              <p className="text-xs text-slate-500 mt-1">
                Formal tenancy contract between AriRent Properties and {user.name}.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
              <p><strong>Unit:</strong> Room 101, AriRent Residences - Makati</p>
              <p><strong>Term:</strong> January 15, 2026 — January 15, 2027</p>
              <p><strong>Monthly Rent:</strong> ₱5,000.00 (Due every 15th)</p>
            </div>
          </div>
          <Button onClick={() => setActiveDoc("lease")} className="w-full">
            <Eye className="h-4 w-4" /> View Full Contract
          </Button>
        </Card>

        {/* House Rules */}
        <Card className="p-6 flex flex-col justify-between space-y-5">
          <div className="space-y-3">
            <div className="p-3 w-fit rounded-2xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Building Rules & Regulations</h3>
              <p className="text-xs text-slate-500 mt-1">
                Community guidelines on quiet hours, garbage disposal, and guest policies.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1 text-slate-600">
              <p><strong>Quiet Hours:</strong> 10:00 PM — 7:00 AM</p>
              <p><strong>Garbage Collection:</strong> Daily before 8:00 AM</p>
              <p><strong>Visitor Curfew:</strong> Guests must register at front desk</p>
            </div>
          </div>
          <Button
            variant="secondary"
            onClick={() => setActiveDoc("rules")}
            className="w-full"
          >
            <Eye className="h-4 w-4" /> Read House Rules
          </Button>
        </Card>
      </div>

      {/* Document Viewer Modal */}
      {activeDoc && (
        <Modal
          open={!!activeDoc}
          onClose={() => setActiveDoc(null)}
          title={
            activeDoc === "lease"
              ? "Official Residential Lease Agreement"
              : "Building Rules & Community Guidelines"
          }
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs text-slate-700 max-h-96 overflow-y-auto pr-2">
            {activeDoc === "lease" ? (
              <div className="space-y-3 leading-relaxed">
                <p className="font-bold text-slate-900 text-sm">
                  CONTRACT OF LEASE FOR RESIDENTIAL UNIT
                </p>
                <p>
                  KNOW ALL MEN BY THESE PRESENTS: This CONTRACT OF LEASE is made and entered into by
                  and between ARIRENT PROPERTIES (Lessor) and {user.name} (Lessee).
                </p>
                <p>
                  <strong>1. PREMISES:</strong> The Lessor hereby leases to the Lessee Unit 101
                  situated at AriRent Residences - Makati.
                </p>
                <p>
                  <strong>2. TERM:</strong> This lease is for a period of one (1) year commencing
                  from January 15, 2026.
                </p>
                <p>
                  <strong>3. RENTAL:</strong> The monthly rental rate is PHP 5,000.00 payable every
                  15th day of each calendar month.
                </p>
                <p>
                  <strong>4. UTILITIES:</strong> Lessee pays for actual electric consumption based
                  on individual sub-meter readings plus a fixed monthly water charge of PHP 500.00.
                </p>
              </div>
            ) : (
              <div className="space-y-3 leading-relaxed">
                <p className="font-bold text-slate-900 text-sm">ARIRENT HOUSE POLICIES</p>
                <p>
                  <strong>1. Noise:</strong> Respect fellow tenants. Keep music and television volume
                  low during quiet hours (10:00 PM to 7:00 AM).
                </p>
                <p>
                  <strong>2. Waste Segregation:</strong> Biodegradable and non-biodegradable waste must
                  be properly sealed in designated trash bags.
                </p>
                <p>
                  <strong>3. Common Areas:</strong> Keep hallways and staircases clear of shoes,
                  umbrellas, or personal storage items at all times.
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100 mt-4">
            <Button variant="secondary" size="sm" onClick={() => window.print()}>
              <Printer className="h-4 w-4" /> Print Document
            </Button>
            <Button size="sm" onClick={() => setActiveDoc(null)}>
              Close
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
