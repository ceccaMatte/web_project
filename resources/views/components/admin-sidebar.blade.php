{{-- Reusable Admin Sidebar Partial
     Expects: $menu (array), $user (array), $sidebarTitle (string)
--}}

{{-- Backdrop (overlay) --}}
<div
    data-sidebar-backdrop
    class="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 hidden"
    data-action="close-sidebar"
></div>

{{-- Sidebar panel (right side) --}}
<aside
    data-admin-sidebar
    class="fixed top-0 right-0 h-full w-80 bg-[#0d1117] border-l border-slate-800 flex flex-col z-50 transform translate-x-full transition-transform duration-300"
    id="sidebar-menu"
>
    <div class="p-6 border-b border-slate-800">
        <button
            type="button"
            data-action="close-sidebar"
            class="lg:hidden mb-4 p-2 -ml-2 text-slate-400 hover:text-white"
            aria-label="Close menu"
        >
            <span class="material-symbols-outlined text-2xl">close</span>
        </button>

        <div class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-lg bg-primary/20 text-primary">
                <span class="material-symbols-outlined text-2xl">{{ config('ui.icons.logo') }}</span>
            </div>
            <div>
                <h2 class="text-white text-base font-bold leading-tight">{{ config('ui.app_name') }}</h2>
                <p class="text-[10px] text-slate-500 font-medium uppercase tracking-widest">{{ $sidebarTitle ?? '' }}</p>
            </div>
        </div>
    </div>

    <nav class="flex-1 p-4">
        <ul class="space-y-1">
            @foreach($menu as $item)
                @php
                    $isCurrent = isset($item['route']) && Route::currentRouteName() === $item['route'];
                    $isDisabled = $item['disabled'] ?? false;
                @endphp
                <li>
                    @if($isDisabled)
                        <div class="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 cursor-not-allowed opacity-50">
                            <span class="material-symbols-outlined text-xl">{{ $item['icon'] }}</span>
                            <span class="font-medium text-sm">{{ $item['label'] }}</span>
                            <span class="ml-auto text-[9px] uppercase tracking-wider bg-slate-800 px-2 py-0.5 rounded">Soon</span>
                        </div>
                    @else
                        <a href="{{ route($item['route']) }}" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors {{ $isCurrent ? 'bg-primary/10 text-primary' : 'text-slate-400 hover:bg-white/5 hover:text-slate-300' }}">
                            <span class="material-symbols-outlined text-xl" @if($isCurrent) style="font-variation-settings: 'FILL' 1" @endif>{{ $item['icon'] }}</span>
                            <span class="font-medium text-sm">{{ $item['label'] }}</span>
                        </a>
                    @endif
                </li>
            @endforeach
        </ul>
    </nav>

    <div class="p-4 border-t border-slate-800">
        <div class="flex items-center gap-3 mb-4">
            <div class="size-10 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <span class="text-white font-bold text-sm">{{ strtoupper(substr($user['nickname'] ?? $user['name'], 0, 2)) }}</span>
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-white truncate">{{ $user['nickname'] ?? $user['name'] }}</p>
                <p class="text-xs text-slate-500 uppercase tracking-wider">{{ $user['role'] }}</p>
            </div>
        </div>
        <form method="POST" action="{{ route('logout') }}">
            @csrf
            <button type="submit" class="flex items-center gap-2 w-full px-4 py-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors">
                <span class="material-symbols-outlined text-lg">logout</span>
                <span class="text-sm font-medium">Logout</span>
            </button>
        </form>
    </div>
</aside>
