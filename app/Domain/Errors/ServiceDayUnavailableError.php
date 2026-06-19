<?php

namespace App\Domain\Errors;

class ServiceDayUnavailableError extends DomainError
{
    public function code(): string
    {
        return 'SERVICE_DAY_UNAVAILABLE';
    }

    public function message(): string
    {
        return 'Il giorno di servizio selezionato non e attivo.';
    }

    public function httpStatus(): int
    {
        return 422;
    }
}
