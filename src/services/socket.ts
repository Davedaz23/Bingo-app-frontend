import { io, Socket } from 'socket.io-client';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

let socket: Socket | null = null;
const joinedRooms: string[] = [];

export function getSocket(token?: string): Socket {
  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  socket.on('disconnect', () => {});
  socket.on('connect_error', () => {});

  return socket;
}

export function joinRoom(room: string) {
  if (!socket || joinedRooms.includes(room)) return;
  socket.emit('join', { room });
  joinedRooms.push(room);
}

export function leaveRoom(room: string) {
  if (!socket) return;
  socket.emit('leave', { room });
  const idx = joinedRooms.indexOf(room);
  if (idx > -1) joinedRooms.splice(idx, 1);
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  joinedRooms.length = 0;
}

export { socket };
