// PWAのオフライン対応を登録する。非対応ブラウザでは何もしない。
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js")
      .catch((error) => {
        console.error("Service Workerの登録に失敗しました:", error);
      });
  });
}
