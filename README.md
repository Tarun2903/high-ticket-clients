# High Ticket Clients

Landing page served by a small Node.js + Express app.

## Run locally

```bash
npm install
npm run dev     # auto-restarts on changes
# or
npm start
```

Then open http://localhost:3000.

## Scripts

- `npm start` – run the server
- `npm run dev` – run with file watching
- `npm test` – run tests

## Structure

```
src/server.js   entry point (reads PORT, default 3000)
src/app.js      Express app (static files, /health, 404)
public/         HTML, CSS, JS served to the browser
test/           node:test tests
```
