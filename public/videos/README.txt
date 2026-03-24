Place ici ta video de presentation:

- Nom de fichier recommande: fitpulse-presentation-complete.mp4
- Chemin complet: public/videos/fitpulse-presentation-complete.mp4

Option alternative:
- Definir NEXT_PUBLIC_PRESENTATION_VIDEO_URL avec une URL YouTube ou MP4.

Generation automatique:
- npm run video:demo
- Cela enregistre une demo via Playwright puis publie: public/videos/fitpulse-presentation.webm

Conversion optionnelle en mp4 (si ffmpeg est installe):
- ffmpeg -y -i public/videos/fitpulse-presentation-complete.webm -c:v libx264 -pix_fmt yuv420p public/videos/fitpulse-presentation-complete.mp4
