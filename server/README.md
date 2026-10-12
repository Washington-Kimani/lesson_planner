# FastAPI + PostgreSQL starter

Async SQLAlchemy 2.0 + asyncpg + Alembic, wired into a FastAPI app.

## Setup

Dependencies are declared in `pyproject.toml`; `uv` resolves them into a
`uv.lock` and manages the `.venv` for you — no manual venv activation needed,
`uv run` picks it up automatically.

1. Install dependencies:

   ```bash
   uv sync
   ```

2. Copy `.env.example` to `.env` and point it at your Postgres instance:

   ```bash
   cp .env.example .env
   ```

3. Create the database if it doesn't exist yet:

   ```bash
   createdb mydb
   ```

4. Run the first migration (the `items` table is already modeled in
   `app/models/item.py`):

   ```bash
   uv run alembic revision --autogenerate -m "create items table"
   uv run alembic upgrade head
   ```

5. Run the app:

   ```bash
   uv run uvicorn app.main:app --reload
   ```

   Visit `http://localhost:8000/docs` for interactive API docs, or
   `http://localhost:8000/health` for a basic liveness check.

## Adding a new resource

Follow the `item` slice as the template:

1. `app/models/<name>.py` — SQLAlchemy model, and import it in `app/db/base.py`
2. `app/schemas/<name>.py` — Pydantic request/response schemas
3. `app/crud/<name>.py` — query functions, one per operation
4. `app/api/v1/endpoints/<name>.py` — route handlers, thin — just calling crud
5. Register the router in `app/api/v1/api.py`
6. `uv run alembic revision --autogenerate -m "add <name> table"` then `uv run alembic upgrade head`

## Adding a dependency

```bash
uv add <package>          # runtime dependency, added to pyproject.toml
uv add --dev pytest       # dev-only dependency
```

## Why these choices

- **Async everywhere** (`asyncpg`, async SQLAlchemy session, async routes) —
  matches FastAPI's async request handling instead of blocking the event loop
  on DB calls.
- **CRUD layer separate from routes** — keeps route handlers thin and query
  logic reusable/testable outside of HTTP.
- **`app/db/base.py` imports every model** — so Alembic's autogenerate and
  `Base.metadata` can see the full schema even though each model lives in
  its own file.
