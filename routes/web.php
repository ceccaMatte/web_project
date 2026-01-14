<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Esempio di utilizzo del middleware 'admin'
// Questo gruppo di route sarà protetto dal middleware AdminMiddleware
// Solo utenti autenticati con ruolo 'admin' possono accedere
Route::middleware('admin')->group(function () {
    Route::get('/admin/dashboard', function () {
        return 'Benvenuto nella dashboard admin!';
    });

    Route::get('/admin/users', function () {
        return 'Lista utenti (solo per admin)';
    });
});
