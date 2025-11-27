# Zenus API Documentation

Minimalist reference for Zenus Server Mode API.

**Base URL:** `http://localhost:8888` (default)
**Auth:** Pass your token in the `Authorization` header if enabled.

## Endpoints

### 1. List All Notes
Get all notes sorted by order.

```bash
curl -H "Authorization: your_token" \
     http://localhost:8888/notes
```

### 2. Save / Update Note
Create a new note or update an existing one.

```bash
curl -X POST \
     -H "Authorization: your_token" \
     -H "Content-Type: application/json" \
     -d '{
           "id": "123456789",
           "title": "My Note",
           "content": "# Hello World\nThis is a note.",
           "isCollapsed": false,
           "order": 0
         }' \
     http://localhost:8888/notes
```

### 3. Delete Note
Delete a note by its ID.

```bash
curl -X DELETE \
     -H "Authorization: your_token" \
     http://localhost:8888/notes/123456789
```

### 4. Reorder Notes
Update the order of multiple notes at once.

```bash
curl -X POST \
     -H "Authorization: your_token" \
     -H "Content-Type: application/json" \
     -d '[
           ["123456789", 0],
           ["987654321", 1]
         ]' \
     http://localhost:8888/notes/reorder
```
