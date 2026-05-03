async function test() {
  const sources = [
    "https://www.businessnews.com.tn/rss",
    "https://www.espacemanager.com/rss",
    "https://www.shemsfm.net/rss",
    "https://www.france24.com/en/tunisia/rss"
  ];
  const proxy = "https://api.rss2json.com/v1/api.json?rss_url=";
  
  for (const s of sources) {
    console.log("Fetching", s);
    try {
      const res = await fetch(proxy + encodeURIComponent(s));
      const data = await res.json();
      console.log("Status:", data.status);
      if (data.items) {
        console.log("Items found:", data.items.length);
        console.log("First item title:", data.items[0].title);
      } else {
        console.log("Error:", data.message);
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}
test();
