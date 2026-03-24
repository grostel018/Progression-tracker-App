<?php
/**
 * Category Controller
 * Handles category-related API requests
 */
namespace src\api\categories;

use src\api\logs\ActivityLogRepository;
use src\lib\Auth;
use src\lib\Database;

class CategoryController
{
    private Auth $auth;
    private CategoryRepository $repository;
    private ActivityLogRepository $activityLogRepository;

    public function __construct()
    {
        $this->auth = new Auth(Database::getConnection(), config('app'));
        $this->repository = new CategoryRepository();
        $this->activityLogRepository = new ActivityLogRepository();
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
            $this->activityLogRepository->create([
                'user_id' => $this->auth->id(),
                'action' => 'category_create',
                'target_type' => 'category',
                'target_id' => $id,
                'details' => json_encode(['name' => $data['name']]),
            ]);
            return ['success' => true, 'id' => $id, 'message' => 'Category created'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'Failed to create category'];
        }
    }

    public function update(int $id, array $data): array
    {
        $this->auth->requireAuth();

        $category = $this->repository->getById($id, $this->auth->id());

        if (!$category) {
            return ['success' => false, 'message' => 'Category not found'];
        }

        if ($this->repository->update($id, $this->auth->id(), $data)) {
            $this->activityLogRepository->create([
                'user_id' => $this->auth->id(),
                'action' => 'category_update',
                'target_type' => 'category',
                'target_id' => $id,
                'details' => json_encode([
                    'previous_name' => $category['name'] ?? null,
                    'name' => $data['name'] ?? ($category['name'] ?? null),
                ]),
            ]);
            return ['success' => true, 'message' => 'Category updated'];
        }

        return ['success' => false, 'message' => 'Failed to update category'];
    }

    public function delete(int $id): array
    {
        $this->auth->requireAuth();

        $category = $this->repository->getById($id, $this->auth->id());

        if (!$category) {
            return ['success' => false, 'message' => 'Category not found'];
        }

        if ($this->repository->delete($id, $this->auth->id())) {
            $this->activityLogRepository->create([
                'user_id' => $this->auth->id(),
                'action' => 'category_delete',
                'target_type' => 'category',
                'target_id' => $id,
                'details' => json_encode(['name' => $category['name'] ?? null]),
            ]);
            return ['success' => true, 'message' => 'Category deleted'];
        }

        return ['success' => false, 'message' => 'Failed to delete category'];
    }
}
