<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'AriRent API',
        'status' => 'online',
    ]);
});
