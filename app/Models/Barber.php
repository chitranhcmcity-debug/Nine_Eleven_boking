<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Barber extends Model
{
    protected $fillable = ['name', 'title', 'bio', 'avatar', 'active'];
    protected $casts = ['active' => 'boolean'];
}
