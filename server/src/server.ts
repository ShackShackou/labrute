import express = require('express');
import path from 'path';

import { Version } from '@labrute/core';
import bodyParser from 'body-parser';
import cors from 'cors';
import schedule from 'node-schedule';
import cookieParser from 'cookie-parser';
import { doubleCsrf } from 'csrf-csrf';
import { GLOBAL, ServerContext } from './context.js';
import { dailyJob } from './dailyJob.js';
import './i18n.js';
import { initRoutes } from './routes.js';
import { lockMiddleware } from './utils/middlewares/locks.js';
import { readyCheck } from './utils/middlewares/readyCheck.js';

export function main(cx: ServerContext) {
  cx.logger.info(`Server started (v${Version})`);

  const app = express();
  const { port } = cx.config;

  // Cookie parser
  app.use(cookieParser(cx.config.cookieSecret));

  // CORS
  app.use(cors({
    origin: cx.config.corsRegex,
    credentials: true,
  }));

  // CSRF COMPLETELY DISABLED FOR DEV
  // const {
  //   generateToken,
  //   doubleCsrfProtection,
  // } = doubleCsrf({
  //   getSecret: () => cx.config.csrfSecret,
  //   cookieName: 'csrfToken',
  //   cookieOptions: {
  //     secure: process.env.NODE_ENV === 'production',
  //   },
  // });

  // CSRF getter - Return fake token for dev
  app.get('/api/csrf', (req, res) => {
    res.json({ csrfToken: 'dev-token' });
  });

  // No CSRF middleware - completely disabled for dev

  app.use(bodyParser.json());
  app.use(
    bodyParser.urlencoded({
      extended: true,
    }),
  );
  app.use(lockMiddleware);
  app.use(readyCheck);

  app.listen(port, () => {
    cx.logger.info(`Server listening on port ${port}`);

    // Trigger daily job
    dailyJob(cx.prisma)().catch((error: Error) => {
      cx.discord.sendError(error);
    });

    // Initialize daily scheduler
    schedule.scheduleJob('0 0 * * *', dailyJob(cx.prisma));
  });

  initRoutes(app, cx.config, cx.prisma);

  // Serve static files from React build
  const buildPath = path.join(process.cwd(), '..', 'client', 'build');
  app.use(express.static(buildPath));

  // Handle React Router - send all non-API requests to index.html
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(buildPath, 'index.html'));
    }
  });
}

/**
 * Initialize the global context, then run `main`
 */
export function mainWrapper() {
  // Note: We don't dispose the global context since the server is expected to
  // run forever
  main(GLOBAL);
}
