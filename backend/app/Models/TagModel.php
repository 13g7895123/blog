<?php

namespace App\Models;

use CodeIgniter\Model;

class TagModel extends Model
{
    protected $table = 'tags';
    protected $primaryKey = 'id';
    protected $useAutoIncrement = false;
    protected $returnType = 'array';
    protected $useSoftDeletes = false;
    protected $protectFields = true;
    protected $allowedFields = ['id', 'name', 'slug', 'created_at'];

    // Dates
    protected $useTimestamps = false;
    protected $dateFormat = 'datetime';
    protected $createdField = 'created_at';

    // Validation
    protected $validationRules = [
        'name' => 'required|min_length[1]|max_length[100]',
        'slug' => 'required|min_length[1]|max_length[100]',
    ];
    protected $validationMessages = [
        'name' => [
            'required' => '標籤名稱為必填',
            'min_length' => '標籤名稱不能為空',
            'max_length' => '標籤名稱不能超過100字',
        ],
    ];
    protected $skipValidation = false;

    /**
     * 取得所有標籤，按名稱排序
     */
    public function getAllTags(): array
    {
        return $this->orderBy('name', 'ASC')->findAll();
    }

    /**
     * 依 slug 取得標籤
     */
    public function getBySlug(string $slug): ?array
    {
        return $this->where('slug', $slug)->first();
    }

    /**
     * 檢查標籤名稱是否已存在
     */
    public function nameExists(string $name): bool
    {
        return $this->where('LOWER(name)', strtolower($name))->countAllResults() > 0;
    }

    /**
     * 取得標籤統計（含文章數量）
     */
    public function getTagsWithCount(): array
    {
        $tags = $this->getAllTags();
        $articleModel = new ArticleModel();
        $articles = $articleModel->findAll();

        $result = [];
        foreach ($tags as $tag) {
            $count = 0;
            foreach ($articles as $article) {
                $tagIds = json_decode($article['tag_ids'] ?? '[]', true) ?: [];
                if (in_array($tag['id'], $tagIds)) {
                    $count++;
                }
            }
            $result[] = [
                'tag' => [
                    'id' => $tag['id'],
                    'name' => $tag['name'],
                    'slug' => $tag['slug'],
                ],
                'count' => $count,
            ];
        }

        // 按數量降冪排序
        usort($result, function ($a, $b) {
            return $b['count'] - $a['count'];
        });

        return $result;
    }
}
