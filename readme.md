# TicketSense

[▶ Watch the TicketSense project demo video](https://drive.google.com/file/d/12gk1uwCkuYwUNFULUM_1oIJPYFVQvU4Z/view?usp=sharing)

TicketSense is an AI-assisted issue and work-tracking application for internal
company teams. It helps a team discuss a problem or idea before turning it into
actionable work.

The core workflow is:

```text
Workspace → Project → Topic → one or more Tickets → completion
```

A **Topic** is the collaborative starting point for a bug, feature request,
improvement, technical question, customer feedback, or another matter that
needs discussion. Team members can investigate it through a conversation,
threaded replies, mentions, and attachments.

Once the work is understood, the team can create zero, one, or many **Tickets**
from the Topic. Tickets are also the cards shown in the Tickets board, so the
application does not maintain a separate board-card or task model.

## Main features

- Workspaces with Owner, Admin, Member, and Guest roles
- Projects with a key, lead, members, status, priority, dates, and description
- A required Project relationship for every Topic and Ticket
- Topics for discussion, threaded comments, mentions, attachments, participants,
  solutions, related tickets, and activity history
- One Topic to many Tickets, with an optional Origin Topic on each Ticket
- Ticket board grouped by workflow status and filterable by Project
- Ticket assignment, priority, estimate, due date, and external development links
- GitHub, GitHub pull request, GitLab, Bitbucket, Jira, Linear, and custom links
- Multiple time entries per Ticket with one active timer per user
- A persistent website-wide timer with live progress and a Stop action
- Project summaries for open Tickets, active members, estimated work, and tracked
  time
- Soft deletion for business records and confirmation-based Topic/Ticket deletion
- Owner/Admin protection for destructive actions
- Local AI-powered duplicate Topic suggestions without a paid AI API

## How the AI feature works

When a user enters a Topic title and description, TicketSense can suggest
existing Topics from the same Workspace that have a similar meaning. Selecting
a suggestion opens that Topic.

The feature uses the free local `BAAI/bge-small-en-v1.5` embedding model through
FastEmbed:

1. A Topic is created or its title/description is changed.
2. Django commits the Topic to PostgreSQL.
3. Django queues an embedding task through Redis.
4. A Celery worker generates a 384-dimensional semantic vector.
5. The vector and model metadata are stored in PostgreSQL with pgvector.
6. Similar Topics are ranked using cosine distance and the pgvector HNSW index.

This is semantic matching rather than word-for-word searching. Normal Topic
creation is not blocked while the background worker generates the vector.

### How the model is downloaded

The model weights are not committed to this Git repository and are not stored
in PostgreSQL. The repository ignores `.model-cache/`, while PostgreSQL stores
only the 384-number embedding generated for each Topic.

With Docker, no separate model command is required. This command:

```bash
docker compose up --build
```

builds the backend image, and the backend
[`Dockerfile`](ticketsense_backend/Dockerfile) executes the equivalent of:

```python
from fastembed import TextEmbedding

TextEmbedding(
    model_name="BAAI/bge-small-en-v1.5",
    cache_dir="/app/.model-cache/fastembed",
    threads=2,
)
```

Creating the `TextEmbedding` instance downloads the model during the image
build. The Django backend and Celery worker use the resulting cached Docker
layer, so they can load the model without downloading it for every Topic.
Docker needs internet access during the first build. Rebuilding normally reuses
the cached layer unless the relevant Dockerfile or dependency layer changes.

For a manual, non-Docker installation, `pip install -r requirements.txt`
installs FastEmbed but not the model weights. FastEmbed downloads the weights
automatically when Django or Celery first requests the model. To download it
explicitly before starting the application, run this from
`ticketsense_backend` with the virtual environment activated:

```bash
python -c "from pathlib import Path; from fastembed import TextEmbedding; TextEmbedding(model_name='BAAI/bge-small-en-v1.5', cache_dir=str(Path('..') / '.model-cache' / 'fastembed'), threads=2)"
```

That cache directory is local to each developer's computer and remains outside
Git. Internet access is only needed when the model is not already present in
the selected cache.

## Technology stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| API | Python 3.12, Django 6, Django REST Framework |
| Authentication | JWT with Simple JWT and refresh-token rotation |
| Database | PostgreSQL 16 with pgvector |
| Semantic AI | FastEmbed with BGE Small English v1.5 |
| Background processing | Celery 5 |
| Queue and cache | Redis 8 and django-redis |
| API documentation | drf-spectacular / OpenAPI |
| Containers | Docker and Docker Compose |

## Repository structure

```text
TicketSense/
├── compose.yaml
├── .env.example
├── ticketsense-frontend/       # Next.js application
└── ticketsense_backend/        # Django API and Celery application
    ├── accounts/
    ├── organizations/
    ├── projects/
    ├── topics/
    └── tickets/
```

## Quick start with Docker

Docker is the recommended way to run the project. It starts PostgreSQL with
pgvector, Redis, Django, Celery, and Next.js together.

### Requirements

Install one of the following:

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) for macOS or
  Windows
