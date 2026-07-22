# TicketSense — Local Setup

## What this project does

TicketSense is a web application for managing support tickets. It is designed to let users submit and track issues while administrators review, update, and organize those tickets.

The project uses:

- **Django** for the backend, API, authentication, and admin panel.
- **PostgreSQL** to store users, tickets, statuses, and other application data.
- **Node.js** to install and run the frontend application.
- **Celery and Redis** optionally for background work such as notifications or scheduled tasks.

The Django admin panel is available at <http://localhost:8000/admin/> after creating a superuser.

## Requirements

- Anaconda or Miniconda
- Node.js and npm
- PostgreSQL

## 1. Create the PostgreSQL database

```bash
psql -U postgres
```

```sql
CREATE USER ticketsense_user WITH PASSWORD 'your_password';
CREATE DATABASE ticketsense OWNER ticketsense_user;
\q
```

## 2. Configure the backend

From the folder containing `manage.py`:

```bash
conda create -n ticketsense python=3.12
conda activate ticketsense
pip install -r requirements.txt
```

Create or update `.env`:

```env
DB_NAME=ticketsense
DB_USER=ticketsense_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
```

Initialize and start Django:

```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend: <http://localhost:8000>

## 3. Start the frontend

From the folder containing `package.json`:

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal, usually <http://localhost:5173>.
