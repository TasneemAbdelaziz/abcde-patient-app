<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AccessibilitySettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'patient_serial' => $this->patient_serial,
            'high_contrast' => (bool) $this->high_contrast,
            'screen_reader' => (bool) $this->screen_reader,
            'text_to_speech' => (bool) $this->text_to_speech,
            'captions' => (bool) $this->captions,
            'haptics' => (bool) $this->haptics,
            'simple_mode' => (bool) $this->simple_mode,
            'font_scale' => $this->font_scale,
            'extra' => $this->extra,
        ];
    }
}
