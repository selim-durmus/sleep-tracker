async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body) headers['Content-Type'] = 'application/json';
  const res = await fetch(path, { ...options, headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.status === 204 ? null : res.json();
}

export const api = {
  listEntries: (from, to) => {
    const qs = from && to ? `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` : '';
    return request(`/api/entries${qs}`);
  },
  latestEntry: () => request('/api/entries/latest'),
  createEntry: (start_time, end_time) =>
    request('/api/entries', {
      method: 'POST',
      body: JSON.stringify({ start_time, end_time })
    }),
  updateEntry: (id, patch) =>
    request(`/api/entries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch)
    }),
  deleteEntry: (id) =>
    request(`/api/entries/${id}`, { method: 'DELETE' })
};
