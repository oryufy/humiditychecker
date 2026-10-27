
"use strict";

// 飽和水蒸気圧（hPa）
function saturationVaporPressure(tempC) {
  return 6.112 * Math.exp(
    (17.67 * tempC) / (tempC + 243.5)
  );
}

// 絶対湿度（g/m³）
function absoluteHumidity(tempC, rhPercent) {
  const vaporPressure =
    saturationVaporPressure(tempC) * rhPercent / 100;

  return 216.7 * vaporPressure / (tempC + 273.15);
}

// 指定した温度での相対湿度（%）
function relativeHumidityAtTemperature(
  vaporPressureHpa,
  tempC
) {
  return 100 * vaporPressureHpa /
    saturationVaporPressure(tempC);
}

function readNumber(id) {
  const input = document.getElementById(id);

  if (input.value.trim() === "") {
    return null;
  }

  const value = Number(input.value);

  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

function validConditions(temp, rh) {
  return temp !== null &&
    rh !== null &&
    temp >= -50 &&
    temp <= 60 &&
    rh >= 0 &&
    rh <= 100;
}

function setText(id, text) {
  document.getElementById(id).textContent = text;
}


function setVerdict(id, text, type) {
  const element = document.getElementById(id);
  element.textContent = text;
  element.classList.remove(
    "increase",
    "decrease",
    "neutral"
  );
  element.classList.add(type);
}

function calculate() {
  const indoorTemp = readNumber("indoorTemp");
  const indoorRH = readNumber("indoorRH");
  const outdoorTemp = readNumber("outdoorTemp");
  const outdoorRH = readNumber("outdoorRH");

  const indoorValid =
    validConditions(indoorTemp, indoorRH);
  const outdoorValid =
    validConditions(outdoorTemp, outdoorRH);

  if (!indoorValid || !outdoorValid) {
    setText("indoorAH", "--");
    setText("outdoorAH", "--");
    setText("waterVerdict", "入力値を確認してください");
    setText("waterDifference", "");
    setText("estimatedRH", "--");
    setText("humidityVerdict", "");
    return;
  }

  const indoorAH =
    absoluteHumidity(indoorTemp, indoorRH);
  const outdoorAH =
    absoluteHumidity(outdoorTemp, outdoorRH);

  const difference = outdoorAH - indoorAH;
  const tolerance = 0.2;

  setText("indoorAH", indoorAH.toFixed(1));
  setText("outdoorAH", outdoorAH.toFixed(1));

  if (difference > tolerance) {
    setVerdict(
      "waterVerdict",
      "↑ 増える：外気の水蒸気量が多い",
      "increase"
    );
  } else if (difference < -tolerance) {
    setVerdict(
      "waterVerdict",
      "↓ 減る：外気の水蒸気量が少ない",
      "decrease"
    );
  } else {
    setVerdict(
      "waterVerdict",
      "→ ほぼ同じ",
      "neutral"
    );
  }


  const sign = difference > 0 ? "+" : "";
  setText(
    "waterDifference",
    `屋外 − 室内：${sign}${difference.toFixed(1)} g/m³`
  );

  // 外気の水蒸気分圧を保ったまま室温まで暖める
  const outdoorVaporPressure =
    saturationVaporPressure(outdoorTemp) *
    outdoorRH / 100;

  const estimatedRH = relativeHumidityAtTemperature(
    outdoorVaporPressure,
    indoorTemp
  );

  setText("estimatedRH", estimatedRH.toFixed(1));

  const rhDifference = estimatedRH - indoorRH;
  if (rhDifference > 0.5) {
    setVerdict(
        "humidityVerdict",
        "↑ 上がる：室温まで暖めても湿度が高い",
        "increase"
    );
    } else if (rhDifference < -0.5) {
        setVerdict(
            "humidityVerdict",
            "↓ 下がる：室温まで暖めると乾燥する",
            "decrease"
        );
    } else {
        setVerdict(
            "humidityVerdict",
            "→ ほぼ変わらない",
            "neutral"
        );
    }
}

document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", calculate);
});

calculate();


const fetchWeatherButton =
  document.getElementById("fetchWeather");

const weatherStatus =
  document.getElementById("weatherStatus");

function setWeatherStatus(message) {
  weatherStatus.textContent = message;
}

// 現在地を取得し、Open-Meteoから気象データを取得する
async function fetchOutdoorWeather() {
  if (!("geolocation" in navigator)) {
    setWeatherStatus(
      "このブラウザでは位置情報を利用できません。"
    );
    return;
  }

  fetchWeatherButton.disabled = true;
  fetchWeatherButton.textContent = "取得中...";
  setWeatherStatus("現在地を確認しています...");

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: false,
          timeout: 15000,
          maximumAge: 300000
        }
      );
    });

    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;

    setWeatherStatus("屋外の気温・湿度を取得しています...");

    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: "temperature_2m,relative_humidity_2m",
      timezone: "auto"
    });

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params}`
    );

    if (!response.ok) {
      throw new Error(
        `気象APIの通信エラー（HTTP ${response.status}）`
      );
    }

    const data = await response.json();
    const current = data.current;

    if (
      !current ||
      !Number.isFinite(current.temperature_2m) ||
      !Number.isFinite(current.relative_humidity_2m)
    ) {
      throw new Error("気温・湿度のデータが見つかりません。");
    }

    // 屋外入力欄に反映
    document.getElementById("outdoorTemp").value =
      current.temperature_2m;

    document.getElementById("outdoorRH").value =
      current.relative_humidity_2m;

    // 既存の計算処理を実行
    calculate();

    // 取得時刻を表示
    const weatherTime = current.time
      ? current.time.replace("T", " ")
      : "不明";

    const retrievedAt = new Date().toLocaleTimeString(
      "ja-JP",
      { hour: "2-digit", minute: "2-digit" }
    );

    setWeatherStatus(
      `取得成功：気象データ時刻 ${weatherTime} ` +
      `／取得 ${retrievedAt} ` +
      `（現在地付近の推定値）`
    );
  } catch (error) {
    let message = error.message;

    if (error.code !== undefined) {
      switch (error.code) {
        case 1:
          message =
            "位置情報が許可されていません。ブラウザの設定を確認してください。";
          break;
        case 2:
          message =
            "現在地を取得できません。位置情報の設定を確認してください。";
          break;
        case 3:
          message =
            "位置情報の取得がタイムアウトしました。再度お試しください。";
          break;
      }
    }

    setWeatherStatus(`取得できませんでした：${message}`);
  } finally {
    fetchWeatherButton.disabled = false;
    fetchWeatherButton.textContent =
      "現在地から屋外データを取得";
  }
}

fetchWeatherButton.addEventListener(
  "click",
  fetchOutdoorWeather
);
