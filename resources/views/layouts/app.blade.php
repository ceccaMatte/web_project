<!DOCTYPE html>
<html class="dark" lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('ui.app_name') }} - @yield('title', 'Home')</title>

    {{-- Google Fonts: Lexend --}}
    <link href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&display=swap" rel="stylesheet">
    
    {{-- Material Symbols Icons --}}
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet">

    {{-- Vite: CSS + JS --}}
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="dark">
    {{--
        Container principale mobile-first.
        max-w-[430px]: larghezza massima da UI config
        mx-auto: centrato su desktop
        bg-background-dark: sfondo scuro
    --}}
    <div class="relative flex min-h-screen w-full max-w-[{{ config('ui.max_content_width') }}px] mx-auto flex-col bg-background-dark overflow-x-hidden">
        
        {{-- Contenuto pagina (slot) --}}
        @yield('content')

    </div>

    {{--
        Home indicator bar (iOS style).
        Visibile solo su mobile per indicare gesture swipe.
    --}}
    <div class="fixed bottom-4 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-700/50 rounded-full z-40"></div>
</body>
</html>
