<?php

namespace App\Domain\Errors;

// Access to another user's order is forbidden.
class UnauthorizedOrderAccessError extends DomainError
{
    public function code(): string
    {
        return 'UNAUTHORIZED_ORDER_ACCESS';
    }

    public function message(): string
    {
        return 'Non sei autorizzato ad accedere o modificare questo ordine.';
    }

    public function httpStatus(): int
    {
        return 403;
    }
}
