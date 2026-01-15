<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Constants\MiddlewareAlias; // Import della classe MiddlewareAlias

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Registrazione del middleware personalizzato 'admin'
        // Questo permette di usare MiddlewareAlias::ADMIN come alias nelle route
        // Ad esempio: Route::middleware(MiddlewareAlias::ADMIN)->get('/admin', ...)
        $middleware->alias([
            MiddlewareAlias::ADMIN => \App\Http\Middleware\AdminMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
