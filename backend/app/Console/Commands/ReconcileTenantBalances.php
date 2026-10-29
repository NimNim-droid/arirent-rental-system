<?php

namespace App\Console\Commands;

use App\Models\Bill;
use App\Models\Tenant;
use Illuminate\Console\Command;

class ReconcileTenantBalances extends Command
{
    protected $signature = 'arirent:reconcile-balances
                            {--fix : Apply the corrected balances instead of only reporting them}
                            {--tenant= : Reconcile a single tenant ID}';

    protected $description = 'Reconcile tenant balances with the sum of their non-voided bill balances';

    public function handle(): int
    {
        $query = Tenant::query()->orderBy('id');

        if ($this->option('tenant') !== null) {
            $query->whereKey((int) $this->option('tenant'));
        }

        $tenants = $query->get(['id', 'name', 'balance']);
        $drifted = 0;

        foreach ($tenants as $tenant) {
            $ledgerBalance = round((float) Bill::where('tenant_id', $tenant->id)
                ->where('status', '!=', 'voided')
                ->sum('remaining_balance'), 2);

            $currentBalance = round((float) $tenant->balance, 2);
            $drift = round($currentBalance - $ledgerBalance, 2);

            if (abs($drift) < 0.01) {
                continue;
            }

            $drifted++;

            $this->line(sprintf(
                'Tenant #%d %s: recorded %s, ledger %s, drift %s',
                $tenant->id,
                $tenant->name,
                number_format($currentBalance, 2),
                number_format($ledgerBalance, 2),
                number_format($drift, 2)
            ));

            if ($this->option('fix')) {
                $tenant->update(['balance' => $ledgerBalance]);
            }
        }

        if ($drifted === 0) {
            $this->info('All tenant balances match the bill ledger.');

            return self::SUCCESS;
        }

        if ($this->option('fix')) {
            $this->info("Reconciled {$drifted} tenant balance(s).");
        } else {
            $this->warn("{$drifted} tenant balance(s) differ from the ledger. Re-run with --fix to apply.");
        }

        return self::SUCCESS;
    }
}
