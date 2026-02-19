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
    const stationUrl = new URL(
      "https://apis.data.go.kr/6410000/busstationservice/v2/getBusStationListv2"
    );

    stationUrl.searchParams.append("serviceKey", API_KEY);
    stationUrl.searchParams.append("keyword", station);
    stationUrl.searchParams.append("pageNo", "1");
    stationUrl.searchParams.append("numOfRows", "10");

    const stationRes = await fetch(stationUrl.toString());
    const stationJson = await stationRes.json();

    if (stationJson.response.msgHeader.resultCode !== 0) {
      return res.status(500).json({ error: "정류장 API 실패", raw: stationJson });
    }

    const stationList = stationJson.response.msgBody.busStationList;

    if (!stationList || stationList.length === 0) {
      return res.status(404).json({ error: "정류장 없음" });
    }

    // 2️⃣ 여러 정류장 중 실제 route가 존재하는 정류장 찾기
    for (const s of stationList) {
      const arrivalUrl = new URL(
        "https://apis.data.go.kr/6410000/busarrivalservice/v2/getBusArrivalListv2"
      );

      arrivalUrl.searchParams.append("serviceKey", API_KEY);
      arrivalUrl.searchParams.append("stationId", s.stationId);

      const arrivalRes = await fetch(arrivalUrl.toString());
      const arrivalJson = await arrivalRes.json();

      if (arrivalJson.response.msgHeader.resultCode !== 0) {
        continue;
      }

      const arrivalList = arrivalJson.response.msgBody.busArrivalList;

      if (!arrivalList) continue;

      const bus = arrivalList.find(
        item =>
          item.routeName == route ||
          item.routeNm == route ||
          item.routeId == route
      );

      if (bus) {
        return res.status(200).json({
          station: s.stationName,
          route,
          firstArrival: bus.predictTime1,
          secondArrival: bus.predictTime2
        });
      }
    }

    return res.status(404).json({ error: "해당 노선 없음" });

  } catch (err) {
    return res.status(500).json({
      error: "서버 오류",
      detail: err.message
    });
  }
};
