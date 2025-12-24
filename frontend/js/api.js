const API_URL = "http://127.0.0.1:8000";

async function apiGet(path) {
  const res = await fetch(API_URL + path);
  return res.json();
}

async function apiPost(path, body) {
  const res = await fetch(API_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  return res.json();
}
