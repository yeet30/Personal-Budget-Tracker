import express from "express";
import * as sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

async function main() {
  const app = express();
  app.use(express.json());

  const dbPath = path.resolve(process.cwd(), "database", "PersonalBudgetDB.sqlite");
  console.log("DB path:", dbPath);

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const angularDistPath = path.join(
    __dirname,
    '../frontend/dist/frontend/browser'
  );

  app.use(express.static(angularDistPath));

  app.get(/^(?!\/api).*$/, (_req, res) => {
    res.sendFile(path.join(angularDistPath, 'index.html'));
  });

  app.post('/api/users', (req, res)=> {
    return res.status(201).send(req.body); 
    //Here, to be implemented into actually adding the user info to the database.
    //For now it just returns the user's parameters.
  })

  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
}

main().catch((err) => {
  console.error("Error starting server:", err);
});
