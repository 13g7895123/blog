<?php

namespace App\Models;

use CodeIgniter\Model;

class ArticleModel extends Model
{
    protected $table = 'articles';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = false;
    protected $returnType = 'array';
    protected $useSoftDeletes = false;
    protected $protectFields = true;
    protected $allowedFields = ['id', 'title', 'content', 'tag_ids', 'created_at', 'updated_at'];

    // Dates
    protected $useTimestamps = true;
    protected $dateFormat = 'datetime';
    protected $createdField = 'created_at';
    protected $updatedField = 'updated_at';

    // Validation
    protected $validationRules = [
        'title' => 'required|min_length[1]|max_length[255]',
        'content' => 'required|min_length[1]',
    ];
    protected $validationMessages = [
        'title' => [
            'required' => '標題為必填',
            'min_length' => '標題不能為空',
            'max_length' => '標題不能超過255字',
        ],
        'content' => [
            'required' => '內容為必填',
            'min_length' => '內容不能為空',
        ],
    ];
    protected $skipValidation = false;

    /**
     * 取得所有文章，按建立時間降冪排序
     */
    public function getAllArticles(): array
    {
        return $this->orderBy('created_at', 'DESC')->findAll();
    }

    /**
     * 取得文章摘要列表（含標籤資訊）
     */
    public function getArticleSummaries(): array
    {
        $articles = $this->getAllArticles();
        $tagModel = new TagModel();
        $allTags = $tagModel->findAll();
        $tagsById = [];
        foreach ($allTags as $tag) {
            $tagsById[$tag['id']] = $tag;
        }

        $summaries = [];
        foreach ($articles as $article) {
            $tagIds = json_decode($article['tag_ids'] ?? '[]', true) ?: [];
            $tags = [];
            foreach ($tagIds as $tagId) {
                if (isset($tagsById[$tagId])) {
                    $tag = $tagsById[$tagId];
                    $tags[] = [
                        'id' => $tag['id'],
                        'name' => $tag['name'],
                        'slug' => $tag['slug'],
                    ];
                }
            }

            // 生成摘要 (取前200字)
            $content = $article['content'];
            $excerpt = mb_substr(strip_tags($content), 0, 200);
            if (mb_strlen($content) > 200) {
                $excerpt .= '...';
            }

            $summaries[] = [
                'id' => $article['id'],
                'title' => $article['title'],
                'excerpt' => $excerpt,
                'createdAt' => $article['created_at'],
                'tags' => $tags,
            ];
        }

        return $summaries;
    }

    /**
     * 依標籤取得文章
     */
    public function getByTagId(string $tagId): array
    {
        $articles = $this->getAllArticles();
        $filtered = [];
        foreach ($articles as $article) {
            $tagIds = json_decode($article['tag_ids'] ?? '[]', true) ?: [];
            if (in_array($tagId, $tagIds)) {
                $filtered[] = $article;
            }
        }
        return $filtered;
    }
}
