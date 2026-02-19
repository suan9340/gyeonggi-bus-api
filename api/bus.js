module.exports = async function handler(req, res) {
  try {
    const { station, route } = req.query;

    if (!station || !route) {
      return res.status(400).json({ error: "station과 route가 필요합니다." });
    }

    const API_KEY = process.env.GYEONGGI_KEY;

    if (!API_KEY) {
      return res.status(500).json({ error: "API 키 없음" });
    }

    // 1️⃣ 정류장 검색
    const stationRes = await fetch(
      `https://apis.data.go.kr/6410000/busstationservice/v2/getBusStationList?serviceKey=${API_KEY}&keyword=${station}&pageNo=1&numOfRows=5`
    );

    const stationText = await stationRes.text();

    const stationIdMatch = stationText.match(/<stationId>(.*?)<\/stationId>/);

    if (!stationIdMatch) {
      return res.status(404).json({ error: "정류장 없음", raw: stationText });
    }

    const stationId = stationIdMatch[1];

    // 2️⃣ 도착 조회
    const arrivalRes = await fetch(
      `https://apis.data.go.kr/6410000/busarrivalservice/v2/getBusArrivalListV2?serviceKey=${API_KEY}&stationId=${stationId}`
    );

    const arrivalText = await arrivalRes.text();

    const routeMatch = arrivalText.match(
      new RegExp(
        `<routeName>${route}<\\/routeName>[\\s\\S]*?<predictTime1>(.*?)<\\/predictTime1>[\\s\\S]*?<predictTime2>(.*?)<\\/predictTime2>`
      )
    );

    if (!routeMatch) {
      return res.status(404).json({ error: "해당 노선 없음", raw: arrivalText });
    }

    return res.status(200).json({
      station,
      route,
      firstArrival: routeMatch[1],
      secondArrival: routeMatch[2]
    });

  } catch (err) {
    return res.status(500).json({
      error: "서버 오류",
      detail: err.message
    });
  }
};
