# Script para crear una página en SharePoint con la información del README.md usando PnP.PowerShell
# Este método no requiere consentimiento de administrador a nivel de tenant de la misma forma que Composio.

$ErrorActionPreference = "Stop"

# 1. Solicitar la URL del sitio de SharePoint
$siteUrl = Read-Host -Prompt "Ingresa la URL del sitio de SharePoint (ej. https://tuempresa.sharepoint.com/sites/tusitio)"

if (-not $siteUrl) {
    Write-Error "La URL del sitio es requerida."
    exit
}

# 2. Verificar e instalar PnP.PowerShell si no está instalado
Write-Host "Verificando el módulo PnP.PowerShell..." -ForegroundColor Cyan
$pnpModule = Get-Module -ListAvailable -Name PnP.PowerShell
if (-not $pnpModule) {
    Write-Host "Instalando PnP.PowerShell para el usuario actual..." -ForegroundColor Yellow
    Install-Module PnP.PowerShell -Scope CurrentUser -Force -AllowClobber
} else {
    Write-Host "PnP.PowerShell ya está instalado." -ForegroundColor Green
}

# Importar el módulo
Import-Module PnP.PowerShell

# 3. Conectarse a SharePoint
Write-Host "Iniciando sesión en SharePoint..." -ForegroundColor Cyan
Write-Host "Se abrirá una ventana en tu navegador para que inicies sesión con tu cuenta." -ForegroundColor Yellow
Connect-PnPOnline -Url $siteUrl -Interactive

# 4. Leer y preparar el contenido del README.md
$readmePath = Join-Path $PSScriptRoot "README.md"
if (-not (Test-Path $readmePath)) {
    Write-Error "No se encontró el archivo README.md en la ruta: $readmePath"
    exit
}

Write-Host "Leyendo el archivo README.md..." -ForegroundColor Cyan
$readmeContent = Get-Content -Path $readmePath -Raw

# Convertir Markdown muy básico a HTML (SharePoint Modern Pages usan HTML enriquecido)
# Reemplazamos los encabezados, listas y formateamos el texto
$htmlContent = $readmeContent
$htmlContent = $htmlContent -replace '(?m)^# (.*)$', '<h1>$1</h1>'
$htmlContent = $htmlContent -replace '(?m)^## (.*)$', '<h2>$1</h2>'
$htmlContent = $htmlContent -replace '(?m)^### (.*)$', '<h3>$1</h3>'
$htmlContent = $htmlContent -replace '(?m)^#### (.*)$', '<h4>$1</h4>'
$htmlContent = $htmlContent -replace '(?m)^\- (.*)$', '<li>$1</li>'
$htmlContent = $htmlContent -replace '(?m)^\* (.*)$', '<li>$1</li>'
$htmlContent = $htmlContent -replace '(?m)\*\*(.*?)\*\*', '<strong>$1</strong>'
$htmlContent = $htmlContent -replace '(?m)\*(.*?)\*', '<em>$1</em>'
$htmlContent = $htmlContent -replace '(?m)`(.*?)`', '<code>$1</code>'
# Agrupar las líneas de listas <li> en bloques <ul>
$htmlContent = $htmlContent -replace '(?ms)(<li>.*?</li>)', '<ul>$1</ul>'
$htmlContent = $htmlContent -replace '</ul>\s*<ul>', ''
# Reemplazar saltos de línea por <br/>
$htmlContent = $htmlContent -replace '(?m)$', '<br/>'

# 5. Crear la Página en SharePoint
$pageName = "SHIGMA-Seguridad-Higiene-y-Medio-Ambiente"
Write-Host "Creando la página '$pageName' en SharePoint..." -ForegroundColor Cyan

# Intentar obtener la página primero para borrarla si ya existe (o podemos crearla con un sufijo)
try {
    $page = Get-PnPPage -Identity $pageName -ErrorAction SilentlyContinue
    if ($page) {
        Write-Host "La página ya existe, se actualizará su contenido." -ForegroundColor Yellow
    }
} catch {
    # No existe, se creará una nueva
}

# Crear la página
$page = Add-PnPPage -Name $pageName -HeaderType Default -Title "SHIGMA - Seguridad, Higiene Industrial y Medio Ambiente"

# Agregar la sección de texto con la información
Add-PnPPageTextSection -Page $page -Text $htmlContent

# Publicar la página
Publish-PnPPage -Identity $page

$absolutePageUrl = "$siteUrl/SitePages/$pageName.aspx"
Write-Host "`n¡Página creada y publicada con éxito!" -ForegroundColor Green
Write-Host "Puedes verla en: $absolutePageUrl" -ForegroundColor Green

# Desconectar sesión
Disconnect-PnPOnline
