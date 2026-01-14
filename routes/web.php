<?php

use Illuminate\Support\Facades\Route;
use App\Constants\MiddlewareAlias; // Import della classe MiddlewareAlias

Route::get('/', function () {
    return view('welcome');
});

// Esempio di utilizzo del middleware 'admin'
// Questo gruppo di route sarà protetto dal middleware AdminMiddleware
// Solo utenti autenticati con ruolo 'admin' possono accedere
Route::middleware(MiddlewareAlias::ADMIN)->group(function () {
    Route::get('/admin/dashboard', function () {
        return 'Benvenuto nella dashboard admin!';
    });

    Route::get('/admin/users', function () {
        return 'Lista utenti (solo per admin)';
    });

    // Route per la configurazione settimanale
    // Permette all'admin di configurare i giorni lavorativi futuri
    Route::post('/admin/weekly-configuration', [App\Http\Controllers\AdminWeeklyConfigurationController::class, 'updateWeeklyConfiguration'])
        ->name('admin.weekly-configuration.update');
});
