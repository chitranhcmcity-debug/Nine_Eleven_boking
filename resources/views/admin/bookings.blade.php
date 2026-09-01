@extends('layouts.admin') @section('title','Lịch hẹn') @section('heading','Quản lý lịch hẹn') @section('content')
<div class="filters">@foreach([''=>'Tất cả','pending'=>'Chờ xác nhận','confirmed'=>'Đã xác nhận','serving'=>'Đang phục vụ','completed'=>'Hoàn thành','cancelled'=>'Đã huỷ'] as $key=>$label)<a class="{{ request('status')===$key?'active':'' }}" href="?status={{ $key }}">{{ $label }}</a>@endforeach</div><section class="panel">@include('admin.partials.booking-table',['bookings'=>$bookings])</section>{{ $bookings->links() }}
@endsection
