---
name: Execute Curl
description: Execute HTTP requests using PHP Curl
---

# Execute Curl

This skill executes HTTP requests using a PHP script with `curl` support.

## Usage

Run the `execute_curl.php` script with the following arguments:

```bash
php .antigravity/skills/execute_curl/execute_curl.php --url="https://api.example.com/data" --method="POST" --data='{"key":"value"}' --header="Content-Type: application/json"
```

## Arguments

- `--url`: The URL to request (required)
- `--method`: HTTP method (GET, POST, PUT, DELETE, etc.) - Default: GET
- `--data`: Request body data (e.g. JSON string)
- `--header`: HTTP Header (can be repeated for multiple headers)

## Example

```bash
php .antigravity/skills/execute_curl/execute_curl.php --url="https://jsonplaceholder.typicode.com/posts/1"
```
