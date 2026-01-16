<?php

/**
 * Configurazione UI centralizzata.
 * 
 * RESPONSABILITÀ:
 * - Definisce nomi, tagline, icone dell'applicazione
 * - Centralizza token grafici (non valori HEX)
 * - Evita hard-coding nei componenti
 * 
 * UTILIZZO:
 * - Nei componenti Blade: config('ui.app_name')
 * - Nessun valore grafico deve essere hard-coded
 */

return [
    /*
    |--------------------------------------------------------------------------
    | Informazioni Applicazione
    |--------------------------------------------------------------------------
    |
    | Nome e tagline mostrati in TopBar e Sidebar.
    | Modificabili senza toccare i componenti.
    |
    */
    'app_name' => 'Campus Truck',
    'app_tagline' => 'Student Service',

    /*
    |--------------------------------------------------------------------------
    | Icone (Material Symbols)
    |--------------------------------------------------------------------------
    |
    | Nomi delle icone Material Symbols utilizzate nell'app.
    | https://fonts.google.com/icons
    |
    */
    'icons' => [
        'logo' => 'local_shipping',
        'menu' => 'menu',
        'close' => 'close',
        'home' => 'home',
        'orders' => 'receipt_long',
        'logout' => 'logout',
    ],

    /*
    |--------------------------------------------------------------------------
    | Layout & Dimensioni
    |--------------------------------------------------------------------------
    |
    | Configurazione layout responsive.
    | sidebar_width: usato per classi Tailwind (es. w-56 = 224px)
    |
    */
    'sidebar_width' => 56, // Tailwind: w-56 = 224px (~200px richiesti)
    'max_content_width' => 430, // Mobile-first max width

    /*
    |--------------------------------------------------------------------------
    | Menu Sidebar
    |--------------------------------------------------------------------------
    |
    | Voci di menu della sidebar.
    | Ogni voce ha: label, icon, route, requires_auth, requires_enabled
    |
    | requires_auth: se true, visibile solo ad utenti autenticati
    | requires_enabled: se true, visibile solo se user.enabled = true
    |
    */
    'sidebar_menu' => [
        [
            'label' => 'Home',
            'icon' => 'home',
            'route' => 'home',
            'requires_auth' => false,
            'requires_enabled' => false,
        ],
        [
            'label' => 'Orders',
            'icon' => 'receipt_long',
            'route' => 'orders.index', // TODO: creare questa route
            'requires_auth' => true,
            'requires_enabled' => true,
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Labels Componenti
    |--------------------------------------------------------------------------
    |
    | Stringhe usate nei componenti UI.
    | Centralizzate per internazionalizzazione futura.
    |
    */
    'labels' => [
        'topbar' => [
            'appName' => 'Campus Truck',
            'tagline' => 'Student Service',
        ],
        'truck_status' => [
            'live_now' => 'LIVE NOW (TODAY)',
            'service_unavailable' => 'SERVICE NOT AVAILABLE',
            'coming_soon' => 'Coming soon',
            'physical_queue' => 'Physical Queue',
            'queue_wait_time' => 'Walk-up wait time',
        ],
        'scheduler' => [
            'title' => 'Schedule',
            'week_selector' => 'Week day selector',
        ],
        /*
        |--------------------------------------------------------------------------
        | Order Preview Card Labels
        |--------------------------------------------------------------------------
        |
        | Testi e label per la sezione "Your Orders for Today".
        | Utilizzati dal componente order-preview-card.blade.php
        |
        */
        'order_preview' => [
            'section_title' => 'Your Orders for Today',
            'view_all' => 'View All',
            'book_sandwich' => 'Book sandwich',
            'no_orders' => 'No orders yet',
            'login_cta' => 'Log in to book and track your orders',
            // Aria labels per accessibilità WCAG AAA
            'aria_login' => 'Go to login',
            'aria_empty' => 'Create a new order',
            'aria_orders' => 'View your orders',
            'aria_orders_count' => 'You have :count orders',
        ],
        /*
        |--------------------------------------------------------------------------
        | Order Status Labels
        |--------------------------------------------------------------------------
        |
        | Label degli stati degli ordini.
        | Utilizzati per costruire la statusLabel visualizzata nella card.
        |
        */
        'order_status' => [
            'pending' => 'PENDING',
            'confirmed' => 'CONFIRMED',
            'ready' => 'READY',
            'picked_up' => 'PICKED UP',
            'rejected' => 'REJECTED',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Icone Order Preview
    |--------------------------------------------------------------------------
    |
    | Icone Material Symbols per la Order Preview Card.
    |
    */
    'order_preview_icons' => [
        'receipt' => 'receipt_long',
        'chevron_right' => 'chevron_right',
        'arrow_forward' => 'arrow_forward',
        'login' => 'login',
        'add_circle' => 'add_circle',
    ],

    /*
    |--------------------------------------------------------------------------
    | Order Status Colors
    |--------------------------------------------------------------------------
    |
    | Colori associati agli stati degli ordini.
    | Utilizzati per personalizzare l'aspetto della card.
    |
    */
    'order_status_colors' => [
        'pending' => [
            'bg' => 'bg-amber-500/10',
            'text' => 'text-amber-500',
            'dot' => 'bg-amber-500',
        ],
        'confirmed' => [
            'bg' => 'bg-blue-500/10',
            'text' => 'text-blue-500',
            'dot' => 'bg-blue-500',
        ],
        'ready' => [
            'bg' => 'bg-emerald-500/10',
            'text' => 'text-emerald-500',
            'dot' => 'bg-emerald-500',
        ],
        'picked_up' => [
            'bg' => 'bg-slate-500/10',
            'text' => 'text-slate-400',
            'dot' => 'bg-slate-400',
        ],
        'rejected' => [
            'bg' => 'bg-rose-500/10',
            'text' => 'text-rose-500',
            'dot' => 'bg-rose-500',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Time Slot Card Configuration
    |--------------------------------------------------------------------------
    |
    | Configurazione per il componente TimeSlotCard riusabile.
    | Supporta variant="home" (con slots left + CTA) e variant="order" (selected/full/available).
    |
    */
    'time_slot' => [
        /*
        |--------------------------------------------------------------------------
        | Labels
        |--------------------------------------------------------------------------
        */
        'labels' => [
            'book_cta' => 'Book Slot',
            'selected' => 'Selected',
            'full' => 'Full',
            'available' => 'Available',
            'slots_left' => 'Slots left',
            'fully_booked' => 'Fully booked',
            'waitlist' => 'Waitlist',
        ],

        /*
        |--------------------------------------------------------------------------
        | Aria Labels (WCAG AAA)
        |--------------------------------------------------------------------------
        | 
        | Placeholder :time verrà sostituito con l'orario.
        | Placeholder :slots verrà sostituito con il numero di slot.
        |
        */
        'aria' => [
            'book_slot' => 'Book slot at :time, :slots slots left',
            'fully_booked' => 'Slot at :time is fully booked',
            'selected' => 'Pickup time :time, selected',
            'full' => 'Pickup time :time, full',
            'available' => 'Pickup time :time, available',
        ],

        /*
        |--------------------------------------------------------------------------
        | Soglie
        |--------------------------------------------------------------------------
        |
        | low_slots_threshold: sotto questa soglia si usa colore "urgenza" (amber).
        |
        */
        'low_slots_threshold' => 4,
    ],

    /*
    |--------------------------------------------------------------------------
    | Pre-book Section (Home)
    |--------------------------------------------------------------------------
    |
    | Configurazione per la sezione "Pre-book for Tomorrow" nella home.
    |
    */
    'prebook_section' => [
        'title' => 'Pre-book for Tomorrow',
        'aria_scroll' => 'Available time slots for booking',
    ],
];
