<?php

namespace Database\Seeders;

use App\Models\Barber;
use App\Models\Service;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::updateOrCreate(['email' => 'admin@nineeleven.vn'], ['name' => 'NineEleven Admin', 'password' => 'nineeleven']);
        foreach ([
            ['Cắt & tạo kiểu', 'Tư vấn form mặt, cắt tạo kiểu và hoàn thiện với sản phẩm.', 45, 180000],
            ['Combo NineEleven', 'Cắt tóc, gội thư giãn, massage và tạo kiểu.', 60, 280000],
            ['Uốn texture', 'Tạo độ phồng và texture tự nhiên, dễ chăm sóc.', 120, 650000],
            ['Nhuộm thời trang', 'Màu nhuộm cá nhân hoá theo phong cách của bạn.', 150, 850000],
        ] as [$name,$description,$duration,$price]) Service::updateOrCreate(['name'=>$name], compact('description','duration','price'));
        foreach ([['Khoa Nguyễn','Creative Director'],['Minh Trần','Senior Barber'],['Đạt Lê','Fade Specialist']] as [$name,$title]) Barber::updateOrCreate(['name'=>$name], compact('title'));
    }
}
