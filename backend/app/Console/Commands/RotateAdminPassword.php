<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Str;

class RotateAdminPassword extends Command
{
    protected $signature = 'arirent:rotate-admin-password
                            {email=admin@arirent.com : Administrator email address}
                            {--password= : Use a specific password instead of generating one}';

    protected $description = 'Rotate an administrator password and revoke all of their API tokens';

    public function handle(): int
    {
        $email = (string) $this->argument('email');
        $user = User::where('email', $email)->first();

        if (! $user || $user->role !== 'admin') {
            $this->error("No administrator found with email {$email}.");

            return self::FAILURE;
        }

        $providedPassword = (string) $this->option('password');

        if ($providedPassword !== '' && strlen($providedPassword) < 12) {
            $this->error('The --password option must be at least 12 characters.');

            return self::FAILURE;
        }

        $password = $providedPassword !== '' ? $providedPassword : Str::password(24);

        $user->password = $password;
        $user->save();
        $user->tokens()->delete();

        $this->info("Password rotated for {$email}. All API tokens were revoked.");

        if ($providedPassword === '') {
            $this->line("New password: {$password}");
        }

        return self::SUCCESS;
    }
}
