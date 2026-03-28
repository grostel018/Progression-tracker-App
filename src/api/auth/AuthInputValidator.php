<?php

namespace src\api\auth;

class AuthInputValidator
{
    private const EMAIL_MAX_LENGTH = 254;
    private const USERNAME_MIN_LENGTH = 3;
    private const USERNAME_MAX_LENGTH = 32;

    private int $passwordMinLength;

    public function __construct(array $config = [])
    {
        $this->passwordMinLength = (int) ($config['password']['min_length'] ?? 6);
    }

    public function validateLogin(array $input): array
    {
        $errors = [];
        $email = trim((string) ($input['email'] ?? ''));
        $password = (string) ($input['password'] ?? '');

        $this->validateEmail($email, $errors);

        if ($password === '') {
            $errors['password'] = 'Password is required';
        }

        return $this->formatErrors($errors);
    }

    public function validateRegister(array $input): array
    {
        $errors = [];
        $username = trim((string) ($input['username'] ?? ''));
        $email = trim((string) ($input['email'] ?? ''));
        $password = (string) ($input['password'] ?? '');
        $passwordConfirm = (string) ($input['password2'] ?? '');

        $this->validateEmail($email, $errors);
        $this->validateUsername($username, $errors);
        $this->validatePassword($password, $errors);

        if ($passwordConfirm === '') {
            $errors['password2'] = 'Please repeat your password';
        } elseif (!isset($errors['password']) && $password !== $passwordConfirm) {
            $errors['password2'] = 'Passwords do not match';
        }

        return $this->formatErrors($errors);
    }

    public function validateRecovery(array $input): array
    {
        $errors = [];
        $email = trim((string) ($input['email'] ?? ''));

        $this->validateEmail($email, $errors);

        return $this->formatErrors($errors);
    }

    private function validateEmail(string $email, array &$errors): void
    {
        if ($email === '') {
            $errors['email'] = 'Email is required';
            return;
        }

        if (strlen($email) > self::EMAIL_MAX_LENGTH) {
            $errors['email'] = 'Email is too long';
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $errors['email'] = 'Enter a valid email address';
        }
    }

    private function validateUsername(string $username, array &$errors): void
    {
        if ($username === '') {
            $errors['username'] = 'Username is required';
            return;
        }

        $length = strlen($username);

        if ($length < self::USERNAME_MIN_LENGTH) {
            $errors['username'] = sprintf('Username must be at least %d characters', self::USERNAME_MIN_LENGTH);
            return;
        }

        if ($length > self::USERNAME_MAX_LENGTH) {
            $errors['username'] = sprintf('Username must be %d characters or fewer', self::USERNAME_MAX_LENGTH);
            return;
        }

        if (!preg_match('/^[A-Za-z0-9_-]+$/', $username)) {
            $errors['username'] = 'Use only letters, numbers, underscores, and hyphens';
        }
    }

    private function validatePassword(string $password, array &$errors): void
    {
        if ($password === '') {
            $errors['password'] = 'Password is required';
            return;
        }

        if (strlen($password) < $this->passwordMinLength) {
            $errors['password'] = sprintf('Password must be at least %d characters', $this->passwordMinLength);
            return;
        }

        if (!preg_match('/[A-Za-z]/', $password) || !preg_match('/\d/', $password)) {
            $errors['password'] = 'Password must include at least one letter and one number';
        }
    }

    private function formatErrors(array $errors): array
    {
        if ($errors === []) {
            return [];
        }

        return [
            'message' => reset($errors),
            'errors' => $errors,
        ];
    }
}
