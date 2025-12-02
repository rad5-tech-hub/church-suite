import Pusher from "pusher-js";
import { store } from "../reduxstore/redux";


export function createPusherClient(token: string) {
  return new Pusher(import.meta.env.VITE_PUSHER_KEY, {
    cluster: import.meta.env.VITE_PUSHER_CLUSTER,
    forceTLS: true,
    authEndpoint:  `${import.meta.env.VITE_API_BASE_URL}/tenants/pusher`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
        "x-tenant-id": store.getState().auth?.authData?.tenantId || "",
      },
    },
  });
}
