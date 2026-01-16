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
            'section_title_guest' => 'Track your orders',
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

    /*
    |--------------------------------------------------------------------------
    | Auth Page Configuration
    |--------------------------------------------------------------------------
    |
    | Stringhe e configurazione per la pagina di autenticazione.
    | Usate dai componenti Blade auth/*.
    |
    */
    'auth' => [
        // Brand
        'app_name' => 'Campus Truck',
        'tagline' => 'Crafting your perfect break, one sandwich at a time.',
        
        // Icons
        'logo_icon' => 'local_shipping',
        
        // Tab labels
        'login' => 'Login',
        'signup' => 'Sign Up',
        
        // Form field labels
        'email_label' => 'University Email',
        'password_label' => 'Password',
        'nickname_label' => 'Nickname',
        
        // Placeholders
        'email_placeholder' => 'name@university.edu',
        'password_placeholder' => '••••••••',
        'nickname_placeholder' => 'Your preferred name',
        
        // Submit buttons
        'submit_login' => 'LOGIN',
        'submit_signup' => 'CREATE ACCOUNT',
        
        // Switch prompts
        'switch_to_signup' => 'Create account',
        'switch_to_login' => 'Already have an account?',
        
        // Footer
        'footer_text' => 'By continuing, you agree to our',
        'terms_link' => 'Terms of Service',
        'privacy_link' => 'Privacy Policy',
        
        // Validation messages
        'validation' => [
            'email_invalid' => 'Please enter a valid email',
            'password_short' => 'Password must be at least 8 characters',
            'nickname_short' => 'Nickname must be at least 3 characters',
            'required_field' => 'This field is required',
        ],
        
        // Server errors
        'errors' => [
            'invalid_credentials' => 'Invalid email or password',
            'email_taken' => 'This email is already registered',
            'server_error' => 'Something went wrong. Please try again.',
        ],
    ],

    /*
    |--------------------------------------------------------------------------
    | Orders Page Configuration
    |--------------------------------------------------------------------------
    |
    | Stringhe e configurazione per la pagina "Your Orders".
    | Usate dai componenti Blade orders/*.
    |
    */
    'orders' => [
        // Header
        'page_title' => 'Your Orders',
        'brand_label' => 'Campus Truck',
        
        // Sezione Active Orders
        'active_orders' => [
            'title' => 'Active Orders',
            'empty_message' => 'Hungry? No active orders for today.',
            'order_now_cta' => 'Order Now',
            'modify_cta' => 'Modify Order',
            'show_more' => 'Show more',
            'show_less' => 'Show less',
        ],
        
        // Sezione Recently Ordered
        'recent_orders' => [
            'title' => 'Recently Ordered',
            'view_all' => 'View All',
            'reorder_cta' => 'Reorder',
            'favorites_only' => 'Favorites only',
            'no_recent' => 'No recent orders yet.',
        ],
        
        // Status badges
        'status_labels' => [
            'pending' => 'PENDING',
            'confirmed' => 'CONFIRMED',
            'ready' => 'READY',
            'picked_up' => 'PICKED UP',
            'rejected' => 'REJECTED',
        ],
        
        // Icone
        'icons' => [
            'header' => 'receipt_long',
            'back' => 'arrow_back_ios',
            'empty' => 'shopping_basket',
            'add' => 'add',
            'reorder' => 'refresh',
            'favorite' => 'star',
            'favorite_outline' => 'star_outline',
            'expand_more' => 'expand_more',
            'expand_less' => 'expand_less',
            'edit' => 'edit',
        ],
        
        // Aria labels per accessibilità WCAG AAA
        'aria' => [
            'back_to_home' => 'Go back to home',
            'toggle_favorites' => 'Toggle favorites filter',
            'show_more_ingredients' => 'Show all ingredients',
            'show_less_ingredients' => 'Collapse ingredients',
            'reorder' => 'Reorder this sandwich',
            'modify_order' => 'Modify this order',
            'add_to_favorites' => 'Add to favorites',
            'remove_from_favorites' => 'Remove from favorites',
            'order_now' => 'Create a new order',
            'active_orders_section' => 'Your active orders for today',
            'recent_orders_section' => 'Your recent orders history',
            'order_carousel' => 'Scroll through your active orders',
        ],
    ],
];
