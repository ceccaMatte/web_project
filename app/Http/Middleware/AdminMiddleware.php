<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Constants\Role; // Import della classe Role per usare le costanti

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * Questo metodo è il cuore del middleware. Viene chiamato automaticamente da Laravel
     * per ogni richiesta HTTP che passa attraverso questo middleware.
     * Il suo scopo è controllare se l'utente può accedere alla risorsa richiesta.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     *         $next è una funzione che rappresenta il "prossimo" passo nella pipeline delle richieste.
     *         Se il controllo passa, chiamiamo $next($request) per continuare l'elaborazione
     *         (ad esempio, raggiungere il controller). Se fallisce, restituiamo una risposta di errore.
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Prima controllo: l'utente deve essere autenticato
        // auth()->check() verifica se esiste una sessione utente valida
        // Se l'utente non è loggato, blocchiamo immediatamente con errore 401 (Unauthorized)
        if (!auth()->check()) {
            abort(401, 'Accesso negato: devi essere autenticato per accedere a questa risorsa.');
        }

        // Secondo controllo: l'utente autenticato deve avere ruolo 'admin'
        // auth()->user() restituisce l'istanza dell'utente corrente
        // Accediamo al campo 'role' del modello User
        // Confrontiamo con Role::ADMIN per evitare errori di digitazione
        // Se il ruolo non è 'admin', blocchiamo con errore 403 (Forbidden)
        if (auth()->user()->role !== Role::ADMIN) {
            abort(403, 'Accesso negato: solo gli amministratori possono accedere a questa risorsa.');
        }

        // Se tutti i controlli passano, proseguiamo con la richiesta
        // $next($request) esegue il resto della pipeline (controller, altri middleware, ecc.)
        // e restituisce la risposta finale
        return $next($request);
    }
}
