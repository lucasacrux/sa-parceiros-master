$env:GOOGLE_APPLICATION_CREDENTIALS = (Resolve-Path "$PSScriptRoot\terceirizada\mythical-runner-350501-79f85db1d3dd.json")
& "$PSScriptRoot\.venv\Scripts\Activate.ps1"
python "$PSScriptRoot\manage.py" runserver 8020
