export type Handler<Env> = (req: Request & { params: Record<string, string> }, env: Env) => Promise<Response>;

interface Route<Env> {
  method: string;
  pattern: RegExp;
  handler: Handler<Env>;
  paramNames: string[];
}

export class Router<Env> {
  private routes: Route<Env>[] = [];

  private addRoute(method: string, path: string, handler: Handler<Env>) {
    const paramNames: string[] = [];
    const regexPath = path.replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)';
    });
    this.routes.push({
      method,
      pattern: new RegExp(`^${regexPath}$`),
      handler,
      paramNames,
    });
  }

  get(path: string, handler: Handler<Env>) { this.addRoute('GET', path, handler); }
  post(path: string, handler: Handler<Env>) { this.addRoute('POST', path, handler); }
  put(path: string, handler: Handler<Env>) { this.addRoute('PUT', path, handler); }
  delete(path: string, handler: Handler<Env>) { this.addRoute('DELETE', path, handler); }

  async handle(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method;

    for (const route of this.routes) {
      if (route.method !== method) continue;
      const match = url.pathname.match(route.pattern);
      if (!match) continue;

      const params: Record<string, string> = {};
      for (let i = 0; i < route.paramNames.length; i++) {
        params[route.paramNames[i]] = decodeURIComponent(match[i + 1]);
      }

      const req = Object.create(request);
      req.params = params;

      try {
        return await route.handler(req, env);
      } catch (err: any) {
        return Response.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
      }
    }

    return new Response('Not Found', { status: 404 });
  }
}
