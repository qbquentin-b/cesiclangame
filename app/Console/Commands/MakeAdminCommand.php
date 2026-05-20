<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

class MakeAdminCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'user:make-admin {username}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Promote a given user to admin';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $username = $this->argument('username');
        $user = \App\Models\User::where('username', $username)->first();
        
        if (!$user) {
            $this->error("User '{$username}' not found.");
            return;
        }
        
        $user->is_admin = true;
        $user->save();
        
        $this->info("User '{$username}' has been promoted to admin successfully!");
    }
}
