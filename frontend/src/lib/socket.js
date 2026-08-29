import { io } from 'socket.io-client'

let socket = null

export function initSocket() {
  if (socket) return socket

  socket = io('http://localhost:5000', {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  })

  socket.on('connect', () => {
    console.log('Socket.IO connected:', socket.id)
  })

  socket.on('disconnect', () => {
    console.log('Socket.IO disconnected')
  })

  socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error)
  })

  return socket
}

export function getSocket() {
  return socket
}

export function closeSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
