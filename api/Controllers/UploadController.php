<?php

namespace Api\Controllers;

use Api\Context;
use Api\Models\Upload;

class UploadController extends BaseController
{
    public function index(Context $ctx)
    {


        $page = max(1, (int)($ctx->query('page') ?? 1));
        $limit = max(1, min(100, (int)($ctx->query('limit') ?? 20)));
        $offset = ($page - 1) * $limit;

        $query = Upload::query()->select(['uploads.*']);

        // Filters
        if ($userId = $ctx->query('user_id')) {
            $query->where('uploads.user_id', $userId);
        }
        if ($filename = $ctx->query('filename')) {
            $query->where('uploads.filename', 'like', '%' . $filename . '%');
        }

        $uploads = $query
            ->orderBy('uploads.created_at', 'desc')
            ->limit($limit)
            ->offset($offset)
            ->get();

        $total = Upload::query()->count();

        return $this->ok($ctx, [
            'data' => $uploads,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ]);
    }

    public function store(Context $ctx)
    {
        try {


            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                return $this->badRequest($ctx, 'No file uploaded or upload error');
            }

            $file = $_FILES['file'];
            $tmpName = $file['tmp_name'];
            $originalName = basename($file['name']);
            $fileSize = $file['size'];
            $mimeType = $file['type'];

            // Calculate file hash
            $fileHash = hash_file('sha256', $tmpName);

            // Check if file already exists
            $existing = Upload::query()->where('hash', $fileHash)->first();

            if ($existing) {
                return $this->ok($ctx, [
                    'id' => $existing['id'],
                    'hash' => $existing['hash'],
                    'preview_url' => $this->baseUrl('assets/' . $existing['storage_path']),
                    'original_name' => $existing['original_name'],
                    'mime_type' => $existing['mime_type'],
                    'storage_path' => $existing['storage_path'],
                    'size' => $existing['size']
                ]);
            }

            // Get file extension
            $extension = pathinfo($originalName, PATHINFO_EXTENSION);

            // Storage path is {hash}.{extension}
            $storagePath = $fileHash . ($extension ? '.' . $extension : '');
            $uploadDir = __DIR__ . '/../../uploads/';

            if (!is_dir($uploadDir)) {
                mkdir($uploadDir, 0755, true);
            }

            $fullPath = $uploadDir . $storagePath;

            if (!move_uploaded_file($tmpName, $fullPath)) {
                return $this->error($ctx, 'Failed to save file', 500);
            }

            // Generate UUID for id
            $id = sprintf(
                '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
                mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0x0fff) | 0x4000,
                mt_rand(0, 0x3fff) | 0x8000,
                mt_rand(0, 0xffff),
                mt_rand(0, 0xffff),
                mt_rand(0, 0xffff)
            );

            $upload = new Upload([
                'id' => $id,
                'hash' => $fileHash,
                'original_name' => $originalName,
                'mime_type' => $mimeType,
                'extension' => $extension,
                'size' => $fileSize,
                'storage_path' => $storagePath
            ]);
            $upload->save();

            return $this->created($ctx, [
                'id' => $id,
                'hash' => $fileHash,
                'preview_url' => $this->baseUrl('assets/' . $storagePath),
                'original_name' => $originalName,
                'mime_type' => $mimeType,
                'storage_path' => $storagePath,
                'size' => $fileSize
            ]);
        }
        catch (\Exception $e) {
            return $this->json($ctx, [
                'error' => true,
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    public function show(Context $ctx)
    {


        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var Upload|null $upload */
        $upload = Upload::find($id);
        if (!$upload)
            return $this->notFound($ctx, 'Upload not found');

        return $this->ok($ctx, $upload->toArray());
    }

    public function update(Context $ctx)
    {
        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var Upload|null $upload */
        $upload = Upload::find($id);
        if (!$upload)
            return $this->notFound($ctx, 'Upload not found');

        $data = $this->input();

        // Prevent Mass Assignment - Only allow updating safe metadata
        $allowed = ['original_name'];

        foreach ($data as $k => $v) {
            if (in_array($k, $allowed)) {
                $upload->$k = $v;
            }
        }
        $upload->save();

        return $this->ok($ctx, $upload->toArray());
    }

    public function destroy(Context $ctx)
    {


        $id = (int)($ctx->param('id') ?? 0);
        if (!$id)
            return $this->badRequest($ctx, 'Invalid id');

        /** @var Upload|null $upload */
        $upload = Upload::find($id);
        if (!$upload)
            return $this->notFound($ctx, 'Upload not found');

        $upload->delete();

        return $this->ok($ctx, ['deleted' => true]);
    }
}
