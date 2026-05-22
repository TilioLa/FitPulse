#!/usr/bin/env bash
set -euo pipefail

FFMPEG_BIN="/usr/local/opt/ffmpeg-full/bin/ffmpeg"
ROOT="marketing/tiktok"
IN="$ROOT/videos"
OUT="$ROOT/renders"
mkdir -p "$OUT"

FONT="/System/Library/Fonts/Supplemental/Arial.ttf"
if [ ! -f "$FONT" ]; then
  FONT="/System/Library/Fonts/Supplemental/Helvetica.ttc"
fi

render_one() {
  local slug="$1"
  local duration="$2"
  local title="$3"
  local srt="$IN/${slug}.srt"
  local out="$OUT/${slug}.mp4"

  "$FFMPEG_BIN" -y \
    -f lavfi -t "$duration" -i "color=c=#0b1220:s=1080x1920:r=30" \
    -f lavfi -t "$duration" -i "anoisesrc=color=white:amplitude=0.006" \
    -filter_complex "\
[0:v]drawbox=x=0:y=0:w=1080:h=1920:color=#111827@1:t=fill,\
drawbox=x=0:y=0:w=1080:h=220:color=#0369a1@0.55:t=fill,\
drawbox=x=0:y=1520:w=1080:h=400:color=#111827@0.75:t=fill,\
drawtext=fontfile='${FONT}':text='${title}':fontcolor=white:fontsize=56:x=(w-text_w)/2:y=70,\
drawtext=fontfile='${FONT}':text='FITPULSE':fontcolor=#93c5fd:fontsize=30:x=(w-text_w)/2:y=22,\
subtitles=filename='${srt}':force_style='FontName=Arial,FontSize=18,Outline=1,BorderStyle=3,BackColour=&H55000000,Alignment=2,MarginV=220',\
drawtext=fontfile='${FONT}':text='Lien en bio pour faire ton plan':fontcolor=white:fontsize=42:x=(w-text_w)/2:y=h-150:enable='gte(t,${duration}-3)'\
[v]" \
    -map "[v]" -map 1:a \
    -c:v libx264 -pix_fmt yuv420p -r 30 -preset medium -crf 20 \
    -c:a aac -b:a 96k -shortest "$out"
}

render_one "video-01-regularite" 25 "Regularite sans charge mentale"
render_one "video-02-avant-apres" 22 "Avant apres 30 jours"
render_one "video-03-erreur-debutant" 20 "Erreur debutant"
render_one "video-04-maison-ou-salle" 24 "Maison ou salle"
render_one "video-05-perte-de-poids" 26 "Perte de poids"
render_one "video-06-prise-de-masse" 23 "Prise de masse"
render_one "video-07-coach-visuel" 20 "Un coach visuel"
render_one "video-08-3-raisons-abandon" 28 "3 raisons abandon"
render_one "video-09-defi-7-jours" 21 "Defi 7 jours"
render_one "video-10-temoignage" 25 "Temoignage client"

echo "Videos generees dans: $OUT"
