적용 방법 - stable20260606b
========================

1) 이 폴더 안의 파일을 기존 GitHub Pages /app 폴더에 전부 덮어쓰기합니다.
2) iPhone에 이미 만들어둔 홈 화면 아이콘은 전부 삭제합니다.
3) Safari에서 아래 주소로 직접 접속합니다.
   - 쿠팡: https://azit4376-blip.github.io/app/coupang.html?install=1&v=stable20260606b
   - 알리: https://azit4376-blip.github.io/app/ali.html?install=1&v=stable20260606b
4) 열린 페이지에서 공유 버튼 → 홈 화면에 추가를 누릅니다.
5) 이름이 쿠팡 또는 알리로 뜨는지 확인 후 추가합니다.
6) 새로 생성된 아이콘을 실행하면 쿠팡/알리 링크로 자동 이동합니다.

주의
====
- index.html에서 홈 화면 추가를 하면 이름이 '쇼핑홈'으로 나오는 것이 정상입니다.
- 쿠팡 아이콘은 coupang.html에서, 알리 아이콘은 ali.html에서 추가해야 합니다.
- 이번 버전은 coupang.html과 ali.html의 설치 페이지 디자인 구조를 동일하게 맞췄습니다.
- 단일 설치 페이지에서는 manifest.json을 연결하지 않아 iPhone 이름이 쇼핑홈으로 잡히는 문제를 줄였습니다.
- 캐시 방지를 위해 style.css/app.js/icon 링크에 stable20260606b 버전을 붙였습니다.
