$backend = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d E:\TrashTrack_City\TrashTrack_City\backend && npm run dev' -PassThru
$frontend = Start-Process -FilePath 'cmd.exe' -ArgumentList '/c cd /d E:\TrashTrack_City\TrashTrack_City\frontend && npm run dev' -PassThru

Start-Sleep -Seconds 7

try {
    python stm_excel_example.py --headless
} finally {
    Stop-Process -Id $backend.Id -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
    Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
}
