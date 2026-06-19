<?php

namespace App\Domain\Errors;

class UserDisabledError extends DomainError
{
    public function code(): string
    {
        return 'USER_DISABLED';
    }

    public function message(): string
    {
        return 'Il tuo account e bloccato: puoi consultare la piattaforma, ma non creare nuove prenotazioni.';
    }

    public function httpStatus(): int
    {
        return 403;
    }
}
