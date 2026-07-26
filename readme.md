# TicketSense

TicketSense is an AI-assisted, organization-based issue and work tracking
application. Teams begin with a **Topic** to understand a problem, request, or
idea through conversation. Once the work is clear, they can create one or more
**Tickets** from that Topic and manage those tickets as cards on the board.

The application is designed around this workflow:

```text
Topic → conversation and investigation → one or more Tickets → board workflow
```

## What the project includes

- Organization workspaces with owner, admin, member, and guest access
- Topics for bugs, features, improvements, questions, feedback, and other ideas
- Topic conversations with threaded comments, mentions, and attachments
- Multiple Tickets from one Topic, with an Origin Topic link on each Ticket
- A board where tickets are assigned and moved through the work process
- Ticket and Topic activity history
- Optional solution links, ticket links, and source-control links
- Protected deletion for Topics and Tickets, restricted to owners and admins
- AI-assisted duplicate Topic discovery

## AI similarity matching

TicketSense does not require a paid AI API. It uses the local
`BAAI/bge-small-en-v1.5` sentence-embedding model through FastEmbed.

When a Topic is created or its title or description changes:

1. Django commits the Topic to PostgreSQL.
2. A Celery task is sent through Redis.
3. The worker generates a 384-dimensional semantic embedding.
4. The vector is stored in PostgreSQL using pgvector.
5. Similar Topics are found with cosine-distance search.

This compares meaning rather than only matching identical words. Embeddings are
not regenerated when unrelated Topic fields change.

## Technology

| Area | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Django 6, Django REST Framework, JWT authentication |
| Database | PostgreSQL 16/17 with pgvector |
| Background jobs | Celery and Redis |
| Local AI | FastEmbed and BGE Small English v1.5 |

## Run everything with Docker

This is the recommended setup. Docker starts the frontend, backend, database,
Redis, and embedding worker together.

### Requirements

Install:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) on macOS or
  Windows
- Docker Engine with the Compose plugin on Linux

No local Python, Node.js, PostgreSQL, Redis, pgvector, or AI model installation
is required.

### Start the application

From the repository root:

```bash
docker compose up --build
```

Compose uses safe development defaults. If a root `.env` exists, its database
and Django values override those defaults. Values containing a literal `$` must
be enclosed in single quotes in `.env` so Docker Compose does not interpolate
them.

The first build takes longer because it installs the dependencies and downloads
the local embedding model. Later starts reuse the Docker build cache.

Open:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Django admin: http://localhost:8000/admin/

The API container applies Django migrations automatically before it starts.

Run the optional demo-data command in another terminal:

```bash
docker compose exec backend python manage.py create_users
```

The development seed command currently uses `admin@admin.com` with password
`123456`. Never use these credentials in a deployed environment.

### Stop or reset Docker

Stop the application while preserving database and uploaded-file data:

```bash
docker compose down
```

Delete containers and all Docker-managed project data:

```bash
docker compose down --volumes
```

The second command permanently removes the Docker database and media volumes.

## Run locally without Docker

### 1. Install system dependencies

Install:

- Python 3.12+
- Node.js 20+
- Yarn 1.x
- PostgreSQL 16 or 17
- pgvector for the same PostgreSQL installation
- Redis

On macOS with Homebrew:

```bash
brew install postgresql@17 pgvector redis
brew services start postgresql@17
brew services start redis
```

### 2. Configure the environment

From the repository root:

```bash
cp .env.example .env
```

Update at least these values in `.env`:

```dotenv
DJANGO_SECRET_KEY=replace-with-a-long-random-secret
POSTGRES_DB=ticketsense
POSTGRES_USER=ticketsense
POSTGRES_PASSWORD=replace-with-a-secure-password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

Create the PostgreSQL role and database using your preferred PostgreSQL
administration tool. The Django migration creates the `vector` extension when
the configured database user has permission. Otherwise, connect as a PostgreSQL
administrator and run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

### 3. Start the backend

```bash
cd ticketsense_backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend is available at http://localhost:8000.

### 4. Start the Celery worker

Keep the backend running and open another terminal:

```bash
cd ticketsense_backend
source .venv/bin/activate
celery -A ticketsense_backend worker --pool=solo --loglevel=info
```

`--pool=solo` is appropriate for local development and prevents several worker
processes from loading separate copies of the embedding model.

### 5. Start the frontend

Open another terminal:

```bash
cd ticketsense-frontend
yarn install --frozen-lockfile
yarn dev
```

Open http://localhost:3000.

## Embedding maintenance

New and edited Topics are embedded automatically by Celery. A backfill is only
needed for older Topics, missing vectors, or after changing the embedding model.

```bash
cd ticketsense_backend

# Generate missing or outdated embeddings
python manage.py backfill_topic_embeddings

# Force regeneration for every Topic
python manage.py backfill_topic_embeddings --all
```

## Development commands

Backend checks and tests:

```bash
cd ticketsense_backend
python manage.py check
python manage.py test
```

Frontend checks:

```bash
cd ticketsense-frontend
yarn lint
yarn build
```

Docker logs:

```bash
docker compose logs -f backend
docker compose logs -f worker
docker compose logs -f frontend
```

## Environment variables

The documented defaults are in [`.env.example`](.env.example). Important
variables include:

- `POSTGRES_*`: PostgreSQL connection
- `CELERY_BROKER_URL`: Redis queue used by Celery
- `CELERY_RESULT_BACKEND`: Celery result storage
- `TOPIC_EMBEDDING_MODEL`: local semantic model
- `TOPIC_SIMILARITY_THRESHOLD`: minimum similarity shown to users
- `NEXT_PUBLIC_API_BASE_URL`: browser-accessible Django API URL
- `NEXT_PUBLIC_SITE_URL`: browser-accessible frontend URL

Do not commit `.env`; it may contain credentials.

## Common problems

### `type "vector" does not exist`

The PostgreSQL server does not have pgvector installed, or the extension was not
created in the selected database. Install pgvector and run:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

The Docker setup already uses a pgvector-enabled PostgreSQL image.

### Topics are saved but no embedding appears

Confirm Redis and the Celery worker are running:

```bash
docker compose ps
docker compose logs -f worker
```

Saving a Topic is intentionally not blocked if the queue is temporarily
unavailable. Once the worker is available, use the normal backfill command to
repair any missing embeddings.
