換気・湿度チェッカー PWA化ファイル

含まれるもの:
- index.html / style.css / script.js: 既存アプリ
- manifest.json: ホーム画面インストール用設定
- service-worker.js: アプリ資産のオフラインキャッシュ
- pwa-register.js: Service Worker登録
- icons/: アプリアイコン

重要:
PWAのインストールとService Workerは、原則としてHTTPS配信（またはlocalhost）で利用します。
このフォルダをスマホへコピーして file:// で開くだけでは、PWAとしてのインストールや位置情報取得は保証されません。
このパッケージはPWA対応のアプリ側ファイルを用意した段階です。一般公開せずにAndroidへ導入する配信方法は別途設定が必要です。
オフライン時はキャッシュ済みの画面と計算機能が利用できます。現在地の気象データ取得にはインターネット接続が必要です。
