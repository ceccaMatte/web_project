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
];
