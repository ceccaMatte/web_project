<?php

namespace App\Domain\Errors;

// Thrown when order is not modifiable (not pending).
class OrderNotModifiableError extends DomainError
{
    public function code(): string
    {
        return 'ORDER_NOT_MODIFIABLE';
    }

    public function message(): string
    {
        return 'L\'ordine non può essere modificato perché non è più in stato "in attesa". Contatta il supporto per assistenza.';
    }

    public function httpStatus(): int
    {
        return 422;
    }
}
