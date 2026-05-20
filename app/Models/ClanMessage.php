<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ClanMessage extends Model
{
    use HasUuids;

    protected $fillable = ['clan_id', 'sender_id', 'body'];

    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function clan()
    {
        return $this->belongsTo(Clan::class);
    }
}
