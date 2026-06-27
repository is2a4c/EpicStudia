#!/bin/sh
# MediaMTX runOnReady-хук: отклоняет (кикает) издателей с видео выше 1080p.
# Запускается внутри контейнера mediamtx (образ latest-ffmpeg: есть ffprobe/wget).
# MediaMTX передаёт переменную окружения MTX_PATH (напр. "live/2").
API="http://127.0.0.1:9997"
MAXH=1080

[ -z "$MTX_PATH" ] && exit 0

# Высота видеодорожки источника (читаем живой RTMP-поток, таймаут 6с).
H=$(ffprobe -v error -rw_timeout 6000000 -select_streams v:0 \
      -show_entries stream=height -of csv=p=0 \
      "rtmp://127.0.0.1:1935/$MTX_PATH" 2>/dev/null | head -1)

# Не смогли определить высоту — ничего не делаем (не кикаем по неопределённости).
case "$H" in
  ''|*[!0-9]*) exit 0 ;;
esac

[ "$H" -le "$MAXH" ] && exit 0

# Источник выше 1080 — находим id публикующего RTMP-соединения этого пути и кикаем.
ID=$(wget -q -O - "$API/v3/rtmpconns/list" 2>/dev/null \
      | tr '}' '\n' \
      | grep "\"path\":\"$MTX_PATH\"" \
      | grep -oE '"id":"[0-9a-fA-F-]+"' | head -1 \
      | sed 's/.*"id":"//; s/"$//')

if [ -n "$ID" ]; then
  wget -q -O /dev/null --method=POST "$API/v3/rtmpconns/kick/$ID" 2>/dev/null
  echo "maxres: rejected $MTX_PATH (height=$H > $MAXH, conn=$ID)"
fi
exit 0
