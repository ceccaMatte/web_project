<?php

use App\Http\Controllers\FavoriteController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\OrderController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Home API - accessibile sia per guest che per utenti autenticati
Route::get('/home', [HomeController::class, 'apiIndex']);

// ============================================================================
// Orders API
// ============================================================================

// Dati iniziali pagina ordini (richiede autenticazione)
Route::middleware('auth')->group(function () {
    Route::get('/orders/init', [OrderController::class, 'apiInit']);
    Route::get('/orders', [OrderController::class, 'apiActiveOrders']);
    Route::get('/orders/recent', [OrderController::class, 'apiRecentOrders']);
});

// ============================================================================
// Favorites API
// ============================================================================

// Toggle preferito (richiede autenticazione)
Route::middleware('auth')->group(function () {
    Route::post('/favorites/toggle', [FavoriteController::class, 'toggle']);
});