/**
 * @jest-environment node
 */
import { createServer } from "http";

import { NextRequest } from "next/server";
// eslint-disable-next-line import/no-extraneous-dependencies
import supertest from "supertest";

type NextRouteHandler = (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => Promise<Response>;

interface RouteMap {
  GET?: NextRouteHandler;
  POST?: NextRouteHandler;
  PUT?: NextRouteHandler;
  DELETE?: NextRouteHandler;
}

export function createApp(routes: RouteMap, paramExtractor?: (url: URL) => Record<string, string>) {
  const server = createServer(async (nodeReq, nodeRes) => {
    const chunks: Buffer[] = [];
    for await (const chunk of nodeReq) chunks.push(chunk as Buffer);
    const body = Buffer.concat(chunks).toString();

    const url = new URL(nodeReq.url!, `http://localhost`);
    const method = (nodeReq.method ?? "GET").toUpperCase();

    const handler = routes[method as keyof RouteMap];
    if (!handler) {
      nodeRes.statusCode = 405;
      nodeRes.end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const nextReq = new NextRequest(url, {
      method,
      headers: nodeReq.headers as HeadersInit,
      ...(body && method !== "GET" && method !== "HEAD" ? { body } : {}),
    });

    const ctx = paramExtractor ? { params: Promise.resolve(paramExtractor(url)) } : undefined;

    const nextRes = await handler(nextReq, ctx);

    nodeRes.statusCode = nextRes.status;
    nextRes.headers.forEach((v, k) => nodeRes.setHeader(k, v));
    const resBody = await nextRes.arrayBuffer();
    nodeRes.end(Buffer.from(resBody));
  });

  return supertest(server);
}
