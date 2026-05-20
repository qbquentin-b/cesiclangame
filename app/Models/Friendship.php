<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Friendship extends Model
{
    use HasUuids;

    protected $guarded = [];

    public function requester()
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function addressee()
    {
        return $this->belongsTo(User::class, 'addressee_id');
    }
}
