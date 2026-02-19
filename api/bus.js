export default async function handler(req, res) {
  try {
    const { station, route } = req.query;

    if (!station || !route) {
      return res.status(400).json({ error: "station과 route가 필요합니다." });
    }

    const API_KEY = process.env.GYEONGGI_KEY;

    // 1️⃣ 정류장 검색 (1개만)
    const stationRes = await fetch(
      `https://apis.data.go.kr/6410000/busstationservice/v2/getBusStationList?serviceKey=${API_KEY}&keyword=${encodeURIComponent(
        station
      )}&pageNo=1&numOfRows=1&format=json`
    );

    const stationData = await stationRes.json();
    const stationList = stationData.response?.msgBody?.busStationList;

    if (!stationList || stationList.length === 0) {
      return res.status(404).json({ error: "정류장 없음" });
    }

    const stationId = stationList[0].stationId;

    // 2️⃣ 도착 정보 조회
    const arrivalRes = await fetch(
      `https://apis.data.go.kr/6410000/busarrivalservice/v2/getBusArrivalListV2?serviceKey=${API_KEY}&stationId=${stationId}&format=json`
    );

    const arrivalData = await arrivalRes.json();
    const arrivals = arrivalData.response?.msgBody?.busArrivalList;

    if (!arrivals) {
      return res.status(404).json({ error: "도착 정보 없음" });
    }

    const bus = arrivals.find((item) => item.routeName == route);

    if (!bus) {
      return res.status(404).json({ error: "해당 노선 없음" });
    }

    return res.status(200).json({
      station,
      route,
      firstArrival: bus.predictTime1,
      secondArrival: bus.predictTime2
    });

  } catch (err) {
    return res.status(500).json({ error: "서버 오류", detail: err.message });
  }
}
