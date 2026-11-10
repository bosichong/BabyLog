export interface ErrorNotification {
  message: string
  status?: number
}

type Listener = (notification: ErrorNotification) => void

const listeners = new Set<Listener>()

export function notifyError(message: string, status?: number) {
  const notification = { message: message.trim() || '操作失败，原因未知', status }
  listeners.forEach((listener) => listener(notification))
}

export function subscribeErrorNotifications(listener: Listener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
