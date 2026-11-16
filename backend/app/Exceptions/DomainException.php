<?php

namespace App\Exceptions;

use RuntimeException;

/**
 * Domain-level exception thrown by application services for expected business
 * rule failures, without coupling services directly to HTTP transport classes.
 */
class DomainException extends RuntimeException
{
    public function __construct(
        string $message,
        protected int $statusCode = 422,
        ?\Throwable $previous = null
    ) {
        parent::__construct($message, $statusCode, $previous);
    }

    public function getStatusCode(): int
    {
        return $this->statusCode;
    }
}

