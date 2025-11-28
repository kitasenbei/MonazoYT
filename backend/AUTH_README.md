# MonazoYT Authentication

This service uses SHA256 key-based authentication (aka "monkey auth").

## How it works

1. Friends get a SHA256 key from you
2. They enter the key on the login screen
3. The key is stored in their browser's localStorage
4. All API requests include the key in the `x-auth-key` header

## Adding new keys

1. Generate a SHA256 hash of a secret phrase:

```bash
# Using echo (add a random word/phrase)
echo -n "your-secret-phrase-here" | sha256sum

# Or using openssl
echo -n "your-secret-phrase-here" | openssl dgst -sha256
```

2. Add the resulting hash to `keys.json`:

```json
{
  "validKeys": [
    "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    "YOUR_NEW_HASH_HERE"
  ],
  "description": "Add SHA256 hashes here"
}
```

3. Share the **original phrase** (not the hash) with your friend
4. They enter the hash on the login page (or you can give them the hash directly)

## Example

```bash
# Generate key from phrase "my-secret-123"
$ echo -n "my-secret-123" | sha256sum
8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92

# Give your friend either:
# - The phrase: "my-secret-123" (they hash it themselves if needed)
# - The hash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92"
```

## Security notes

- Keys are stored in localStorage (client-side)
- All protected endpoints require authentication
- Invalid keys return 403 Forbidden
- Missing keys return 401 Unauthorized
- The `/downloads/:filename` endpoint does NOT require auth (so download links work)
