@echo off
REM Auto-generated render script for D01_budgetbreakdown_350k_haarlem
cd /d "%~dp0.."
ffmpeg -y -i "assets/video/skyline_generic_vertical.mp4" -r 30 -s 1080x1920 -c:v libx264 -b:v 16M -c:a aac -ar 48000 -b:a 256k "output\tiktok_nl_D01_budgetbreakdown_350k_haarlem_v01.mp4"
echo.
echo Klaar: output\tiktok_nl_D01_budgetbreakdown_350k_haarlem_v01.mp4
pause
