import fetch from 'node-fetch';

async function triggerSync() {
  try {
    const response = await fetch('http://localhost:3000/api/rss/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    const data = await response.json();
    console.log("Sync result:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Sync trigger failed:", error);
  }
}

triggerSync();
