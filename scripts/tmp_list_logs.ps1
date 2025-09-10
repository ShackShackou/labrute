$names = 'JadeFlaky','TomatoTroubled','GreenFit','GoldSlight','IvoryInformal'
foreach ($n in $names) {
  $url = "http://localhost:9000/api/log/list/$n"
  $out = (curl.exe -s $url)
  if ($out -and $out -ne '[]') {
    Write-Output "FOUND:$n"
    Write-Output $out
    break
  } else {
    Write-Output "NO_LOGS:$n"
  }
}
