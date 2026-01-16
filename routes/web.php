<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use App\Constants\MiddlewareAlias; // Import della classe MiddlewareAlias
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AdminWeeklyConfigurationController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\AuthController;

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
    
    // GET /orders - Lista ordini utente (TODO: implementare)
    Route::get('/orders', [OrderController::class, 'index'])
        ->name('orders.index');
    
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
});

