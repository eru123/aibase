<?php

declare(strict_types=1);

namespace Api\Models;

class Upload extends BaseModel
{
    protected static string $table = 'uploads';

    protected function getFillable(): array
    {
        return ['id', 'hash', 'original_name', 'mime_type', 'extension', 'size', 'storage_path'];
    }

    public function getUrl(): string
    {
        return $this->baseUrl('/assets/' . $this->storage_path);
    }

    public function toArray(): array
    {
        $res = parent::toArray();
        $res['url'] = $this->getUrl();
        return $res;
    }
}
