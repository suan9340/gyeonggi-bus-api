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

    // 🔥 1️⃣ 정류장 조회 (JSON 응답)
    const stationUrl = new URL(
      "https://apis.data.go.kr/6410000/busstationservice/v2/getBusStationListv2"
    );

    stationUrl.searchParams.append("serviceKey", API_KEY);
    stationUrl.searchParams.append("keyword", station);
    stationUrl.searchParams.append("pageNo", "1");
    stationUrl.searchParams.append("numOfRows", "5");

    const stationRes = await fetch(stationUrl.toString());
    const stationJson = await stationRes.json();

    if (stationJson.response.msgHeader.resultCode !== 0) {
      return res.status(500).json({ error: "정류장 API 실패", raw: stationJson });
    }

    const stationList = stationJson.response.msgBody.busStationList;

    if (!stationList || stationList.length === 0) {
      return res.status(404).json({ error: "정류장 없음" });
    }

    const stationId = stationList[0].stationId;

    // 🔥 2️⃣ 도착 조회 (JSON 응답)
    const arrivalUrl = new URL(
      "https://apis.data.go.kr/6410000/busarrivalservice/v2/getBusArrivalListv2"
    );

    arrivalUrl.searchParams.append("serviceKey", API_KEY);
    arrivalUrl.searchParams.append("stationId", stationId);

    const arrivalRes = await fetch(arrivalUrl.toString());
    const arrivalJson = await arrivalRes.json();

    if (arrivalJson.response.msgHeader.resultCode !== 0) {
      return res.status(500).json({ error: "도착 API 실패", raw: arrivalJson });
    }

    const arrivalList = arrivalJson.response.msgBody.busArrivalList;

    const bus = arrivalList.find(item => item.routeName == route);

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
    return res.status(500).json({
      error: "서버 오류",
      detail: err.message
    });
  }
};
