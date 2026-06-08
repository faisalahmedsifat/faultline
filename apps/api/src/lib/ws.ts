import type { ServerWebSocket } from "bun";

export type WSData = { projectId: string };
export type WSNotification = {
  type: "new_error";
  errorId: string;
  title: string;
  count: number;
};

const connections = new Map<string, Set<ServerWebSocket<WSData>>>();

export function addConnection(ws: ServerWebSocket<WSData>) {
  const { projectId } = ws.data;
  if (!connections.has(projectId)) {
    connections.set(projectId, new Set());
  }
  connections.get(projectId)!.add(ws);
}

export function removeConnection(ws: ServerWebSocket<WSData>) {
  const { projectId } = ws.data;
  const set = connections.get(projectId);
  if (!set) return;
  set.delete(ws);
  if (set.size === 0) {
    connections.delete(projectId);
  }
}

export function broadcast(projectId: string, notification: WSNotification) {
  const clients = connections.get(projectId);
  if (!clients || clients.size === 0) return;

  const message = JSON.stringify(notification);

  for (const ws of clients) {
    try {
      ws.send(message);
    } catch {
      clients.delete(ws);
    }
  }

  if (clients.size === 0) {
    connections.delete(projectId);
  }
}
