import { connect } from 'node:net';

export interface ReadinessCheck {
  name: string;
  run: () => Promise<void>;
}

/**
 * Checks that a TCP endpoint accepts connections.
 * Temporary until Prisma lands (stage 2): then the database check becomes `SELECT 1`.
 */
export function tcpCheck(name: string, url: string, timeoutMs = 1000): ReadinessCheck {
  const { hostname, port } = new URL(url);
  return {
    name,
    run: () =>
      new Promise<void>((resolve, reject) => {
        const socket = connect({ host: hostname, port: Number(port) });
        const fail = (error: Error) => {
          socket.destroy();
          reject(error);
        };
        socket.setTimeout(timeoutMs, () => fail(new Error(`timeout after ${timeoutMs}ms`)));
        socket.once('error', fail);
        socket.once('connect', () => {
          socket.end();
          resolve();
        });
      }),
  };
}
