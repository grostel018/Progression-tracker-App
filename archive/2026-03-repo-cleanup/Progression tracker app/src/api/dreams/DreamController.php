<?php

namespace src\api\dreams;

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

    public function __construct()
    {
        $this->auth = new Auth(Database::getConnection(), config('app'));
        $this->repository = new DreamRepository();
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

        $data['user_id'] = $this->auth->id();

        try {
            $id = $this->repository->create($data);
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

        if (!$this->repository->getById($id, $this->auth->id())) {
            return ['success' => false, 'message' => 'Dream not found'];
        }

        if ($this->repository->update($id, $this->auth->id(), $data)) {
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

        if (!$this->repository->getById($id, $this->auth->id())) {
            return ['success' => false, 'message' => 'Dream not found'];
        }

        if ($this->repository->delete($id, $this->auth->id())) {
            return ['success' => true, 'message' => 'Dream deleted'];
        }

        return ['success' => false, 'message' => 'Failed to delete dream'];
    }
}
