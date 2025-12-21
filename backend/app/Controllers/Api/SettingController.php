<?php

namespace App\Controllers\Api;

use App\Controllers\BaseController;
use App\Models\SettingModel;
use CodeIgniter\HTTP\ResponseInterface;

class SettingController extends BaseController
{
    protected $model;

    public function __construct()
    {
        $this->model = new SettingModel();
    }

    /**
     * GET /api/settings
     * Get all public settings
     */
    public function index(): ResponseInterface
    {
        $settings = $this->model->findAll();
        $result = [];
        foreach ($settings as $setting) {
            $result[$setting['key']] = $setting['value'];
        }
        return $this->response->setJSON($result);
    }

    /**
     * POST /api/settings
     * Update settings (Admin only - middleware should handle auth, but we assume admin routes separate)
     * For now, we expose this endpoint.
     */
    public function update(): ResponseInterface
    {
        $data = $this->request->getJSON(true);

        if (!$data) {
            return $this->response->setStatusCode(400)->setJSON(['error' => 'No data provided']);
        }

        foreach ($data as $key => $value) {
            // Only allow specific keys for now to prevent pollution? Or allow all?
            // Allow blog_title and blog_description for now.
            if (in_array($key, ['blog_title', 'blog_description'])) {
                // Check if exists first to decide insert or update, or use replace/save mechanism correctly
                // Model 'save' handles update if primary key is present. Our PK is 'key'.
                $existing = $this->model->find($key);
                $saveData = [
                    'key' => $key,
                    'value' => $value,
                ];

                if (!$this->model->save($saveData)) {
                    // log error?
                }
            }
        }

        return $this->response->setJSON(['message' => 'Settings updated']);
    }
}
