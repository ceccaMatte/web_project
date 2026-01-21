<?php

namespace App\Domain\Errors;

// Transitions: pending is initial; rejected is final.
class InvalidOrderStateTransitionError extends DomainError
{
    private string $from;
    private string $to;

    public function __construct(string $from, string $to)
    {
        $this->from = $from;
        $this->to = $to;

        parent::__construct($this->message());
    }

    public function code(): string
    {
        return 'INVALID_STATE_TRANSITION';
    }

    public function message(): string
    {
        return "Transizione di stato non consentita: da '{$this->from}' a '{$this->to}'. Ricorda: non è possibile tornare a 'pending' e 'rejected' è uno stato finale.";
    }

    public function httpStatus(): int
    {
        return 422;
    }
}
