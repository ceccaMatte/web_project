<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Constants\MiddlewareAlias; // Import della classe MiddlewareAlias
use App\Http\Controllers\OrderController;
use App\Http\Controllers\OrderFormController;
use App\Http\Controllers\AdminWeeklyConfigurationController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\AdminWorkServiceController;

// ========================================
// AUTH ROUTES
// ========================================

// Auth views
Route::get('/login', function () {
    return view('pages.auth');
})->name('login')->middleware('guest');

Route::get('/register', function () {
    return view('pages.auth');
})->name('register')->middleware('guest');

// Auth API endpoints
Route::post('/login', [AuthController::class, 'login'])->middleware('guest');
Route::post('/register', [AuthController::class, 'register'])->middleware('guest');
Route::post('/logout', [AuthController::class, 'logout'])->name('logout')->middleware('auth');

// ========================================
// HOME PUBBLICA
// ========================================
// Route principale: mostra working days, slot, info
// NON richiede autenticazione (pubblica)
Route::get('/', [HomeController::class, 'index'])
    ->name('home');

// API endpoint per dati home page (con sessione)
Route::get('/api/home', [HomeController::class, 'apiIndex'])
    ->name('api.home');

// API endpoint per time slots dinamici
// GET /api/time-slots?date=YYYY-MM-DD
Route::get('/api/time-slots', [HomeController::class, 'getTimeSlots'])
    ->name('api.time-slots');

// ========================================
// PLACEHOLDER: Welcome originale (da rimuovere)
// ========================================
Route::get('/welcome', function () {
    return view('welcome');
});

// ========================================
// ROUTES ORDINI UTENTE
// ========================================
// Protette da middleware auth: solo utenti autenticati
Route::middleware('auth')->group(function () {
    
    // GET /orders - Pagina ordini utente
    Route::get('/orders', [OrderController::class, 'index'])
        ->name('orders.index');
    
    // ========================================
    // ORDER FORM (Create / Modify) - STESSA PAGINA
    // ========================================
    
    // GET /orders/create - Pagina creazione ordine
    Route::get('/orders/create', [OrderFormController::class, 'create'])
        ->name('orders.create');
    
    // GET /orders/{order}/edit - Pagina modifica ordine
    Route::get('/orders/{order}/edit', [OrderFormController::class, 'edit'])
        ->name('orders.edit');
    
    // API Order Form
    // GET /api/orders/form/create?date=YYYY-MM-DD
    Route::get('/api/orders/form/create', [OrderFormController::class, 'apiCreate'])
        ->name('api.orders.form.create');
    
    // GET /api/orders/{order}/form
    Route::get('/api/orders/{order}/form', [OrderFormController::class, 'apiModify'])
        ->name('api.orders.form.modify');
    
    // GET /api/orders/form/availability?date=YYYY-MM-DD
    Route::get('/api/orders/form/availability', [OrderFormController::class, 'apiAvailability'])
        ->name('api.orders.form.availability');
    
    // ========================================
    // API ORDINI (con sessione, protette da auth)
    // ========================================
    
    // GET /api/orders/init - Inizializzazione pagina ordini
    Route::get('/api/orders/init', [OrderController::class, 'apiInit'])
        ->name('api.orders.init');
    
    // GET /api/orders - Ordini attivi per data
    // Query: ?date=YYYY-MM-DD
    Route::get('/api/orders', [OrderController::class, 'apiActiveOrders'])
        ->name('api.orders.active');
    
    // GET /api/orders/recent - Storico ordini recenti
    Route::get('/api/orders/recent', [OrderController::class, 'apiRecentOrders'])
        ->name('api.orders.recent');
    
    // POST /orders - Crea un nuovo ordine
    // Body: { time_slot_id: 1, ingredients: [1, 3, 5] }
    Route::post('/orders', [OrderController::class, 'store'])
        ->name('orders.store');
    
    // PUT /orders/{order} - Aggiorna un ordine (solo se pending)
    // Body: { ingredients: [1, 3, 5] }
    Route::put('/orders/{order}', [OrderController::class, 'update'])
        ->name('orders.update');
    
    // DELETE /orders/{order} - Elimina un ordine (solo se pending)
    Route::delete('/orders/{order}', [OrderController::class, 'destroy'])
        ->name('orders.destroy');
    
    // ========================================
    // API PREFERITI (con sessione, protette da auth)
    // ========================================
    
    // POST /api/favorites/toggle - Toggle preferito per configurazione
    Route::post('/api/favorites/toggle', [FavoriteController::class, 'toggle'])
        ->name('api.favorites.toggle');
});

// ========================================
// ROUTES ADMIN
// ========================================
// Protette da middleware admin: solo utenti admin
Route::middleware(MiddlewareAlias::ADMIN)->group(function () {
    
    Route::get('/admin/dashboard', function () {
        return 'Benvenuto nella dashboard admin!';
    });

    Route::get('/admin/users', function () {
        return 'Lista utenti (solo per admin)';
    });

    // Route per la configurazione settimanale
    // Permette all'admin di configurare i giorni lavorativi futuri
    Route::post('/admin/weekly-configuration', [AdminWeeklyConfigurationController::class, 'updateWeeklyConfiguration'])
        ->name('admin.weekly-configuration.update');

    // PUT /admin/orders/{order}/status - Cambia stato di un ordine
    // Body: { status: "confirmed" }
    Route::put('/admin/orders/{order}/status', [OrderController::class, 'changeStatus'])
        ->name('admin.orders.changeStatus');

    // ========================================
    // ADMIN WORK SERVICE
    // ========================================
    // Pagina gestione operativa ordini in tempo reale
    
    // GET /admin/work-service - Vista pagina Work Service
    Route::get('/admin/work-service', [AdminWorkServiceController::class, 'index'])
        ->name('admin.work-service');
    
    // GET /api/admin/work-service?date=YYYY-MM-DD - Fetch dati iniziale
    Route::get('/api/admin/work-service', [AdminWorkServiceController::class, 'apiIndex'])
        ->name('api.admin.work-service');
    
    // GET /api/admin/work-service/poll?date=YYYY-MM-DD - Polling endpoint
    Route::get('/api/admin/work-service/poll', [AdminWorkServiceController::class, 'apiPoll'])
        ->name('api.admin.work-service.poll');
    
    // POST /api/admin/orders/{order}/status - Cambia stato ordine
    Route::post('/api/admin/orders/{order}/status', [AdminWorkServiceController::class, 'changeStatus'])
        ->name('api.admin.orders.changeStatus');
});

