// This module can be expanded to simulate latency and CRUD endpoints.
export async function delay(ms = 600) {
  return new Promise((res) => setTimeout(res, ms))
}
