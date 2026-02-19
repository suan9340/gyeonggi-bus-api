export default async function handler(req, res) {
  try {
    const { station, route } = req.query;

    if (!station || !route) {
      return res.status(400).json({ error: "station과 route가 필요합니다." });
    }

    const API_KEY = process.env.GYEONGGI_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "API 키가 설정되지 않았습니다." });
    }

    // 🔥 encodeURIComponent 제거
    const serviceKey = API_KEY;

    // 1️⃣ 정류장 검색
    const stationRes = await fetch(
      `https://apis.data.go.kr/6410000/busstationservice/v2/getBusStationList?serviceKey=${serviceKey}&keyword=${station}&pageNo=1&numOfRows=5`
    );

    const stationText = await stationRes.text();

    if (stationText.includes("API not found")) {
      return res.status(500).json({ error: "정류장 API 호출 실패", detail: stationText });
    }

    const stationIdMatches = [
      ...stationText.matchAll(/<stationId>(.*?)<\/stationId>/g),
    ];

    if (!stationIdMatches.length) {
      return res.status(404).json({ error: "정류장 없음" });
    }

    const stationId = stationIdMatches[0][1];

    // 2️⃣ 도착 정보 조회
    const arrivalRes = await fetch(
      `https://apis.data.go.kr/6410000/busarrivalservice/v2/getBusArrivalListV2?serviceKey=${serviceKey}&stationId=${stationId}`
    );

    const arrivalText = await arrivalRes.text();

    if (arrivalText.includes("API not found")) {
      return res.status(500).json({ error: "도착 API 호출 실패", detail: arrivalText });
    }

    const routeRegex = new RegExp(
      `<routeName>${route}<\\/routeName>[\\s\\S]*?<predictTime1>(.*?)<\\/predictTime1>[\\s\\S]()
