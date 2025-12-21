<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\TagModel;
use CodeIgniter\HTTP\ResponseInterface;

class TagController extends BaseController
{
    protected TagModel $model;

    public function __construct()
    {
        $this->model = new TagModel();
    }

    /**
     * GET /api/tags
     * 取得所有標籤列表
     */
    public function index(): ResponseInterface
    {
        $tags = $this->model->getAllTags();

        $result = array_map(function ($tag) {
            return $this->transformTag($tag);
        }, $tags);

        return $this->response->setJSON($result);
    }

    /**
     * GET /api/tags/stats
     * 取得標籤統計（含文章數量）
     */
    public function stats(): ResponseInterface
    {
        $stats = $this->model->getTagsWithCount();
        return $this->response->setJSON($stats);
    }

    /**
     * POST /api/tags
     * 建立新標籤
     */
    public function create(): ResponseInterface
    {
        $data = $this->request->getJSON(true);

        if (empty($data['name'])) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON(['error' => '標籤名稱為必填']);
        }

        $name = trim($data['name']);

        // 檢查是否已存在
        if ($this->model->nameExists($name)) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON(['error' => "標籤已存在: {$name}"]);
        }

        $tag = [
            'id' => $this->generateUUID(),
            'name' => $name,
            'slug' => $this->slugify($name),
            'created_at' => date('Y-m-d H:i:s'),
        ];

        if (!$this->model->insert($tag)) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON(['error' => $this->model->errors()]);
        }

        return $this->response
            ->setStatusCode(201)
            ->setJSON($this->transformTag($tag));
    }

    /**
     * DELETE /api/tags/:id
     * 刪除標籤
     */
    public function delete(string $id): ResponseInterface
    {
        $existing = $this->model->find($id);

        if (!$existing) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['error' => '標籤不存在']);
        }

        $this->model->delete($id);

        return $this->response
            ->setStatusCode(200)
            ->setJSON(['message' => '標籤已刪除']);
    }

    /**
     * 轉換標籤欄位為 camelCase
     */
    private function transformTag(array $tag): array
    {
        return [
            'id' => $tag['id'],
            'name' => $tag['name'],
            'slug' => $tag['slug'],
            'createdAt' => $tag['created_at'],
        ];
    }

    /**
     * 生成 UUID
     */
    private function generateUUID(): string
    {
        return sprintf(
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
    }

    /**
     * 將名稱轉換為 URL 友善的 slug
     */
    private function slugify(string $text): string
    {
        // 轉小寫
        $text = mb_strtolower($text, 'UTF-8');
        // 替換空格為連字符
        $text = preg_replace('/\s+/', '-', $text);
        // 移除特殊字元（保留中文、字母、數字、連字符）
        $text = preg_replace('/[^\p{L}\p{N}\-]/u', '', $text);
        // 移除連續連字符
        $text = preg_replace('/-+/', '-', $text);
        // 移除首尾連字符
        $text = trim($text, '-');

        return $text ?: 'tag';
    }
}
