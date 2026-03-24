<?php
/**
 * Category Controller
 * Handles category-related API requests
 */
namespace src\api\categories;

use src\lib\Auth;
use src\lib\Database;

class CategoryController
{
    private Auth $auth;
    private CategoryRepository $repository;

    public function __construct()
    {
        $this->auth = new Auth(Database::getConnection(), config('app'));
        $this->repository = new CategoryRepository();
    }

    public function index(): array
    {
        $this->auth->requireAuth();
        return $this->repository->getByUser($this->auth->id());
    }

    public function show(int $id): ?array
    {
        $this->auth->requireAuth();
        return $this->repository->getById($id, $this->auth->id());
    }

    public function store(array $data): array
    {
        $this->auth->requireAuth();

        if (empty($data['name'])) {
            return ['success' => false, 'message' => 'Category name is required'];
        }

        $data['user_id'] = $this->auth->id();

        try {
            $id = $this->repository->create($data);
            return ['success' => true, 'id' => $id, 'message' => 'Category created'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'Failed to create category'];
        }
    }

    public function update(int $id, array $data): array
    {
        $this->auth->requireAuth();

        if (!$this->repository->getById($id, $this->auth->id())) {
            return ['success' => false, 'message' => 'Category not found'];
        }

        if ($this->repository->update($id, $this->auth->id(), $data)) {
            return ['success' => true, 'message' => 'Category updated'];
        }

        return ['success' => false, 'message' => 'Failed to update category'];
    }

    public function delete(int $id): array
    {
        $this->auth->requireAuth();

        if (!$this->repository->getById($id, $this->auth->id())) {
            return ['success' => false, 'message' => 'Category not found'];
        }

        if ($this->repository->delete($id, $this->auth->id())) {
            return ['success' => true, 'message' => 'Category deleted'];
        }

        return ['success' => false, 'message' => 'Failed to delete category'];
    }
}
