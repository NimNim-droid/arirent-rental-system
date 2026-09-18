@echo off
title AriRent API - Fast Native Server
echo ================================================================
echo   AriRent Rental Management System - Local Backend Server
echo ================================================================
echo.
echo Starting Laravel with native Windows PHP on port 3001...
echo Connecting to MySQL on 127.0.0.1:3306...
echo.

set DB_HOST=127.0.0.1
set DB_PORT=3306

php artisan serve --port 3001 --host 127.0.0.1
pause
