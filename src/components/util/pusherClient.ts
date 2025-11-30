import Pusher from "pusher-js";

export function createPusherClient(token: string) {
  return new Pusher(import.meta.env.VITE_PUSHER_KEY, {
    cluster: import.meta.env.VITE_PUSHER_CLUSTER,
    forceTLS: true,
    authEndpoint:  `${import.meta.env.VITE_API_BASE_URL}/pusher/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
}
