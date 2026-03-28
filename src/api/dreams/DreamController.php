<?php

namespace src\api\dreams;

use src\api\logs\ActivityLogRepository;
use src\api\categories\CategoryRepository;
use src\lib\Auth;
use src\lib\Database;

/**
 * Dream Controller
 * Handles dream-related API requests
 */
class DreamController
{
    private Auth $auth;
    private DreamRepository $repository;
    private CategoryRepository $categoryRepository;
    private ActivityLogRepository $activityLogRepository;

    public function __construct()
    {
        $this->auth = new Auth(Database::getConnection(), config('app'));
        $this->repository = new DreamRepository();
        $this->categoryRepository = new CategoryRepository();
        $this->activityLogRepository = new ActivityLogRepository();
    }

    /**
     * Get all dreams
     */
    public function index(): array
    {
        $this->auth->requireAuth();
        return $this->repository->getByUser($this->auth->id());
    }

    /**
     * Get single dream
     */
    public function show(int $id): ?array
    {
        $this->auth->requireAuth();
        return $this->repository->getById($id, $this->auth->id());
    }

    /**
     * Create dream
     */
    public function store(array $data): array
    {
        $this->auth->requireAuth();

        $required = ['title', 'category_id'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return ['success' => false, 'message' => "Missing required field: $field"];
            }
        }

        if (!$this->categoryRepository->isOwnedByUser((int) $data['category_id'], (int) $this->auth->id())) {
            return ['success' => false, 'message' => 'Invalid category selection'];
        }

        $data['user_id'] = $this->auth->id();

        try {
            $id = $this->repository->create($data);
            $this->activityLogRepository->create([
                'user_id' => $this->auth->id(),
                'action' => 'dream_create',
                'target_type' => 'dream',
                'target_id' => $id,
                'details' => json_encode([
                    'title' => $data['title'],
                    'category_id' => (int) $data['category_id'],
                ]),
            ]);
            return ['success' => true, 'id' => $id, 'message' => 'Dream created'];
        } catch (\Exception $e) {
            return ['success' => false, 'message' => 'Failed to create dream'];
        }
    }

    /**
     * Update dream
     */
    public function update(int $id, array $data): array
    {
        $this->auth->requireAuth();

        $dream = $this->repository->getById($id, $this->auth->id());

        if (!$dream) {
            return ['success' => false, 'message' => 'Dream not found'];
        }

        if (isset($data['category_id']) && !$this->categoryRepository->isOwnedByUser((int) $data['category_id'], (int) $this->auth->id())) {
            return ['success' => false, 'message' => 'Invalid category selection'];
        }

        if ($this->repository->update($id, $this->auth->id(), $data)) {
            $this->activityLogRepository->create([
                'user_id' => $this->auth->id(),
                'action' => 'dream_update',
                'target_type' => 'dream',
                'target_id' => $id,
                'details' => json_encode([
                    'previous_title' => $dream['title'] ?? null,
                    'title' => $data['title'] ?? ($dream['title'] ?? null),
                    'status' => $data['status'] ?? ($dream['status'] ?? null),
                ]),
            ]);
            return ['success' => true, 'message' => 'Dream updated'];
        }

        return ['success' => false, 'message' => 'Failed to update dream'];
    }

    /**
     * Delete dream
     */
    public function delete(int $id): array
    {
        $this->auth->requireAuth();

        $dream = $this->repository->getById($id, $this->auth->id());

        if (!$dream) {
            return ['success' => false, 'message' => 'Dream not found'];
        }

        if ($this->repository->delete($id, $this->auth->id())) {
            $this->activityLogRepository->create([
                'user_id' => $this->auth->id(),
                'action' => 'dream_delete',
                'target_type' => 'dream',
                'target_id' => $id,
                'details' => json_encode(['title' => $dream['title'] ?? null]),
            ]);
            return ['success' => true, 'message' => 'Dream deleted'];
        }

        return ['success' => false, 'message' => 'Failed to delete dream'];
    }
}
