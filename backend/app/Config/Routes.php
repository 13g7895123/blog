<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');

/*
 * API Routes
 */
$routes->group('api', ['namespace' => 'App\Controllers\Api'], function ($routes) {
    // Articles
    $routes->get('articles/summary', 'ArticleController::summary');
    $routes->get('articles', 'ArticleController::index');
    $routes->get('articles/(:segment)', 'ArticleController::show/$1');
    $routes->get('articles/(:segment)', 'ArticleController::show/$1');

    // Tags
    $routes->get('tags/stats', 'TagController::stats');
    $routes->get('tags', 'TagController::index');
    $routes->get('tags', 'TagController::index');

    // Auth
    $routes->post('auth/login', 'AuthController::login');
    $routes->post('auth/logout', 'AuthController::logout');
    $routes->get('auth/me', 'AuthController::me');

    // System
    $routes->get('system/tables', 'SystemController::tables');
    $routes->get('system/health', 'SystemController::health');

    // Views (public track, protected stats)
    $routes->post('views/(:segment)', 'ViewsController::track/$1');
    $routes->get('views/stats', 'ViewsController::stats');
});

// Protected Routes (Apply Auth Filter)
$routes->group('api', ['namespace' => 'App\Controllers\Api', 'filter' => 'auth'], function ($routes) {
    // Articles (Write)
    $routes->post('articles', 'ArticleController::create');
    $routes->put('articles/(:segment)', 'ArticleController::update/$1');
    $routes->delete('articles/(:segment)', 'ArticleController::delete/$1');

    // Tags (Write)
    $routes->post('tags', 'TagController::create');
    $routes->delete('tags/(:segment)', 'TagController::delete/$1');

    // Uploads
    $routes->post('upload', 'UploadController::index');
});

// Public Routes (Comments)
$routes->get('api/articles/(:segment)/comments', 'Api\CommentController::index/$1');
$routes->post('api/articles/(:segment)/comments', 'Api\CommentController::create/$1');

// Settings
$routes->get('api/settings', 'Api\SettingController::index');
$routes->post('api/settings', 'Api\SettingController::update', ['filter' => 'auth']);
