# Repère dans un enregistrement WAV le moment où chaque phrase connue est prononcée, avec la reconnaissance
# vocale française intégrée à Windows (hors ligne, gratuite). Sert à caler sous-titres et changements d'écran
# sur la voix off sans transcription payante.
# Usage : powershell -File reperer-phrases.ps1 -Wav voix.wav -Phrases phrases.json -Sortie reperes.json
#   phrases.json : tableau de textes (tels que prononcés) ; reperes.json : [{index, texte, debut, fin, confiance}]
param([string]$Wav, [string]$Phrases, [string]$Sortie)
Add-Type -AssemblyName System.Speech
$culture = [System.Globalization.CultureInfo]::GetCultureInfo("fr-FR")
$moteur = New-Object System.Speech.Recognition.SpeechRecognitionEngine($culture)
$liste = Get-Content -Raw -Encoding UTF8 $Phrases | ConvertFrom-Json
# Texte simplifié pour la grammaire : sans ponctuation
$propres = @($liste | ForEach-Object { (($_ -replace "[«»:;!?…,.()]", " ") -replace "\s+", " ").Trim() })
$choix = New-Object System.Speech.Recognition.Choices
foreach($p in $propres){ if($p){ $choix.Add($p) } }
$constructeur = New-Object System.Speech.Recognition.GrammarBuilder($choix)
$constructeur.Culture = $culture
$moteur.LoadGrammar((New-Object System.Speech.Recognition.Grammar($constructeur)))
$moteur.SetInputToWaveFile($Wav)
$moteur.EndSilenceTimeout = [TimeSpan]::FromMilliseconds(120)
$moteur.EndSilenceTimeoutAmbiguous = [TimeSpan]::FromMilliseconds(250)
# Mode continu : positions absolues dans le fichier, lecture jusqu'au bout
Register-ObjectEvent -InputObject $moteur -EventName SpeechRecognized -SourceIdentifier ose.reconnu | Out-Null
Register-ObjectEvent -InputObject $moteur -EventName RecognizeCompleted -SourceIdentifier ose.fini | Out-Null
$moteur.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
$resultats = New-Object System.Collections.ArrayList
$fini = $false
while(-not $fini){
  $e = Wait-Event -Timeout 120
  if($e -eq $null){ break }
  if($e.SourceIdentifier -eq "ose.fini"){ $fini = $true }
  else {
    $r = $e.SourceEventArgs.Result
    [void]$resultats.Add([pscustomobject]@{ index = [Array]::IndexOf($propres, $r.Text); texte = $r.Text; debut = $r.Audio.AudioPosition.TotalSeconds; fin = ($r.Audio.AudioPosition + $r.Audio.Duration).TotalSeconds; confiance = [math]::Round($r.Confidence, 2) })
  }
  Remove-Event -EventIdentifier $e.EventIdentifier
}
Unregister-Event ose.reconnu; Unregister-Event ose.fini
ConvertTo-Json -InputObject @($resultats) -Depth 3 | Out-File -Encoding utf8 $Sortie
"{0} phrases repérées sur {1}" -f $resultats.Count, $propres.Count
