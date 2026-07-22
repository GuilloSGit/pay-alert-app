# /cierre — Cierre de sesión de trabajo

Ejecutá este checklist completo en orden. No saltees pasos. Reportá cada uno antes de pasar al siguiente.
Este archivo es la referencia real para los 3 repos de Pay Alert — debería ser igual al de `pay-alert-admin` y `pay-alert-app` (`.claude/commands/cierre.md` en cada uno). Si encontrás que alguno de los tres divergió, corregilo para que los tres queden iguales. El `/cierre` global (`~/.claude/commands/cierre.md`) ya no tiene contenido de Pay Alert — es un despachador genérico que busca este archivo.

## Regla de push durante la sesión

**Durante la sesión: `git commit` local después de cada tarea, pero NO `git push`.**
El push único se hace al final del cierre, junto con los docs.
Así queda un solo evento de push por sesión, con código + docs combinados.

---

## 1. Estado git de todos los repos del proyecto activo

**Pay Alert — tres repos a revisar siempre:**

| Repo | Path |
|------|------|
| `pay-alert-api` | `/Users/guillermoandrada/Projects/pay-alert-api` |
| `pay-alert-app` | `/Users/guillermoandrada/Projects/pay-alert-app` |
| `pay-alert-admin` | `/Users/guillermoandrada/Projects/pay-alert-admin` |

Para cada uno:
- `git status` — archivos sin commitear
- `git log --oneline -3` — últimos commits
- `git diff origin/main...HEAD --stat` — qué commits están pendientes de push

Si hay cambios sin commitear que deberían estar guardados, commiteá con mensaje Conventional Commits antes de continuar.
Si hay cambios locales intencionales que NO deben commitearse (ej: rewrites de next.config.ts), mencionarlos explícitamente.

---

## 2. Actualizar memorias del proyecto

Leé los archivos de memoria actuales en:
`~/.claude/projects/<proyecto>/memory/`

Actualizá:
- `project_pay_alert.md` y `project_pay_alert_frontend.md` (u otros según proyecto) con todo lo nuevo de esta sesión: features completadas, decisiones técnicas tomadas, bugs resueltos, cambios de arquitectura
- Actualizá la fecha al día de hoy
- Actualizá el % de completado si cambió
- Mové ítems de "pendiente" a "completado" si corresponde
- Agregá ítems nuevos al roadmap si surgieron en la sesión
- Actualizá el índice `MEMORY.md` si las descripciones cambiaron

---

## 3. Actualizar documentación del proyecto

Editá los archivos pero NO commitees ni pushees todavía — se hace todo junto en el paso 5.

**pay-alert-api:**
- `ARCHITECTURE.md` — nuevos ADRs, decisiones técnicas, cambios de seguridad, estado actual del sistema
- `CLAUDE.md` — si cambió algo en comandos, endpoints o reglas obligatorias
- ⚠️ **Ambos están en `.gitignore`** — NO se commitean. Solo el código se pushea.

**pay-alert-app:**
- `AGENTS.md` — nuevos patrones, gotchas descubiertos, estado de páginas, roadmap FE
- `CLAUDE.md` — si cambió algo en setup o reglas

**pay-alert-admin** (`/Users/guillermoandrada/Projects/pay-alert-admin`):
- `AGENTS.md` — si cambió algo en estructura de páginas, patrones de API, gotchas del panel

**Regla:** solo actualizá secciones donde algo cambió. No reescribas lo que ya está bien.

---

## 4. Verificación obligatoria antes de cualquier push

**Regla: no se pushea sin antes verificar que funciona. Sin excepciones.**

### pay-alert-api
```bash
npm run lint        # tsc --noEmit — tipos correctos
npm test            # unit tests — deben pasar todos
```
Si hay endpoints nuevos: probarlos con curl contra localhost.
Si hay cambios en el schema: verificar que `npm run db:migrate` corrió exitosamente.

### pay-alert-app
```bash
npx tsc --noEmit    # tipos correctos
npm run build       # build completo — todas las páginas deben compilar
```

**Si alguno de estos pasos falla: NO pushear. Arreglar primero.**

---

## 5. Push final — UN SOLO push por repo

Para cada repo con cambios pendientes (código sin pushear + docs actualizados):

```bash
git ls-files <archivo-doc>   # verificar que el doc está trackeado antes de add
git add <archivos-doc-trackeados>
```

Luego, según el caso:

**Caso A — hay commits de código pendientes de push + docs nuevos:**
```bash
git add <docs>
git commit -m "docs: cierre sesión YYYY-MM-DD — <resumen>"
git push   # ← pushea todos los commits pendientes juntos (código + docs)
```

**Caso B — todo el código ya fue pusheado durante la sesión (solo quedan docs):**
```bash
git add <docs>
git commit -m "docs: cierre sesión YYYY-MM-DD — <resumen>"
git push
```

**Caso C — código sin commitear + docs:**
```bash
git add <código> <docs>
git commit -m "feat/fix: <descripción> + docs cierre YYYY-MM-DD"
git push
```

Reportá el resultado de cada push.

---

## 6. Prompt para la próxima sesión

Generá un prompt completo y autónomo para la próxima sesión. Debe incluir:

```
Continuamos con <proyecto>. Estado actual: <% completado>.

COMPLETADO esta sesión:
- <lista de lo que se hizo>

PRÓXIMAS PRIORIDADES (en orden):
1. <item más urgente con contexto técnico suficiente>
2. ...

CONTEXTO TÉCNICO NECESARIO:
- <archivos clave a leer antes de tocar código>
- <decisiones ya tomadas que no hay que re-discutir>
- <gotchas o trampas conocidas relevantes>

Credenciales / accesos: <lo que haga falta>
```

El prompt debe ser lo suficientemente completo para que una sesión nueva arranque sin preguntas.
