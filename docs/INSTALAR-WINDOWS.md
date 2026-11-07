# Instalar con Apps2Samsung

1. Descarga `XuperTizen-0.7.0-beta-Tizen4plus-UNSIGNED.wgt` de
   [la release](https://github.com/mbrionesz/infotv/releases/tag/v0.7.0-beta.1).
2. Conecta el PC y el televisor a la misma red. Mantén Developer Mode activo
   y configurado con la IP del PC, como en tu instalación anterior.
3. Importa el WGT en [Apps2Samsung](https://github.com/Apps2Samsung/Apps2Samsung).
4. Usa la firma y la instalación habituales de Apps2Samsung. Conserva el
   certificado de autor utilizado anteriormente para permitir actualizaciones.
5. Abre XuperTizen y confirma **0.7.0** en Ajustes → Acerca de.

El PC no necesita permanecer encendido después de instalar.

Para añadir el repositorio como fuente, si tu versión lo admite:

```text
apps2samsung-cli sources add github.com/mbrionesz/infotv
```

Si la beta no aparece en el catálogo, importa el WGT directamente desde la release.
La inclusión en el catálogo comunitario general no es automática.

La firma es gratuita y se realiza en tu PC. El archivo público no está firmado
para todos los televisores: la autorización del certificado distribuidor depende
del dispositivo. No compartas certificados privados ni contraseñas.
