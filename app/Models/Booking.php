<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $fillable = ['code', 'customer_id', 'service_id', 'barber_id', 'starts_at', 'ends_at', 'status', 'notes', 'total'];
    protected $casts = ['starts_at' => 'datetime', 'ends_at' => 'datetime', 'total' => 'integer'];
    public function customer() { return $this->belongsTo(Customer::class); }
    public function service() { return $this->belongsTo(Service::class); }
    public function barber() { return $this->belongsTo(Barber::class); }
}
