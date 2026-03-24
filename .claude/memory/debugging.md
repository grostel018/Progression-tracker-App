# Debugging Guide

## Common Issues

### Blank Page
1. Check Apache error logs: `C:\xampp\apache\logs\error.log`
2. Enable PHP errors in `php.ini`: `display_errors = On`
3. Check file permissions on `htdocs` folder

### Database Connection Failed
1. Verify MySQL is running in XAMPP
2. Check database exists: `progression_tracker`
3. Verify credentials in PHP files match XAMPP defaults

### Session Issues
1. Clear browser cookies for localhost
2. Check `session.save_path` in `php.ini`
3. Ensure `public/session/` is writable

## Debugging Snippets

```php
// Enable error display
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Debug variables
var_dump($variable);
print_r($array);

// Check session
session_start();
var_dump($_SESSION);
```

## XAMPP Path Notes

- Apache config: `C:\xampp\apache\conf\`
- PHP config: `C:\xampp\php\php.ini`
- MySQL data: `C:\xampp\mysql\data\`
