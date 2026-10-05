---
description: Verifica, corrige y marca los criterios de aceptación de un spec (<NN-slug>). Compara las pantallas contra las referencias de Penpot con Playwright y visión, y valida las recomendaciones de Next.js con Context7.
agent: spec-verifier
---

Spec objetivo: `$ARGUMENTS`

Ejecuta tu flujo completo de verificación sobre ese spec: resuelve el archivo, clasifica sus criterios de aceptación, levanta el dev server si hace falta, verifica uno por uno (CLI / visual con Playwright + visión / Next.js con Context7), corrige spec y código donde falle, marca los checks con `- [x]` y cierra con el reporte de evidencia.