import { apiFetch } from "./src/app/apiClient";
import fetch from "node-fetch";

// Polyfill fetch for node
(global as any).fetch = fetch;

async function test() {
  try {
    const res = await apiFetch("/tenants/get-role/99774bda-ea73-49d6-9bf8-fcbfef2967ba", { skipAuth: false, headers: { Authorization: "Bearer " + process.env.TOKEN }});
    console.log(JSON.stringify(res, null, 2));
  } catch(e) {
    console.error(e);
  }
}
test();
