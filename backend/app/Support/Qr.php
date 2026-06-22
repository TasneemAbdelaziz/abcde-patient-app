<?php

namespace App\Support;

use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;

/**
 * Generates QR codes in-house (no third-party image service, so login tokens
 * never leave the hospital network). SVG output needs no GD/Imagick extension.
 */
class Qr
{
    /** Render $text as a QR and return an inline `data:image/svg+xml` URI. */
    public static function svgDataUri(string $text, int $size = 240): string
    {
        $writer = new Writer(new ImageRenderer(new RendererStyle($size, 1), new SvgImageBackEnd()));

        return 'data:image/svg+xml;base64,'.base64_encode($writer->writeString($text));
    }
}
