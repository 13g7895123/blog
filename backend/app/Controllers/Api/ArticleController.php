<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\ArticleModel;
use CodeIgniter\HTTP\ResponseInterface;

class ArticleController extends BaseController
{
    protected ArticleModel $model;

    public function __construct()
    {
        $this->model = new ArticleModel();
    }

    /**
     * GET /api/articles
     * 取得所有文章列表
     */
    public function index(): ResponseInterface
    {
        $articles = $this->model->getAllArticles();

        // 轉換欄位名稱為 camelCase
        $result = array_map(function ($article) {
            return $this->transformArticle($article);
        }, $articles);

        return $this->response->setJSON($result);
    }

    /**
     * GET /api/articles/summary
     * 取得文章摘要列表
     */
    public function summary(): ResponseInterface
    {
        $summaries = $this->model->getArticleSummaries();
        return $this->response->setJSON($summaries);
    }

    /**
     * GET /api/articles/:id
     * 取得單一文章
     */
    public function show(string $id): ResponseInterface
    {
        $article = $this->model->find($id);

        if (!$article) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['error' => '文章不存在']);
        }

        return $this->response->setJSON($this->transformArticle($article));
    }

    /**
     * POST /api/articles
     * 建立新文章
     */
    public function create(): ResponseInterface
    {
        $data = $this->request->getJSON(true);

        if (empty($data['title']) || empty($data['content'])) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON(['error' => '標題和內容為必填']);
        }

        $article = [
            'id' => $this->generateUUID(),
            'title' => trim($data['title']),
            'content' => trim($data['content']),
            'tag_ids' => json_encode($data['tagIds'] ?? []),
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        if (!$this->model->insert($article)) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON(['error' => $this->model->errors()]);
        }

        return $this->response
            ->setStatusCode(201)
            ->setJSON($this->transformArticle($article));
    }

    /**
     * PUT /api/articles/:id
     * 更新文章
     */
    public function update(string $id): ResponseInterface
    {
        $existing = $this->model->find($id);

        if (!$existing) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['error' => '文章不存在']);
        }

        $data = $this->request->getJSON(true);

        $updateData = [
            'updated_at' => date('Y-m-d H:i:s'),
        ];

        if (isset($data['title'])) {
            $updateData['title'] = trim($data['title']);
        }
        if (isset($data['content'])) {
            $updateData['content'] = trim($data['content']);
        }
        if (isset($data['tagIds'])) {
            $updateData['tag_ids'] = json_encode($data['tagIds']);
        }

        if (!$this->model->update($id, $updateData)) {
            return $this->response
                ->setStatusCode(400)
                ->setJSON(['error' => $this->model->errors()]);
        }

        $updated = $this->model->find($id);
        return $this->response->setJSON($this->transformArticle($updated));
    }

    /**
     * DELETE /api/articles/:id
     * 刪除文章
     */
    public function delete(string $id): ResponseInterface
    {
        $existing = $this->model->find($id);

        if (!$existing) {
            return $this->response
                ->setStatusCode(404)
                ->setJSON(['error' => '文章不存在']);
        }

        $this->model->delete($id);

        return $this->response
            ->setStatusCode(200)
            ->setJSON(['message' => '文章已刪除']);
    }

    /**
     * 轉換文章欄位為 camelCase
     */
    private function transformArticle(array $article): array
    {
        return [
            'id' => $article['id'],
            'title' => $article['title'],
            'content' => $article['content'],
            'tagIds' => json_decode($article['tag_ids'] ?? '[]', true) ?: [],
            'createdAt' => $article['created_at'],
            'updatedAt' => $article['updated_at'],
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
}
