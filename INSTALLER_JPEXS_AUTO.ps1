# Script PowerShell pour télécharger et installer JPEXS automatiquement

Write-Host "=== Installation Automatique de JPEXS ===" -ForegroundColor Cyan
Write-Host ""

# URL de la dernière version
$jpexsUrl = "https://api.github.com/repos/jindrapetrik/jpexs-decompiler/releases/latest"

try {
    Write-Host "Recherche de la dernière version..." -ForegroundColor Yellow
    
    # Obtenir les infos de la dernière release
    $release = Invoke-RestMethod -Uri $jpexsUrl
    $version = $release.tag_name
    
    Write-Host "Version trouvée: $version" -ForegroundColor Green
    
    # Trouver le lien de téléchargement Windows
    $windowsAsset = $release.assets | Where-Object { $_.name -like "*setup.exe" }
    
    if ($windowsAsset) {
        $downloadUrl = $windowsAsset.browser_download_url
        $fileName = $windowsAsset.name
        $downloadPath = "$env:TEMP\$fileName"
        
        Write-Host "Téléchargement de $fileName..." -ForegroundColor Yellow
        Write-Host "Depuis: $downloadUrl"
        
        # Télécharger le fichier
        Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath
        
        Write-Host ""
        Write-Host "Téléchargement terminé!" -ForegroundColor Green
        Write-Host "Fichier: $downloadPath"
        Write-Host ""
        Write-Host "Lancement de l'installation..." -ForegroundColor Yellow
        
        # Lancer l'installateur
        Start-Process -FilePath $downloadPath -Wait
        
        Write-Host ""
        Write-Host "Installation terminée!" -ForegroundColor Green
        
        # Créer un raccourci sur le bureau
        $jpexsPath = "C:\Program Files\JPEXS Free Flash Decompiler\ffdec.jar"
        if (Test-Path $jpexsPath) {
            Write-Host "JPEXS installé avec succès!" -ForegroundColor Green
            Write-Host "Emplacement: $jpexsPath"
        }
    }
    else {
        Write-Host "Erreur: Impossible de trouver le fichier Windows" -ForegroundColor Red
        Write-Host "Téléchargez manuellement depuis: https://github.com/jindrapetrik/jpexs-decompiler/releases" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "Erreur lors du téléchargement: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Téléchargement manuel" -ForegroundColor Yellow
    Write-Host "1. Ouvrez: https://github.com/jindrapetrik/jpexs-decompiler/releases" -ForegroundColor White
    Write-Host "2. Téléchargez: ffdec_XX.X.X_setup.exe" -ForegroundColor White
    Write-Host "3. Installez normalement" -ForegroundColor White
}

Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")