- Docker Engine with the Docker Compose plugin for Linux

You do not need to install Python, Node.js, PostgreSQL, pgvector, or Redis
separately when using Docker.

### 1. Get the project

```bash
git clone <your-repository-url>
cd TicketSense
```

If you already have the repository, open a terminal in its root directory.

### 2. Create the environment file

```bash
cp .env.example .env
```

For local Docker development, the provided values can be used after replacing
the secret and database password:

```dotenv
DJANGO_SECRET_KEY=replace-with-a-long-random-secret
DJANGO_DEBUG=True
POSTGRES_DB=ticketsense
POSTGRES_USER=ticketsense
POSTGRES_PASSWORD=replace-with-a-secure-password
```

Do not commit `.env`. If a value contains a literal `$`, enclose that value in
single quotes so Docker Compose does not treat it as variable interpolation.

### 3. Build and start everything

```bash
docker compose up --build
```

To run it in the background:

```bash
docker compose up --detach --build
```

The first build can take several minutes because the backend image downloads
the local embedding model. Later builds reuse Docker's cache. The backend
container automatically applies Django migrations before starting.

Open:

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- Django admin: http://localhost:8000/admin/

### 4. Create an account

Register through the frontend, or create a Django administrator:

```bash
docker compose exec backend python manage.py createsuperuser
```

Two optional development-data commands are also available. For a complete
walkthrough dataset, run:

```bash
docker compose exec backend python manage.py create_demo_data
```

This creates an idempotent **Project → Topics → Tickets → progress** story in a
`TicketSense Demo` Workspace. Sign in with:

```text
Email: owner@demo.ticketsense.local
Password: Demo123!
```

Use `Customer Portal Refresh (PORTAL)` for a demonstration:

1. Open **Projects** to show its members, dates, open work, estimates, and
   tracked-time summary.
2. Open **Topics** to show an idea still open, a bug under review with a
   threaded discussion and mention, a proposal converted into five Tickets,
   and a resolved bug with its linked solution.
3. Open **Board** and filter by `PORTAL`. The cards cover Backlog, Open, In
   Progress, In Review, Completed, and Closed.
4. Open **My work** or the in-progress Ticket. The demo owner has a running
   timer, while completed time entries make the Project progress measurable.

The command can be run again safely; it updates the demo records instead of
duplicating them. A smaller legacy user-only seed is also available:

```bash
docker compose exec backend python manage.py create_users
```

The seed command uses development-only credentials. Do not use seeded
credentials in a public deployment.

### Docker management commands

Check container status:

```bash
docker compose ps
```

View logs:

```bash
docker compose logs --follow backend
docker compose logs --follow worker
docker compose logs --follow frontend
```

Stop the application while preserving its data:

```bash
docker compose down
```

Delete containers and all Docker-managed database, Redis, and uploaded-file
data:

```bash
docker compose down --volumes
```

`docker compose down --volumes` is destructive and cannot recover the removed
Docker volumes.

## Run without Docker

Use this setup when developing the frontend and backend directly on your
computer.

### Requirements

Install:

- Python 3.12 or newer
- Node.js 20 or newer
- Yarn 1.x
- PostgreSQL 16 or newer
- pgvector built for the selected PostgreSQL installation
- Redis

On macOS, the main services can be installed with Homebrew:

```bash
brew install postgresql@17 pgvector redis
brew services start postgresql@17
brew services start redis
```

Package names can differ on Linux. Confirm that pgvector is installed for the
same PostgreSQL server used by Django.

### 1. Configure PostgreSQL

Open PostgreSQL as an administrator:

```bash
psql postgres
```

Then create the local user, database, and vector extension:

```sql
CREATE USER ticketsense WITH PASSWORD 'replace-with-a-secure-password';
CREATE DATABASE ticketsense OWNER ticketsense;
\connect ticketsense
CREATE EXTENSION IF NOT EXISTS vector;
\quit
```

### 2. Configure environment variables

From the repository root:

```bash
cp .env.example .env
```

Make sure the local service addresses are configured:

```dotenv
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/1
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Start the Django API

```bash
cd ticketsense_backend
python3 -m venv .venv
source .venv/bin/activate
python -m pip install --upgrade pip
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

On Windows PowerShell, activate the environment with:

```powershell
.\.venv\Scripts\Activate.ps1
```

The backend will run at http://localhost:8000.

### 4. Start the Celery worker

Keep Django running and open a second terminal:

```bash
cd ticketsense_backend
source .venv/bin/activate
celery -A ticketsense_backend worker --pool=solo --loglevel=info
```

Use the equivalent `.venv` activation command on Windows. The `solo` pool is
recommended for local development because it avoids loading multiple copies of
the embedding model.

### 5. Start the Next.js frontend

Open a third terminal:

```bash
cd ticketsense-frontend
yarn install --frozen-lockfile
yarn dev
```

Open http://localhost:3000.

## Application rules

### Workspaces and roles

