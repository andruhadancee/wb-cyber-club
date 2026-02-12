require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');

const tournamentsRouter = require('./routes/tournaments.cjs');
const teamsRouter = require('./routes/teams.cjs');
const calendarRouter = require('./routes/calendar.cjs');
const disciplinesRouter = require('./routes/disciplines.cjs');
const linksRouter = require('./routes/links.cjs');
const regulationsRouter = require('./routes/regulations.cjs');
const socialRouter = require('./routes/social.cjs');
const archiveAutoRouter = require('./routes/archive-auto.cjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Auth для dev-стенда (DEV_AUTH=true)
if (process.env.DEV_AUTH === 'true') {
  const devUser = process.env.DEV_USER || 'dev';
  const devPass = process.env.DEV_PASS || 'dev123';
  app.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="Dev"');
      return res.status(401).send('Authorization required');
    }
    const [user, pass] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    if (user === devUser && pass === devPass) return next();
    res.setHeader('WWW-Authenticate', 'Basic realm="Dev"');
    return res.status(401).send('Invalid credentials');
  });
  console.log(`[DEV] Basic Auth enabled (user: ${devUser})`);
}

// API routes
app.use('/api/tournaments', tournamentsRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/calendar', calendarRouter);
app.use('/api/disciplines', disciplinesRouter);
app.use('/api/links', linksRouter);
app.use('/api/regulations', regulationsRouter);
app.use('/api/social', socialRouter);
app.use('/api/archive-auto', archiveAutoRouter);

// Serve static frontend (production)
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback — все не-API маршруты отдают index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
