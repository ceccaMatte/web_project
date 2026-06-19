<?php

namespace App\Domain\Errors;

class IngredientUnavailableError extends DomainError
{
    public function __construct(private readonly string $ingredientNames = '')
    {
        parent::__construct();
    }

    public function code(): string
    {
        return 'INGREDIENT_UNAVAILABLE';
    }

    public function message(): string
    {
        if ($this->ingredientNames !== '') {
            return "Alcuni ingredienti non sono disponibili per il giorno selezionato: {$this->ingredientNames}.";
        }

        return 'Alcuni ingredienti non sono disponibili per il giorno selezionato.';
    }

    public function httpStatus(): int
    {
        return 422;
    }
}
