# Mini Experiment Tracker

A simple application to create projects, track experiment runs, and monitor metrics in real time.

## Features

- Create and manage projects.
- Track multiple runs in each project.
- Send and store experiment metrics.
- Show metric updates in real time.
- Handle duplicate and late metric events.
- Recover missed events after a connection is lost.
- Keep each project's data separate.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Real-time Updates:** Server-Sent Events (SSE)
- **Tools:** Docker, Docker Compose, Turborepo

## Project Structure

```text
mini_experiment_tracker/
├── apps/
│   ├── backend/
│   └── frontend/
├── packages/
│   ├── db/
│   ├── eslint-config/
│   ├── typescript-config/
│   └── ui/
├── docker-compose.yml
├── package.json
└── turbo.json
```

## How to Run the Project

### Requirements

Install these tools first:

- Docker Desktop
- Git

### Step 1: Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd mini_experiment_tracker
```

### Step 2: Start the project

Run this command from the project folder:

```bash
docker compose up --build
```

That's it!

Docker Compose will automatically:

1. Start the PostgreSQL database.
2. Build and start the backend.
3. Run database migrations.
4. Build and start the frontend.
5. Connect all services.

You don't need to install PostgreSQL or start each service manually.

### Step 3: Open the application

Once everything is running, open:

- **Frontend:** http://localhost:3000
- **Backend Health Check:** http://localhost:5000/health

### Step 4: Stop the project

```bash
docker compose down
```

Your database data will remain saved.

To stop the project and delete the database data too, run:

```bash
docker compose down -v
```

**Note:** This command permanently removes the database volume and its stored data.

## Run Without Docker

You can also run the project manually.

1. Install Node.js and PostgreSQL.
2. Install project dependencies:

```bash
npm install
```

3. Set up your database connection in the environment variables.
4. Generate Prisma Client:

```bash
npm run db:generate --workspace=@repo/db
```

5. Run database migrations:

```bash
npx prisma migrate deploy --schema=packages/db/prisma/schema.prisma
```

6. Start the frontend and backend using their workspace scripts.

## Load Testing

A CLI script is available to test metric ingestion with multiple runs:

```bash
node apps/backend/scripts/load-test.mjs
```

It reports request success, accepted events, throughput, and API response times.

## Author

**Om Rana**

Full-Stack Developer

## AI Usage

AI tools were used to help with debugging, exploring solutions, and reviewing parts of the implementation. Suggestions were checked before being used in the project.