<?php

namespace Database\Seeders;

use App\Models\Bill;
use App\Models\MaintenanceTicket;
use App\Models\Property;
use App\Models\Room;
use App\Models\Setting;
use App\Models\Tenant;
use App\Models\User;
use App\Models\UtilityReading;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Settings
        Setting::firstOrCreate([], [
            'elec_rate' => 12.50,
            'water_rate' => 500.00,
            'gcash_name' => 'AriRent Property Management',
            'gcash_number' => '0917-123-4567',
            'gcash_qr_path' => null,
        ]);

        // 2. Bootstrap admin. Never seed a known default password.
        $adminEmail = (string) env('SEED_ADMIN_EMAIL', 'admin@arirent.com');
        $adminPassword = env('SEED_ADMIN_PASSWORD');

        if (! User::where('email', $adminEmail)->exists()) {
            if (empty($adminPassword)) {
                if (app()->environment('production')) {
                    throw new RuntimeException(
                        'SEED_ADMIN_PASSWORD must be set before seeding a production database.'
                    );
                }

                $adminPassword = Str::password(20);
                $this->command?->warn(
                    "Generated admin password for {$adminEmail}: {$adminPassword}"
                );
            }

            User::create([
                'name' => 'Property Manager',
                'email' => $adminEmail,
                'password' => $adminPassword,
                'role' => 'admin',
            ]);
        }

        // 3. Demo data is opt-in so production seeding cannot create fake tenants.
        if (! env('SEED_DEMO_DATA', false)) {
            $this->command?->info('Demo data skipped. Set SEED_DEMO_DATA=true to seed the demo portfolio.');
            return;
        }

        $tenantPassword = env('SEED_TENANT_PASSWORD');

        if (empty($tenantPassword)) {
            $tenantPassword = Str::password(20);
            $this->command?->warn("Generated demo tenant password: {$tenantPassword}");
        }

        $tenantPasswordHash = Hash::make($tenantPassword);

        // 4. Properties
        $makati = Property::create([
            'name' => 'AriRent Residences - Makati',
            'city' => 'Makati City',
            'address' => '123 Ayala Avenue, Bel-Air, Makati',
            'description' => 'Well-maintained 4-storey residential apartment building 5 minutes from Ayala Triangle. Ideal for young professionals seeking quiet, secure city living with individual electric sub-meters.',
            'contact_name' => 'Engr. Ramon Villanueva',
            'contact_phone' => '0917-123-4567',
            'contact_email' => 'leasing@arirent.com',
            'messenger_url' => 'https://m.me/arirentmakati',
            'house_rules' => "1. Quiet hours from 10:00 PM to 6:00 AM.\n2. Registered visitors allowed until 10:00 PM.\n3. Strict no-smoking policy inside units and hallways.\n4. Garbage collection daily at 7:00 AM.",
            'amenities' => ['24/7 CCTV', 'Keycard Entry', 'Fiber WiFi Ready', 'Sub-metered Electricity', 'Fire Alarm & Sprinklers'],
        ]);

        $qc = Property::create([
            'name' => 'AriRent Heights - Quezon City',
            'city' => 'Quezon City',
            'address' => '456 Katipunan Avenue, Loyola Heights, QC',
            'description' => 'Modern studio apartments along Katipunan Avenue, walking distance to Ateneo, Miriam College, and LRT-2 Katipunan Station.',
            'contact_name' => 'Clarissa Mendoza',
            'contact_phone' => '0918-765-4321',
            'contact_email' => 'katipunan@arirent.com',
            'messenger_url' => 'https://m.me/arirentqc',
            'house_rules' => "1. Visitors must log in at the lobby guard desk.\n2. Quiet study hours after 9:30 PM.\n3. Small indoor pets subject to prior written approval.",
            'amenities' => ['Lobby Guard', 'Study Lounge', 'Laundry Area', 'CCTV Security', 'Bicycle Rack'],
        ]);

        // 4. Rooms for Makati
        $room101 = Room::create([
            'property_id' => $makati->id,
            'room_number' => '101',
            'rent' => 12000.00,
            'status' => 'occupied',
            'description' => 'Ground-floor studio with private toilet & bath and kitchenette counter.',
            'capacity' => 2,
            'floor_area' => 22.0,
            'amenities' => ['Private CR', 'Kitchenette', 'Aircon Included'],
            'advance_months' => 1,
            'deposit_months' => 1,
            'is_listed' => true,
        ]);

        $room102 = Room::create([
            'property_id' => $makati->id,
            'room_number' => '102',
            'rent' => 12000.00,
            'status' => 'vacant',
            'description' => 'Bright studio unit with built-in wardrobe, granite kitchen sink, private bathroom with water heater, and split-type aircon.',
            'capacity' => 2,
            'floor_area' => 22.0,
            'amenities' => ['Private CR', 'Water Heater', 'Split-Type Aircon', 'Kitchen Sink', 'Wardrobe'],
            'advance_months' => 1,
            'deposit_months' => 1,
            'is_listed' => true,
        ]);

        $room105 = Room::create([
            'property_id' => $makati->id,
            'room_number' => '105',
            'rent' => 10000.00,
            'status' => 'reserved',
            'description' => 'Compact solo studio ideal for professionals working in the CBD.',
            'capacity' => 1,
            'floor_area' => 18.0,
            'amenities' => ['Private CR', 'Aircon Provision', 'Work Desk'],
            'advance_months' => 1,
            'deposit_months' => 1,
            'is_listed' => true,
        ]);

        $room204 = Room::create([
            'property_id' => $makati->id,
            'room_number' => '204',
            'rent' => 14000.00,
            'status' => 'occupied',
            'description' => 'Corner deluxe unit with balcony and full kitchen counter.',
            'capacity' => 2,
            'floor_area' => 26.5,
            'amenities' => ['Private CR', 'Balcony', 'Split-Type Aircon', 'Kitchenette'],
            'advance_months' => 1,
            'deposit_months' => 2,
            'is_listed' => true,
        ]);

        $room205 = Room::create([
            'property_id' => $makati->id,
            'room_number' => '205',
            'rent' => 14000.00,
            'status' => 'vacant',
            'description' => 'Spacious 2nd-floor corner studio with street-facing balcony, inverter aircon, and own sub-meter.',
            'capacity' => 3,
            'floor_area' => 26.5,
            'amenities' => ['Private CR', 'Balcony', 'Inverter Aircon', 'Kitchenette', 'Bidet'],
            'advance_months' => 1,
            'deposit_months' => 2,
            'is_listed' => true,
        ]);

        // Rooms for QC
        $roomQc201 = Room::create([
            'property_id' => $qc->id,
            'room_number' => '201',
            'rent' => 9500.00,
            'status' => 'reserved',
            'description' => 'Twin-sharing student unit with study desks and bookshelves.',
            'capacity' => 2,
            'floor_area' => 19.5,
            'amenities' => ['Private CR', 'Study Desk', 'Fiber Port'],
            'advance_months' => 1,
            'deposit_months' => 1,
            'is_listed' => true,
        ]);

        $roomQc202 = Room::create([
            'property_id' => $qc->id,
            'room_number' => '202',
            'rent' => 9500.00,
            'status' => 'vacant',
            'description' => 'Quiet courtyard-facing studio designed for 1-2 students, equipped with fiber port, study desk, and private CR.',
            'capacity' => 2,
            'floor_area' => 19.5,
            'amenities' => ['Private CR', 'Study Desk', 'Aircon Included', 'Fiber Port', 'Cabinet'],
            'advance_months' => 1,
            'deposit_months' => 1,
            'is_listed' => true,
        ]);

        $roomQc301 = Room::create([
            'property_id' => $qc->id,
            'room_number' => '301',
            'rent' => 11000.00,
            'status' => 'vacant',
            'description' => '3rd-floor corner unit with panoramic view.',
            'capacity' => 2,
            'floor_area' => 23.0,
            'amenities' => ['Private CR', 'Aircon Included', 'Kitchenette'],
            'advance_months' => 1,
            'deposit_months' => 1,
            'is_listed' => true,
        ]);

        // 5. Tenant Users & Tenant Profiles
        // Tenant 1: Maria Santos (Active)
        $mariaUser = User::create([
            'name' => 'Maria Santos',
            'email' => 'tenant@arirent.com',
            'password' => $tenantPasswordHash,
            'role' => 'tenant',
        ]);

        $mariaTenant = Tenant::create([
            'user_id' => $mariaUser->id,
            'property_id' => $makati->id,
            'room' => '101',
            'username' => 'mariasantos',
            'name' => 'Maria Santos',
            'email' => 'tenant@arirent.com',
            'phone' => '0917-123-4567',
            'password' => $tenantPasswordHash,
            'status' => 'active',
            'balance' => 0.00,
            'water_rate' => 500.00,
            'lease_end' => '2027-01-15',
        ]);

        // Tenant 2: Carlos Reyes (Active with pending GCash payment)
        $carlosUser = User::create([
            'name' => 'Carlos Reyes',
            'email' => 'carlos@example.com',
            'password' => $tenantPasswordHash,
            'role' => 'tenant',
        ]);

        $carlosTenant = Tenant::create([
            'user_id' => $carlosUser->id,
            'property_id' => $makati->id,
            'room' => '204',
            'username' => 'carlosreyes',
            'name' => 'Carlos Reyes',
            'email' => 'carlos@example.com',
            'phone' => '0918-987-6543',
            'password' => $tenantPasswordHash,
            'status' => 'active',
            'balance' => 5500.00,
            'water_rate' => 500.00,
            'lease_end' => '2026-12-31',
        ]);

        // Tenant 3: Juan Miguel (Pending Approval)
        $juanUser = User::create([
            'name' => 'Juan Miguel',
            'email' => 'juan.m@example.com',
            'password' => $tenantPasswordHash,
            'role' => 'tenant',
        ]);

        Tenant::create([
            'user_id' => $juanUser->id,
            'property_id' => $makati->id,
            'room' => '105',
            'username' => 'juanmiguel',
            'name' => 'Juan Miguel',
            'email' => 'juan.m@example.com',
            'phone' => '0918-333-4444',
            'password' => $tenantPasswordHash,
            'status' => 'pending_approval',
            'balance' => 0.00,
            'water_rate' => 500.00,
            'lease_end' => null,
        ]);

        // Tenant 4: Angela De Silva (Pending Approval)
        $angelaUser = User::create([
            'name' => 'Angela De Silva',
            'email' => 'angela@example.com',
            'password' => $tenantPasswordHash,
            'role' => 'tenant',
        ]);

        Tenant::create([
            'user_id' => $angelaUser->id,
            'property_id' => $qc->id,
            'room' => '201',
            'username' => 'angeladesilva',
            'name' => 'Angela De Silva',
            'email' => 'angela@example.com',
            'phone' => '0920-555-8888',
            'password' => $tenantPasswordHash,
            'status' => 'pending_approval',
            'balance' => 0.00,
            'water_rate' => 500.00,
            'lease_end' => null,
        ]);

        // 6. Utility Readings
        UtilityReading::create([
            'tenant_id' => $mariaTenant->id,
            'prev_reading' => 1240.00,
            'curr_reading' => 1356.00,
            'usage_kwh' => 116.00,
            'amount' => 1450.00,
            'date' => '2026-09-01',
        ]);

        UtilityReading::create([
            'tenant_id' => $carlosTenant->id,
            'prev_reading' => 2100.00,
            'curr_reading' => 2268.00,
            'usage_kwh' => 168.00,
            'amount' => 2100.00,
            'date' => '2026-09-01',
        ]);

        // 7. Bills
        // Maria: Paid Bill
        Bill::create([
            'tenant_id' => $mariaTenant->id,
            'rent' => 12000.00,
            'electricity' => 1450.00,
            'elec_usage' => 116.00,
            'water' => 500.00,
            'late_fee' => 0.00,
            'total_amount' => 13950.00,
            'paid_amount' => 13950.00,
            'remaining_balance' => 0.00,
            'date' => '2026-09-01',
            'due_date' => '2026-09-15',
            'status' => 'paid',
            'gcash_ref' => '1092837465',
            'receipt_url' => null,
            'notes' => 'Paid on time via GCash',
            'payment_date' => '2026-09-05 14:30:00',
            'approved_date' => '2026-09-06 09:15:00',
        ]);

        // Carlos: Pending GCash Verification Bill
        Bill::create([
            'tenant_id' => $carlosTenant->id,
            'rent' => 14000.00,
            'electricity' => 2100.00,
            'elec_usage' => 168.00,
            'water' => 500.00,
            'late_fee' => 0.00,
            'total_amount' => 16600.00,
            'date' => '2026-09-01',
            'due_date' => '2026-09-15',
            'status' => 'pending_verification',
            'gcash_ref' => '9876543210',
            'receipt_url' => null,
            'notes' => 'Sent GCash payment Sept 8, 8:30pm',
            'payment_date' => '2026-09-08 20:30:00',
            'approved_date' => null,
        ]);

        // Carlos: Older Unpaid Bill
        Bill::create([
            'tenant_id' => $carlosTenant->id,
            'rent' => 14000.00,
            'electricity' => 0.00,
            'elec_usage' => 0.00,
            'water' => 500.00,
            'late_fee' => 0.00,
            'total_amount' => 14500.00,
            'date' => '2026-08-01',
            'due_date' => '2026-08-15',
            'status' => 'unpaid',
            'gcash_ref' => null,
            'receipt_url' => null,
            'notes' => 'Remaining partial balance from August',
        ]);

        // 8. Maintenance Tickets
        MaintenanceTicket::create([
            'tenant_id' => $mariaTenant->id,
            'property_id' => $makati->id,
            'room' => '101',
            'type' => 'plumbing',
            'description' => 'Bathroom faucet leaking continuously',
            'priority' => 'urgent',
            'status' => 'pending',
            'technician_name' => null,
            'admin_notes' => null,
        ]);

        MaintenanceTicket::create([
            'tenant_id' => $carlosTenant->id,
            'property_id' => $makati->id,
            'room' => '204',
            'type' => 'electrical',
            'description' => 'Kitchen ceiling light flickering',
            'priority' => 'normal',
            'status' => 'in_progress',
            'technician_name' => 'Mang Ben',
            'admin_notes' => 'Technician dispatched on Sept 8 morning',
        ]);

        MaintenanceTicket::create([
            'tenant_id' => $mariaTenant->id,
            'property_id' => $makati->id,
            'room' => '101',
            'type' => 'appliances',
            'description' => 'Aircon not blowing cold air',
            'priority' => 'urgent',
            'status' => 'resolved',
            'technician_name' => 'Kuya Jomar',
            'admin_notes' => 'Refrigerant recharged and filter cleaned',
            'resolved_date' => '2026-09-05 16:00:00',
        ]);
    }
}
