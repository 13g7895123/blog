<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use CodeIgniter\HTTP\ResponseInterface;

class ViewsController extends BaseController
{
    protected $db;

    public function __construct()
    {
        $this->db = \Config\Database::connect();
    }

    /**
     * POST /api/views/:articleId
     * 記錄文章瀏覽
     */
    public function track(string $articleId): ResponseInterface
    {
        // 檢查文章是否存在
        $article = $this->db->table('articles')->where('id', $articleId)->get()->getRow();
        if (!$article) {
            return $this->response->setStatusCode(404)->setJSON(['error' => 'Article not found']);
        }

        // 記錄瀏覽
        $this->db->table('article_views')->insert([
            'article_id' => $articleId,
            'ip_address' => $this->request->getIPAddress(),
            'user_agent' => $this->request->getUserAgent()->getAgentString(),
            'viewed_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->response->setJSON(['message' => 'View tracked']);
    }

    /**
     * GET /api/views/stats
     * 取得瀏覽統計 (後台用)
     */
    public function stats(): ResponseInterface
    {
        // 今日瀏覽數
        $today = date('Y-m-d');
        $todayViews = $this->db->table('article_views')
            ->where('DATE(viewed_at)', $today)
            ->countAllResults();

        // 總瀏覽數
        $totalViews = $this->db->table('article_views')->countAllResults();

        // 熱門文章 (近7天)
        $weekAgo = date('Y-m-d', strtotime('-7 days'));
        $popularQuery = $this->db->table('article_views av')
            ->select('av.article_id, a.title, COUNT(*) as views')
            ->join('articles a', 'a.id = av.article_id')
            ->where('av.viewed_at >=', $weekAgo)
            ->groupBy('av.article_id, a.title')
            ->orderBy('views', 'DESC')
            ->limit(5)
            ->get();

        $popularArticles = [];
        foreach ($popularQuery->getResult() as $row) {
            $popularArticles[] = [
                'id' => $row->article_id,
                'title' => $row->title,
                'views' => (int)$row->views,
            ];
        }

        // 每日瀏覽趨勢 (近30天)
        $monthAgo = date('Y-m-d', strtotime('-30 days'));
        $dailyQuery = $this->db->table('article_views')
            ->select('DATE(viewed_at) as date, COUNT(*) as count')
            ->where('viewed_at >=', $monthAgo)
            ->groupBy('DATE(viewed_at)')
            ->orderBy('date', 'ASC')
            ->get();

        $dailyViews = [];
        $rawDaily = [];
        foreach ($dailyQuery->getResult() as $row) {
            $rawDaily[$row->date] = (int)$row->count;
        }

        // 填補缺失日期的數據為 0
        for ($i = 0; $i < 30; $i++) {
            $date = date('Y-m-d', strtotime("-$i days"));
            $dailyViews[$date] = $rawDaily[$date] ?? 0;
        }

        // 依照日期排序 (舊到新)
        ksort($dailyViews);

        return $this->response->setJSON([
            'todayViews' => $todayViews,
            'totalViews' => $totalViews,
            'popularArticles' => $popularArticles,
            'dailyViews' => $dailyViews,
        ]);
    }
}
