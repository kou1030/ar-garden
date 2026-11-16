# 小さな異世界の庭

AR.js + A-Frame によるマーカーベースWeb AR。オリジナルの芽と結晶のマーカーを映すと、浮島・樹木・泉・橋・浮遊結晶が現れます。昼／夕暮れ／夜、光を5つ集めて開花、アニメーション停止、リセットに対応。

## 起動

公開先: https://kou1030.github.io/ar-garden/ （公開状況は提出用レポートを参照）

スマートフォンのSafari/ChromeでHTTPS URLを開く → マーカーを紙または別画面に準備 →「カメラで庭をひらく」→カメラ許可。黒枠を全部映してください。カメラ映像は端末内で処理し、保存・送信しません。音声・位置情報は使用しません。

`marker.html` は印刷対応。黒枠外寸約10cm、白余白を残す。明るい場所で30〜60cmから試し、反射や強い影を避ける。マーカーの物理寸法に対して庭の相対スケールを定義しています。厳密な実寸測定用途ではありません。

カメラなしプレビューはCGだけの確認用で、AR動作確認の代わりにはなりません。`diagnostics.html` は同梱PNGを静止画入力に使った認識テストです。

## GitHub Pages

このフォルダの中身をリポジトリ直下へ配置。Settings → Pages → Deploy from a branch → main / (root) → Save。反映後に公開URLで確認してください。ビルド・有料サービス・APIキーは不要です。

ローカル確認: `python -m http.server 8000` → http://localhost:8000 。スマホでLANのHTTPアドレスを開いてもカメラは通常動作しないためHTTPSのPagesを使用します。

## ファイル

- index.html / style.css / garden.js: アプリ
- assets/garden-marker.png: 提出・印刷用マーカー
- assets/garden-symbol.png: 元の図柄
- assets/garden.patt: 16×16×3色×4方向の認識データ
- assets/camera_para.dat: AR.js標準カメラ校正データ
- vendor/: 固定版の無料ライブラリ
- diagnostics.html: 静止画マーカー認識の検証用

## 実装と制約

パターンマーカーの姿勢をAR.jsが推定し、A-Frameのマーカー子要素としてCGを描画。透過WebGLキャンバスをカメラ映像に重ねます。ローポリゴン形状はJavaScriptで生成し、外部モデルやテクスチャは使用しません。結晶の回転・上下動、波紋、光の移動をアニメーションで表現します。時間帯でCG照明と泉の色が変わります。実写の明るさは変えません。

実機未確認の項目: iOS/Androidでのカメラ起動・背面選択、印刷物の認識距離・角度・追従精度、画面回転、長時間の発熱・fps、実際の重畳画像。マーカーが隠れると庭は消えます。実物によるCG遮蔽や環境光推定はありません。

## 出典

- A-Frame 1.6.0 (MIT): https://aframe.io/
- AR.js 3.4.7 (MIT; 同梱ARToolKit由来コードは元ライブラリのライセンスに従う): https://github.com/AR-js-org/AR.js
- マーカー仕様: https://ar-js-org.github.io/AR.js-Docs/marker-based/
- マーカー生成仕様: AR.js `three.js/examples/marker-training/threex-arpatternfile.js`

制作補助に生成AIを利用。提出者はソースと検証結果を確認し、授業のAI利用方針に従ってください。
