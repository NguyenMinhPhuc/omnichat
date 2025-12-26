export async function getJSON(url: string) {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function postJSON(url: string, body: any) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function putJSON(url: string, body: any) {
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function patchJSON(url: string, body: any) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function del(url: string) {
  const res = await fetch(url, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
