<!DOCTYPE html>
<html class="dark" lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('ui.app_name') }} - @yield('title', 'Home')</title>

    {{-- Google Fonts: Lexend --}}
    <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    
    {{-- Material Symbols Icons --}}
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" rel="stylesheet">

    {{-- Vite: CSS + JS --}}
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="dark">
    <div class="relative flex min-h-screen w-full max-w-[430px] mx-auto flex-col bg-[#0a0e1a] overflow-x-hidden">
        @yield('content')
    </div>
</body>
</html>
