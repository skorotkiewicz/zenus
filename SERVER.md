# Building and Running the Headless Server

The Zenus server can be built as a lightweight, headless binary without GUI dependencies.

## Building the Server Binary

```bash
cd src-tauri
cargo build --release --bin zenus-server --no-default-features
```

The binary will be located at: `src-tauri/target/release/zenus-server`

## Running the Server

```bash
# Run on default host/port (0.0.0.0:8888)
./zenus-server

# Specify custom host and port
./zenus-server --host 0.0.0.0 --port 5555

# Enable authentication
./zenus-server --host 0.0.0.0 --port 5555 --auth mypassword
```

## Benefits

- **No GUI dependencies**: Doesn't require GTK, WebKit, or other GUI libraries
- **Lightweight**: Smaller binary size
- **Server-friendly**: Perfect for headless servers and containers
- **Same functionality**: Full API support for all note operations

## API Endpoints

The server exposes the following REST API endpoints:

- `GET /notes` - List all active notes
- `POST /notes` - Create or update a note
- `DELETE /notes/:id` - Delete a note
- `POST /notes/reorder` - Update note order
- `GET /notes/archive` - List archived notes
- `POST /notes/:id/archive` - Archive a note
- `POST /notes/:id/unarchive` - Unarchive a note
- `DELETE /notes/:id/archive` - Delete an archived note