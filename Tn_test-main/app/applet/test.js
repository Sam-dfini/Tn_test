// test.js
async function test() {
  const url = "https://www.businessnews.com.tn/rss";
  const proxy = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
  const res = await fetch(proxy);
  const data = await res.json();
  console.log(JSON.stringify(data).substring(0, 500));
}
test();
