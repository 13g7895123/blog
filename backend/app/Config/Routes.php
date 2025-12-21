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
    $routes->post('articles', 'ArticleController::create');
    $routes->put('articles/(:segment)', 'ArticleController::update/$1');
    $routes->delete('articles/(:segment)', 'ArticleController::delete/$1');

    // Tags
    $routes->get('tags/stats', 'TagController::stats');
    $routes->get('tags', 'TagController::index');
    $routes->post('tags', 'TagController::create');
    $routes->delete('tags/(:segment)', 'TagController::delete/$1');
});
