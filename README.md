# FlowApp - Backend API

> A serverless backend for the FlowApp application, built with [Cloudflare Workers](https://workers.cloudflare.com/) and [D1 Database](https://developers.cloudflare.com/d1/).

This repository contains the source code for the API that handles saving game scores and providing data for leaderboards.

## 🚀 About The Project

This API is the core of the leaderboard system for the FlowApp project. It handles requests from the user interface (GUI), processes them, and communicates with a D1 serverless database (based on SQLite).

Core responsibilities:
*   Accepting game results from players (`POST`).
*   Returning personalized leaderboards (`GET`).
*   Handling CORS to allow communication with the frontend, which is hosted on a different domain.

## 🛠️ Built With

*   **Cloudflare Workers:** A serverless execution environment.
*   **D1 Database:** A globally distributed database built on SQLite.
*   **Wrangler:** The command-line tool for managing Cloudflare developer products.
*   **TypeScript:** The programming language used for the Worker.

## 🏁 Getting Started

To manage and develop the API, you need to have the Wrangler CLI installed and configured.

### Prerequisites

*   Node.js (v18.x or later)
*   npm
*   Wrangler installed globally:
    ```bash
    npm install -g wrangler
    ```
*   A Cloudflare account, logged in via Wrangler:
    ```bash
    wrangler login
    ```

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/tadejow/FlowApp-API.git
    cd FlowApp-API
    ```

2.  **Install NPM packages:**
    ```bash
    npm install
    ```

### Local Development

To run a local development server that simulates the Cloudflare environment:
```bash
wrangler dev
```
The Worker will be available at `http://localhost:8787`.

> **Note:** By default, `wrangler dev` uses a local, in-memory D1 database. To persist data between sessions, use the `--persist` flag: `wrangler dev --persist`.

## 🚀 Deployment

To deploy the latest version of the Worker to the Cloudflare production environment, run the following command:
```bash
wrangler deploy
```

## 🗃️ D1 Database Management

All database schema modifications (like adding or removing columns) must be performed using the Wrangler CLI.

> **Important:** Always use the `--remote` flag to ensure you are modifying the live, production database in the cloud, not the local simulation.

**Example: Adding a new column**
```bash
wrangler d1 execute flowapp-db --remote --command "ALTER TABLE reynolds_challenge ADD COLUMN new_column_name TEXT;"
```

**Example: Deleting a column**
```bash
wrangler d1 execute flowapp-db --remote --command "ALTER TABLE reynolds_challenge DROP COLUMN old_column_name;"
```

## 🌐 API Endpoints

### Duck Race
*   `GET /api/duck-race`: Returns the top 10 scores. Accepts an optional `?playerName=...` query parameter to also return the rank of a specific player.
*   `POST /api/duck-race`: Saves a new score. Expects a JSON body with the following structure: `{ "player_name": string, "completion_time_ms": number, "language": string }`.

### Reynolds Challenge
*   `GET /api/reynolds-challenge`: Returns the top 10 scores (ordered by `flow_ratio_avg`). Accepts an optional `?playerName=...` query parameter.
*   `POST /api/reynolds-challenge`: Saves a new result. Expects a JSON body with the following structure:
    ```json
    {
      "player_name": "string",
      "completion_time_ms": "number",
      "peak_velocity": "number",
      "flow_ratio_avg": "number",
      "flow_ratio_3": "number",
      "flow_ratio_4": "number",
      "flow_ratio_5": "number",
      "language": "string"
    }
    ```
