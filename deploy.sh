#!/usr/bin/env bash
#
# Publica la landing en produccion: https://asistenteinternet.com
#
#   ./deploy.sh
#
# Sube los archivos al bucket, invalida CloudFront y espera a que la
# invalidacion termine, asi al volver la terminal el cambio ya esta en linea.
#
# Requiere el perfil "connecting" de la AWS CLI (~/.aws/credentials).

set -euo pipefail

BUCKET="connecting-landing-2026"
DISTRIBUTION="E2ZLEDCWVDXW3N"
PROFILE="connecting"
SITIO="https://asistenteinternet.com"

cd "$(dirname "$0")"

if ! aws sts get-caller-identity --profile "$PROFILE" >/dev/null 2>&1; then
  echo "No hay credenciales validas para el perfil '$PROFILE'." >&2
  exit 1
fi

# Solo se publica lo que la home enlaza. contacto.html, proyectos.html y
# sobre-nosotros.html viven en el repo pero nunca estuvieron en produccion:
# ninguna pagina apunta a ellas. Si algun dia se enlazan, agregarlas aca.
echo "Subiendo a s3://$BUCKET"
aws s3 sync . "s3://$BUCKET" \
  --profile "$PROFILE" \
  --cache-control no-cache \
  --exclude "*" \
  --include "index.html" \
  --include "privacidad.html" \
  --include "terminos.html" \
  --include "robots.txt" \
  --include "sitemap.xml" \
  --include "css/*" \
  --include "js/*" \
  --include "images/*" \
  --no-progress

# URLs limpias sin funcion de CloudFront: el mismo HTML tambien como objeto sin
# extension, para que /privacidad y /terminos resuelvan.
for p in privacidad terminos; do
  aws s3 cp "$p.html" "s3://$BUCKET/$p" \
    --profile "$PROFILE" \
    --content-type "text/html; charset=utf-8" \
    --cache-control no-cache --no-progress
done

# Los archivos se reemplazan sin cambiarles el nombre, asi que sin invalidar
# CloudFront seguiria sirviendo la copia vieja hasta que expire.
echo "Invalidando CloudFront"
ID=$(aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION" \
  --paths "/*" \
  --profile "$PROFILE" \
  --query "Invalidation.Id" \
  --output text)

aws cloudfront wait invalidation-completed \
  --distribution-id "$DISTRIBUTION" \
  --id "$ID" \
  --profile "$PROFILE"

echo "Listo: $SITIO"
