<?php

namespace App\Domain\Errors;

use Exception;

abstract class DomainError extends Exception
{
    abstract public function code(): string;

    abstract public function message(): string;

    abstract public function httpStatus(): int;
}
