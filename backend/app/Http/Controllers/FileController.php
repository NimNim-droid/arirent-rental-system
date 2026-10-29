<?php

namespace App\Http\Controllers;

use App\Support\PrivateFile;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FileController extends Controller
{
    /**
     * Serve a private upload. Access is granted by the URL signature.
     */
    public function show(string $path): StreamedResponse
    {
        return PrivateFile::response($path);
    }
}
