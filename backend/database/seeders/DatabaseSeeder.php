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

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Settings
        Setting::create([
            'elec_rate' => 12.50,
            'water_rate' => 500.00,
            'gcash_name' => 'AriRent Property Management',
            'gcash_number' => '0917-123-4567',
            'gcash_qr_path' => null,
        ]);

        // 2. Admin User
        $adminUser = User::create([
            'name' => 'Property Manager',
            'email' => 'admin@arirent.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
        ]);

        // 3. Properties
        $makati = Property::create([
            'name' => 'AriRent Residences - Makati',
            'city' => 'Makati City',
            'address' => '123 Ayala Avenue, Bel-Air, Makati',
        ]);

        $qc = Property::create([
            'name' => 'AriRent Heights - Quezon City',
            'city' => 'Quezon City',
            'address' => '456 Katipunan Avenue, Loyola Heights, QC',
        ]);

        // 4. Rooms for Makati
        $room101 = Room::create([
            'property_id' => $makati->id,
            'room_number' => '101',
            'rent' => 12000.00,
            'status' => 'occupied',
        ]);

        $room102 = Room::create([
            'property_id' => $makati->id,
            'room_number' => '102',
            'rent' => 12000.00,
            'status' => 'vacant',
        ]);

        $room105 = Room::create([
            'property_id' => $makati->id,
            'room_number' => '105',
            'rent' => 10000.00,
            'status' => 'reserved',
        ]);

        $room204 = Room::create([
            'property_id' => $makati->id,
            'room_number' => '204',
            'rent' => 14000.00,
            'status' => 'occupied',
        ]);

        $room205 = Room::create([
            'property_id' => $makati->id,
            'room_number' => '205',
            'rent' => 14000.00,
            'status' => 'vacant',
        ]);

        // Rooms for QC
        $roomQc201 = Room::create([
            'property_id' => $qc->id,
            'room_number' => '201',
            'rent' => 9500.00,
            'status' => 'reserved',
        ]);

        $roomQc202 = Room::create([
            'property_id' => $qc->id,
            'room_number' => '202',
            'rent' => 9500.00,
            'status' => 'vacant',
        ]);

        $roomQc301 = Room::create([
            'property_id' => $qc->id,
            'room_number' => '301',
            'rent' => 11000.00,
            'status' => 'occupied',
        ]);

        // 5. Tenant Users & Tenant Profiles
        // Tenant 1: Maria Santos (Active)
        $mariaUser = User::create([
            'name' => 'Maria Santos',
            'email' => 'tenant@arirent.com',
            'password' => Hash::make('tenant123'),
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
            'password' => Hash::make('tenant123'),
            'status' => 'active',
            'balance' => 0.00,
            'water_rate' => 500.00,
            'lease_end' => '2027-01-15',
        ]);

        // Tenant 2: Carlos Reyes (Active with pending GCash payment)
        $carlosUser = User::create([
            'name' => 'Carlos Reyes',
            'email' => 'carlos@example.com',
            'password' => Hash::make('tenant123'),
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
            'password' => Hash::make('tenant123'),
            'status' => 'active',
            'balance' => 5500.00,
            'water_rate' => 500.00,
            'lease_end' => '2026-12-31',
        ]);

        // Tenant 3: Juan Miguel (Pending Approval)
        Tenant::create([
            'user_id' => null,
            'property_id' => $makati->id,
            'room' => '105',
            'username' => 'juanmiguel',
            'name' => 'Juan Miguel',
            'email' => 'juan.m@example.com',
            'phone' => '0918-333-4444',
            'password' => Hash::make('secret123'),
            'status' => 'pending_approval',
            'balance' => 0.00,
            'water_rate' => 500.00,
            'lease_end' => null,
        ]);

        // Tenant 4: Angela De Silva (Pending Approval)
        Tenant::create([
            'user_id' => null,
            'property_id' => $qc->id,
            'room' => '201',
            'username' => 'angeladesilva',
            'name' => 'Angela De Silva',
            'email' => 'angela@example.com',
            'phone' => '0920-555-8888',
            'password' => Hash::make('secret123'),
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
            'rent' => 5000.00,
            'electricity' => 0.00,
            'elec_usage' => 0.00,
            'water' => 500.00,
            'late_fee' => 0.00,
            'total_amount' => 5500.00,
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
