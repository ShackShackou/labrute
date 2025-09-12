import { UserWithBrutesBodyColor } from '@labrute/core';
import { PrismaClient } from '@labrute/prisma';
import type { Request, Response } from 'express';

export class DevAuth {
  #prisma: PrismaClient;

  public constructor(prisma: PrismaClient) {
    this.#prisma = prisma;
  }

  public async directLogin(req: Request, res: Response<UserWithBrutesBodyColor>) {
    res.header('Access-Control-Allow-Origin', '*');

    try {
      const { userId } = req.params;
      
      if (!userId) {
        throw new Error('User ID required');
      }

      // Get user with brutes
      const user = await this.#prisma.user.findUnique({
        where: { id: userId },
        include: {
          brutes: {
            where: { deletedAt: null },
            orderBy: [
              { favorite: 'desc' },
              { createdAt: 'asc' },
            ],
          },
          following: {
            select: { id: true },
          },
          notifications: {
            where: { read: false },
          },
        },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Generate a stable token if not present
      if (!user.connexionToken) {
        const token = `dev-token-${userId}`;
        await this.#prisma.user.update({
          where: { id: userId },
          data: { connexionToken: token },
        });
        user.connexionToken = token;
      }

      res.send(user);
    } catch (error) {
      console.error('[DevAuth] Error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).send({ error: message } as any);
    }
  }

  public async oauthSimulator(req: Request, res: Response) {
    res.header('Access-Control-Allow-Origin', '*');
    
    const { action } = req.query;
    
    if (action === 'authorize') {
      // Simulate OAuth authorization page
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>OAuth Dev Simulator</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #2c3e50;
              color: white;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            .container {
              background: #34495e;
              padding: 40px;
              border-radius: 10px;
              max-width: 500px;
              text-align: center;
            }
            h1 { color: #3498db; }
            .user-list {
              margin: 30px 0;
            }
            .user-btn {
              display: block;
              width: 100%;
              padding: 15px;
              margin: 10px 0;
              background: #3498db;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 16px;
              transition: background 0.3s;
            }
            .user-btn:hover { background: #2980b9; }
            .info { 
              background: #2c3e50;
              padding: 10px;
              border-radius: 5px;
              margin: 5px 0;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🔐 OAuth Dev - Choisir un compte</h1>
            <div class="user-list" id="userList">
              <p>Chargement des comptes...</p>
            </div>
          </div>
          <script>
            async function loadUsers() {
              try {
                const response = await fetch('http://localhost:9000/api/dev/users');
                const users = await response.json();
                
                const userList = document.getElementById('userList');
                userList.innerHTML = '';
                
                users.forEach(user => {
                  const btn = document.createElement('button');
                  btn.className = 'user-btn';
                  btn.onclick = () => selectUser(user.id);
                  
                  const bruteNames = user.brutes.map(b => b.name).join(', ') || 'Aucune brute';
                  
                  btn.innerHTML = \`
                    <strong>\${user.name}</strong>
                    <div class="info">ID: \${user.id}</div>
                    <div class="info">Brutes: \${bruteNames}</div>
                  \`;
                  
                  userList.appendChild(btn);
                });
                
                if (users.length === 0) {
                  userList.innerHTML = '<p>Aucun compte trouvé</p>';
                }
              } catch (error) {
                document.getElementById('userList').innerHTML = '<p>Erreur: ' + error.message + '</p>';
              }
            }
            
            function selectUser(userId) {
              // Redirect with fake OAuth code
              const code = 'dev-code-' + userId;
              const state = new URLSearchParams(window.location.search).get('state') || '';
              window.location.href = \`http://localhost:3000/oauth/callback?code=\${code}&state=\${state}\`;
            }
            
            loadUsers();
          </script>
        </body>
        </html>
      `;
      res.send(html);
    } else {
      // Default redirect to authorize
      const state = req.query.state || '';
      res.redirect(`/api/dev/oauth?action=authorize&state=${state}`);
    }
  }

  public async getUsers(req: Request, res: Response) {
    res.header('Access-Control-Allow-Origin', '*');
    
    try {
      const users = await this.#prisma.user.findMany({
        select: {
          id: true,
          name: true,
          brutes: {
            where: { deletedAt: null },
            select: {
              id: true,
              name: true,
              level: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
      
      res.json(users);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).json({ error: message });
    }
  }

  public async devToken(req: Request, res: Response<UserWithBrutesBodyColor>) {
    res.header('Access-Control-Allow-Origin', '*');
    
    try {
      const { code } = req.query;
      
      if (!code || typeof code !== 'string') {
        throw new Error('Invalid code');
      }
      
      // Extract userId from dev code
      if (!code.startsWith('dev-code-')) {
        throw new Error('Invalid dev code format');
      }
      
      const userId = code.replace('dev-code-', '');
      
      // Get user
      const user = await this.#prisma.user.findUnique({
        where: { id: userId },
        include: {
          brutes: {
            where: { deletedAt: null },
            orderBy: [
              { favorite: 'desc' },
              { createdAt: 'asc' },
            ],
          },
          following: {
            select: { id: true },
          },
          notifications: {
            where: { read: false },
          },
        },
      });
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Ensure user has a token
      if (!user.connexionToken) {
        const token = `dev-token-${userId}`;
        await this.#prisma.user.update({
          where: { id: userId },
          data: { connexionToken: token },
        });
        user.connexionToken = token;
      }
      
      res.send(user);
    } catch (error) {
      console.error('[DevAuth] Token error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      res.status(500).send({ error: message } as any);
    }
  }
}