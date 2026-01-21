<?php

namespace App\Domain\Errors;

// Slot full (max orders reached).
class SlotFullError extends DomainError
{
    public function code(): string
    {
        return 'SLOT_FULL';
    }

    public function message(): string
    {
        return 'Lo slot orario selezionato ha raggiunto il numero massimo di ordini. Scegli un altro orario.';
    }

    public function httpStatus(): int
    {
        return 409;
    }
}
