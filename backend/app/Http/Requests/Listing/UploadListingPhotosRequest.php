<?php

namespace App\Http\Requests\Listing;

use Illuminate\Foundation\Http\FormRequest;

class UploadListingPhotosRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'room_id' => ['nullable', 'integer', 'exists:rooms,id'],
            'photos' => ['required_without:photo', 'nullable', 'array', 'min:1', 'max:10'],
            'photos.*' => ['file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
            'photo' => ['required_without:photos', 'nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],
        ];
    }
}
