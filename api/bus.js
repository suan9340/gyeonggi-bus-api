module.exports = async function handler(req, res) {
  try {
    const { station, route } = req.query;

    if (!station || !route) {
      return res.status(400).json({ error: "station과 route가 필요합니다." });
    }

    const API_KEY = process.env.GYEONGGI_KEY;

    // 1️⃣ 정류장 검색
    const stationUrl = new URL(
      "https://apis.data.go.kr/6410000/busstationservice/v2/getBusStationListv2"
    );

    stationUrl.searchParams.append("serviceKey", API_KEY);
    stationUrl.searchParams.append("keyword", station);
    stationUrl.searchParams.append("pageNo", "1");
    stationUrl.searchParams.append("numOfRows", "10");

    const stationRes = await fetch(stationUrl);
    const stationJson = await stationRes.json();

    const stationList = stationJson.response?.msgBody?.busStationList;

    if (!stationList || stationList.length === 0) {
      return res.status(404).json({ error: "정류장 없음" });
    }

    // 2️⃣ 여러 정류장 중 해당 노선 찾기
    for (const s of stationList) {

      const arrivalUrl = new URL(
        "https://apis.data.go.kr/6410000/busarrivalservice/v2/getBusArrivalListv2"
      );

      arrivalUrl.searchParams.append("serviceKey", API_KEY);
      arrivalUrl.searchParams.append("stationId", s.stationId);

      const arrivalRes = await fetch(arrivalUrl);
      const arrivalJson = await arrivalRes.json();

      const resultCode = arrivalJson.response?.msgHeader?.resultCode;
      if (resultCode !== 0) continue;

      let arrivalList = arrivalJson.response?.msgBody?.busArrivalList;
      if (!arrivalList) continue;

      if (!Array.isArray(arrivalList)) {
        arrivalList = [arrivalList];
      }

      const bus = arrivalList.find(item =>
        item.routeName == route ||
        item.routeNm == route ||
        item.routeId == route
      );

      if (bus) {
        // 🔥 초 → 분/초 변환
        const sec1 = parseInt(bus.arrivalSec1 || 0);
        const sec2 = parseInt(bus.arrivalSec2 || 0);

        const firstMin = Math.floor(sec1 / 60);
        const firstSec = sec1 % 60;

        const secondMin = Math.floor(sec2 / 60);
        const secondSec = sec2 % 60;

        return res.status(200).json({
          station: s.stationName,
          route,
          firstArrival: `${firstMin}분 ${firstSec}초`,
          secondArrival: `${secondMin}분 ${secondSec}초`
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
