<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Validazione input
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Tentativo login
        if (Auth::attempt(['email' => $validated['email'], 'password' => $validated['password']], $request->filled('remember'))) {
            $request->session()->regenerate();

            // Redirect diverso per admin
            $user = Auth::user();
            $redirectUrl = $user->role === 'admin' 
                ? route('admin.work-service') 
                : route('home');

            return response()->json([
                'success' => true,
                'redirect' => $redirectUrl,
            ]);
        }

        // Login fallito
        return response()->json([
            'success' => false,
            'message' => 'Invalid email or password',
        ], 401);
    }

    public function register(Request $request)
    {
        // Validazione input
        $validated = $request->validate([
            'nickname' => ['required', 'string', 'min:3', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        // Creazione utente (name = nickname per compatibilità Laravel Auth)
        $user = User::create([
            'name' => $validated['nickname'],
            'nickname' => $validated['nickname'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
        ]);

        // Login automatico dopo registrazione
        Auth::login($user);
        $request->session()->regenerate();

        // Gli utenti registrati sono sempre 'user', non admin
        return response()->json([
            'success' => true,
            'redirect' => route('home'),
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }
}
