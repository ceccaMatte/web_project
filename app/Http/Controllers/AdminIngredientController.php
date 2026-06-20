<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\IngredientAvailability;
use App\Models\WorkingDay;
use App\Services\IngredientAvailabilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class AdminIngredientController extends Controller
{
    private const CATEGORIES = ['bread', 'meat', 'cheese', 'vegetable', 'sauce', 'other'];

    public function __construct(
        private IngredientAvailabilityService $ingredientAvailabilityService
    ) {}

    public function index(): View
    {
        $user = auth()->user();

        return view('pages.admin-ingredients', [
            'user' => [
                'authenticated' => true,
                'name' => $user->name,
                'nickname' => $user->nickname,
                'role' => $user->role,
            ],
        ]);
    }

    public function apiIndex(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'date' => ['nullable', 'date_format:Y-m-d'],
        ]);

        $selectedDate = $validated['date'] ?? now()->toDateString();
        $workingDay = WorkingDay::whereDate('day', $selectedDate)->first();

        $ingredients = $this->ingredientAvailabilityService
            ->ingredientsWithEffectiveAvailability($workingDay)
            ->map(fn (array $row) => [
                'id' => $row['ingredient']->id,
                'name' => $row['ingredient']->name,
                'code' => $row['ingredient']->code,
                'category' => $row['ingredient']->category,
                'global_available' => $row['ingredient']->is_available,
                'daily_available' => $row['available'],
                'override_available' => $row['override_available'],
            ])
            ->values();

        Log::debug('Admin ingredients index loaded', [
            'user_id' => $request->user()?->id,
            'selected_date' => $selectedDate,
            'working_day_id' => $workingDay?->id,
            'ingredient_count' => $ingredients->count(),
        ]);

        return response()->json([
            'selected_date' => $selectedDate,
            'working_day' => $workingDay ? [
                'id' => $workingDay->id,
                'date' => $workingDay->day->toDateString(),
                'location' => $workingDay->location,
                'is_active' => $workingDay->is_active,
            ] : null,
            'categories' => self::CATEGORIES,
            'ingredients' => $ingredients,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateIngredientPayload($request, 'store');

        $ingredient = Ingredient::create([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'category' => $validated['category'],
            'is_available' => $validated['is_available'] ?? false,
        ]);

        if (isset($validated['working_day_id'])) {
            IngredientAvailability::updateOrCreate(
                [
                    'ingredient_id' => $ingredient->id,
                    'working_day_id' => $validated['working_day_id'],
                ],
                [
                    'is_available' => $validated['daily_available'] ?? true,
                ]
            );
        }

        Log::info('Admin ingredient created', [
            'user_id' => $request->user()?->id,
            'ingredient_id' => $ingredient->id,
            'working_day_id' => $validated['working_day_id'] ?? null,
            'daily_available' => $validated['daily_available'] ?? null,
        ]);

        return response()->json([
            'ingredient' => $ingredient,
        ], 201);
    }

    public function update(Request $request, Ingredient $ingredient): JsonResponse
    {
        $validated = $this->validateIngredientPayload($request, 'update', $ingredient);

        $ingredient->update([
            'name' => $validated['name'],
            'code' => $validated['code'],
            'category' => $validated['category'],
            'is_available' => $validated['is_available'] ?? $ingredient->is_available,
        ]);

        if (isset($validated['working_day_id'])) {
            IngredientAvailability::updateOrCreate(
                [
                    'ingredient_id' => $ingredient->id,
                    'working_day_id' => $validated['working_day_id'],
                ],
                [
                    'is_available' => $validated['daily_available'] ?? true,
                ]
            );
        }

        Log::info('Admin ingredient updated', [
            'user_id' => $request->user()?->id,
            'ingredient_id' => $ingredient->id,
            'working_day_id' => $validated['working_day_id'] ?? null,
            'daily_available' => $validated['daily_available'] ?? null,
        ]);

        return response()->json([
            'ingredient' => $ingredient->fresh(),
        ]);
    }

    public function destroy(Ingredient $ingredient): JsonResponse
    {
        $ingredient->delete();

        return response()->json([
            'message' => 'Ingrediente eliminato.',
        ]);
    }

    public function updateAvailability(Request $request, Ingredient $ingredient): JsonResponse
    {
        Log::debug('Admin ingredient availability incoming', [
            'user_id' => $request->user()?->id,
            'ingredient_id' => $ingredient->id,
            'payload' => $request->only(['working_day_id', 'is_available']),
        ]);

        try {
            $validated = $request->validate([
                'working_day_id' => ['required', 'integer', 'exists:working_days,id'],
                'is_available' => ['required', 'boolean'],
            ]);
        } catch (ValidationException $exception) {
            Log::warning('Admin ingredient availability validation failed', [
                'user_id' => $request->user()?->id,
                'ingredient_id' => $ingredient->id,
                'payload' => $request->only(['working_day_id', 'is_available']),
                'errors' => $exception->errors(),
            ]);

            throw $exception;
        }

        IngredientAvailability::updateOrCreate(
            [
                'ingredient_id' => $ingredient->id,
                'working_day_id' => $validated['working_day_id'],
            ],
            [
                'is_available' => $validated['is_available'],
            ]
        );

        Log::info('Admin ingredient availability updated', [
            'user_id' => $request->user()?->id,
            'ingredient_id' => $ingredient->id,
            'working_day_id' => $validated['working_day_id'],
            'is_available' => $validated['is_available'],
        ]);

        return response()->json([
            'ingredient_id' => $ingredient->id,
            'working_day_id' => $validated['working_day_id'],
            'is_available' => $validated['is_available'],
        ]);
    }

    private function validateIngredientPayload(Request $request, string $action, ?Ingredient $ingredient = null): array
    {
        $payload = $request->only([
            'name',
            'code',
            'category',
            'is_available',
            'working_day_id',
            'daily_available',
        ]);

        Log::debug("Admin ingredient {$action} incoming", [
            'user_id' => $request->user()?->id,
            'ingredient_id' => $ingredient?->id,
            'payload' => $payload,
        ]);

        try {
            $validated = $request->validate($this->rules($ingredient));
        } catch (ValidationException $exception) {
            Log::warning("Admin ingredient {$action} validation failed", [
                'user_id' => $request->user()?->id,
                'ingredient_id' => $ingredient?->id,
                'payload' => $payload,
                'errors' => $exception->errors(),
            ]);

            throw $exception;
        }

        Log::debug("Admin ingredient {$action} validated", [
            'user_id' => $request->user()?->id,
            'ingredient_id' => $ingredient?->id,
            'validated' => $validated,
        ]);

        return $validated;
    }

    private function rules(?Ingredient $ingredient = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => [
                'required',
                'string',
                'max:64',
                Rule::unique('ingredients', 'code')->ignore($ingredient?->id),
            ],
            'category' => ['required', Rule::in(self::CATEGORIES)],
            'is_available' => ['sometimes', 'boolean'],
            'working_day_id' => ['nullable', 'integer', 'exists:working_days,id'],
            'daily_available' => ['sometimes', 'boolean'],
        ];
    }
}
