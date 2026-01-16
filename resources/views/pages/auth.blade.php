<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" class="dark">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <title>{{ config('ui.auth.login') }} - {{ config('ui.auth.app_name') }}</title>

    {{-- Fonts --}}
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600,700" rel="stylesheet" />
    
    {{-- Material Symbols Icons --}}
    <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />

    {{-- Vite Assets --}}
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="bg-background-dark text-slate-100 min-h-screen flex flex-col justify-center items-center p-6 font-display antialiased">
    
    {{--
        AUTH PAGE ROOT
        - data-page="auth" → trigger JS initialization
        - Container centrato, mobile-first
    --}}
    <div id="auth-root" data-page="auth" class="w-full max-w-md">
        
        {{-- Logo + Brand Header --}}
        @include('components.auth.logo-header')
        
        {{-- Auth Card (Login/Signup) --}}
        @include('components.auth.auth-card')
        
        {{-- Footer con links legali --}}
        <p class="mt-12 text-slate-600 text-[11px] text-center max-w-[240px] mx-auto leading-relaxed">
            {{ config('ui.auth.footer_text') }}
            <a href="#" class="text-slate-400 underline underline-offset-2 hover:text-primary transition-colors">
                {{ config('ui.auth.terms_link') }}
            </a>
            and
            <a href="#" class="text-slate-400 underline underline-offset-2 hover:text-primary transition-colors">
                {{ config('ui.auth.privacy_link') }}
            </a>
        </p>
        
        {{-- iOS Home Indicator --}}
        <div class="fixed bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-800 rounded-full" aria-hidden="true"></div>
    </div>
    
</body>
</html>
