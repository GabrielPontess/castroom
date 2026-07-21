param(
    [string]$RoomName = 'turma-load-30',
    [string]$FrontendUrl = 'http://localhost:3000',
    [int]$OpenDelaySeconds = 1,
    [string]$OutputDir = '.\tmp-room-seeds'
)

$ErrorActionPreference = 'Stop'

if (-not (Test-Path -LiteralPath $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
}

$urlsFile = Join-Path $OutputDir "$RoomName-urls.txt"
Set-Content -LiteralPath $urlsFile -Value $null

function New-ParticipantUrl {
    param(
        [string]$ParticipantName,
        [string]$Role
    )

    $encodedRoom = [System.Uri]::EscapeDataString($RoomName)
    $encodedName = [System.Uri]::EscapeDataString($ParticipantName)
    $encodedRole = [System.Uri]::EscapeDataString($Role)

    return "$FrontendUrl/prejoin?roomName=$encodedRoom&name=$encodedName&role=$encodedRole"
}

function Open-Participant {
    param(
        [string]$ParticipantName,
        [string]$Role
    )

    $url = New-ParticipantUrl -ParticipantName $ParticipantName -Role $Role
    Add-Content -LiteralPath $urlsFile -Value $url

    "Abrindo $ParticipantName"
    Start-Process $url

    if ($OpenDelaySeconds -gt 0) {
        Start-Sleep -Seconds $OpenDelaySeconds
    }
}

"Abrindo sala '$RoomName' com 30 participantes em $FrontendUrl"
"Lista de URLs: $urlsFile"

Open-Participant -ParticipantName 'Professor 01' -Role 'teacher'

for ($index = 1; $index -le 29; $index++) {
    $participantName = 'Aluno {0:D2}' -f $index
    Open-Participant -ParticipantName $participantName -Role 'student'
}

""
"Concluido. As URLs abertas tambem foram salvas em $urlsFile"
