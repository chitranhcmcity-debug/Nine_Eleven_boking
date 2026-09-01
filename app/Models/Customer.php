<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    protected $fillable = ['name', 'phone', 'email', 'notes', 'last_visit_at'];
    protected $casts = ['last_visit_at' => 'datetime'];
    public function bookings() { return $this->hasMany(Booking::class); }
}
