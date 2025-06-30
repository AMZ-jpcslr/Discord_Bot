// test_p2pquake.js
const { fetch } = require('undici');

(async () => {
  const res = await fetch('https://www.jma.go.jp/bosai/quake/data/list.json');
  const json = await res.json();
  console.log(json); // 最新の地震情報リスト
  // 最新1件の詳細を取得
  if (json.length > 0) {
    const latestId = json[0].json;
    const detailRes = await fetch(`https://www.jma.go.jp/bosai/quake/data/${latestId}`);
    const detail = await detailRes.json();
    console.log(detail);
  }
})();