---
description: Reglas obligatorias para manejo de texto en español
---

## CRÍTICO: Manejo de Caracteres Especiales

### ❌ NUNCA HACER:
1. **No usar secuencias de escape** para caracteres acentuados en strings visibles al usuario
   - MAL: `"OPERACI\u00F3N"` o `"pa\\u00EDs"`
   - BIEN: `"OPERACIÓN"` o `"país"`

2. **No insertar caracteres de control** (ASCII < 32) en ningún string
   - Estos incluyen: `\x00`-`\x1F`, `\u001c`, `\u0018`, etc.

3. **No mezclar encodings** - Todo el proyecto usa UTF-8

### ✅ SIEMPRE HACER:
1. Escribir caracteres acentuados directamente: á, é, í, ó, ú, ñ, Á, É, Í, Ó, Ú, Ñ
2. Verificar que el archivo se guarde como UTF-8 sin BOM
3. Si copias texto de otro lugar, verificar que no traiga caracteres invisibles
4. Si ves `\uFFFD` (�) o caracteres raros, DETENERSE y reportar el problema

### 🔍 Verificación Post-Edición:
Después de editar archivos con texto en español, buscar estos patrones problemáticos:
- `\\u00` (escape literal)
- `\uFFFD` (replacement character)
- Caracteres de control: \x1c, \x18, \x13, \x14

### 🚨 Si detectas corrupción:
1. NO intentes arreglar manualmente reemplazando carácter por carácter
2. Busca una versión anterior del archivo en git
3. Si no hay versión anterior, crea un script Node.js para hacer los reemplazos de forma sistemática
