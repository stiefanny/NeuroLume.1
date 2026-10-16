@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Pasang Node.js LTS versi 22 atau lebih baru terlebih dahulu.
  echo Buka https://nodejs.org/en/download
  pause
  exit /b 1
)
call npm.cmd run build
if errorlevel 1 goto failed
call npm.cmd test
if errorlevel 1 goto failed
echo Masuk ke akun Cloudflare pemilik proyek neurolume-1 pada jendela yang terbuka.
call npx.cmd --yes wrangler@4.151.0 login
if errorlevel 1 goto failed
call npx.cmd --yes wrangler@4.151.0 pages deploy public --project-name neurolume-1
if errorlevel 1 goto failed
echo Periksa URL dan jenis deployment Production atau Preview yang ditampilkan Wrangler.
echo Buka /api/health pada URL tersebut dan cocokkan model_id dengan README.
pause
exit /b 0
:failed
echo Deployment belum berhasil. Simpan pesan error terakhir untuk diperiksa.
pause
exit /b 1