- The user who creates a Workspace becomes its Owner.
- Each Workspace has one active Owner.
- Roles are intentionally universal: Owner, Admin, Member, and Guest.
- Specific responsibilities are assigned through Projects, Ticket assignment,
  and application permissions rather than job-title roles.
- Owner and Admin users control protected management and deletion actions.

### Projects, Topics, and Tickets

- A Project belongs to one Workspace.
- A Topic cannot be created without a Project.
- A Ticket cannot be created without a Project.
- A Topic can produce any number of Tickets.
- A Ticket has zero or one Origin Topic.
- Deleting a Topic does not delete its related Tickets.
- Relationships use database foreign keys, never JSON or comma-separated IDs.
- Ticket estimates and due dates belong to Tickets, not Projects.

### Ticket board and timers

- Tickets are the cards displayed in the Tickets board.
- Cards can be filtered by Project and moved through Backlog, Open, In Progress,
  In Review, Completed, and Closed.
- A user can run only one Ticket timer at a time.
- A Ticket can have only one active timer, but it retains multiple completed
  time-entry records.
- Starting a timer creates a progressing entry and moves the Ticket to
  `in_progress`.
- The global bottom-right timer remains visible while navigating the application.
- The frontend displays time every second and periodically sends a heartbeat to
  persist progress.
- Stopping the timer records its end time and final duration.
- Completing or closing a Ticket stops its active timer automatically.

## Topic embedding maintenance

New and edited Topics are embedded automatically by Celery. Do **not** run a
backfill for every new Topic.

Generate only missing or outdated embeddings:

```bash
docker compose exec backend python manage.py backfill_topic_embeddings
```

Force regeneration for every Topic after changing the model or embedding
dimensions:

```bash
docker compose exec backend python manage.py backfill_topic_embeddings --all
```

Without Docker, run the same management commands from `ticketsense_backend`
with the Python virtual environment activated.

## Important environment variables

All supported development values are listed in [`.env.example`](.env.example).

| Variable | Purpose |
| --- | --- |
| `DJANGO_SECRET_KEY` | Django cryptographic secret |
| `DJANGO_DEBUG` | Enables or disables Django debug mode |
| `CORS_ALLOWED_ORIGINS` | Frontend origins allowed to call the API |
| `CSRF_TRUSTED_ORIGINS` | Trusted origins for CSRF-protected requests |
| `POSTGRES_*` | PostgreSQL connection settings |
| `CELERY_BROKER_URL` | Redis queue used by Celery |
| `CELERY_RESULT_BACKEND` | Redis storage for Celery results |
| `TOPIC_EMBEDDING_ENABLED` | Enables asynchronous Topic embeddings |
| `TOPIC_EMBEDDING_MODEL` | FastEmbed model used for semantic matching |
| `TOPIC_EMBEDDING_THREADS` | CPU threads used during local inference |
| `TOPIC_SIMILARITY_THRESHOLD` | Minimum cosine-similarity score shown |
| `NEXT_PUBLIC_API_BASE_URL` | Django URL available to the user's browser |
| `NEXT_PUBLIC_SITE_URL` | Public frontend URL |

Restart or rebuild the affected service after changing environment variables.
Next.js public variables are included at build time, so rebuild the frontend
when they change.

## Development and verification

Backend checks and tests:

```bash
cd ticketsense_backend
python manage.py check
python manage.py test
```

Frontend lint and production build:

```bash
cd ticketsense-frontend
yarn lint
yarn build
```

With Docker:

```bash
docker compose exec backend python manage.py check
docker compose exec backend python manage.py test
docker compose exec frontend yarn lint
```

## Common problems

### `type "vector" does not exist`

The selected PostgreSQL server does not have the pgvector extension installed
or enabled:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

The Docker configuration already uses the
`pgvector/pgvector:0.8.2-pg16-bookworm` image.

### `django.contrib.postgres` is required for `HnswIndex`

`django.contrib.postgres` must remain in `INSTALLED_APPS`. It is already enabled
in the repository settings.

### A Topic is saved but its embedding stays empty

Confirm that Redis and the Celery worker are running:

```bash
docker compose ps
docker compose logs --follow worker
```

After restoring the worker, run the normal backfill command to enqueue missing
embeddings.

### Browser sends `OPTIONS`, but the API request does not continue

Confirm that the exact frontend address—including scheme and port—is present in
both `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS`. When using Docker
locally, access the site consistently through one of `localhost`, `127.0.0.1`,
or `0.0.0.0`, rather than mixing origins.

### Docker Compose warns that a variable is not set

A secret in `.env` probably contains `$`. Put the entire value in single quotes
or escape the dollar signs before running Compose again.

## Deployment note

The included Compose configuration is optimized for local development and a
portfolio demonstration. Before exposing it publicly:

- set `DJANGO_DEBUG=False`;
- use strong, unique secrets;
- restrict Django allowed hosts and CORS/CSRF origins;
- serve Django through a production WSGI/ASGI server instead of `runserver`;
- put the application behind HTTPS with Caddy or Nginx;
- back up the PostgreSQL and media volumes;
- restrict PostgreSQL and Redis to the private container network.
