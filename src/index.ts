import express from 'express';
import path from 'path';

const app = express();
app.use(express.json());

// API
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
  console.log('Server running on http://localhost:3000');
});
