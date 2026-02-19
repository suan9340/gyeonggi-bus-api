export default async function handler(req, res) {
  try {
    const { station, route } = req.query;

    if (!station || !route) {
      return res.status(400).json({ error: "station과 route가 필요합니다." });
    }

    const API_KEY = process.env.GYEONGGI_KEY;

   // 1️⃣ 정류장 검색 (여러 개 조회)
const stationRes = await fetch(
  `https://apis.data.go.kr/6410000/busstationservice/v2/getBusStationList?serviceKey=${API_KEY}&keyword=${encodeURIComponent(
    station
  )}&pageNo=1&numOfRows=5`
);

const stationText = await stationRes.text();

const stationIdMatches = [...stationText.matchAll(/<stationId>(.*?)<\/stationId>/g)];

if (!stationIdMatches.length) {
  return res.status(404).json({ error: "정류장 없음" });
}

// 첫 번째 결과 사용 (필요시 고도화 가능)
const stationId = stationIdMatches[0][1];

    // 2️⃣ 도착 정보 조회
    const arrivalRes = await fetch(
      `https://apis.data.go.kr/6410000/busarrivalservice/v2/getBusArrivalListV2?serviceKey=${API_KEY}&stationId=${stationId}`
    );

    const arrivalText = await arrivalRes.text();

    const routeRegex = new RegExp(
      `<routeName>${route}<\\/routeName>[\\s\\S]*?<predictTime1>(.*?)<\\/predictTime1>[\\s\\S]*?<predictTime2>(.*?)<\\/predictTime2>`
    );

    const match = arrivalText.match(routeRegex);

    if (!match) {
      return res.status(404).json({ error: "해당 노선 없음" });
    }

    return res.status(200).json({
      station,
      route,
      firstArrival: match[1],
      secondArrival: match[2]
    });

  } catch (err) {
    return res.status(500).json({ error: "서버 오류", detail: err.message });
  }
}
