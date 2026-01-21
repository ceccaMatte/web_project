<div class="mb-12 text-center relative w-full max-w-sm">
    <div class="absolute inset-0 -top-12 pointer-events-none" style="background: radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0) 70%);" aria-hidden="true"></div>

    <div class="relative z-10">
        <div class="w-20 h-20 bg-primary/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-primary/30 shadow-[0_0_40px_rgba(59,130,246,0.2)] rotate-3 hover:rotate-0 transition-transform duration-500" aria-hidden="true">
            <span class="material-symbols-outlined text-primary text-5xl">{{ config('ui.auth.logo_icon') }}</span>
        </div>

        <h1 class="text-3xl font-bold tracking-tight mb-2">{{ config('ui.auth.app_name') }}</h1>

        <p class="text-slate-400 text-sm font-medium tracking-wide">{{ config('ui.auth.tagline') }}</p>
    </div>
</div>
