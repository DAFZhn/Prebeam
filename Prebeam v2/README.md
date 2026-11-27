# PreBeam · Rediseño visual SLOPE

Aplicación React + Vite + Tailwind para análisis y diseño de vigas pretensadas. Esta revisión actualiza la dirección visual tomando como referencia el proyecto **SLOPE® — Website Design / Brand Identity / UI UX**, adaptado a un entorno de ingeniería: tipografía Archivo de alto contraste, IBM Plex Mono para resultados, superficies hueso, negro mineral, acento lima, geometría diagonal y navegación técnica compacta.

## Herramientas incluidas

- **Cortante vertical en viga simplemente apoyada:** datos de proyecto, normas ACI 318-19/318-99, materiales, geometría, torones, estribos, cargas y camión; resultados por secciones, armado, gráficas, memoria KaTeX, CSV e impresión.
- **Viga continua pretensada:** hasta ocho tramos editables, rigidez relativa, condiciones de extremo, cargas distribuidas y puntuales, alternancia de carga viva, análisis por rigidez, envolventes, reacciones, cortante, flexión, zonas de estribos, CSV e impresión.

Los motores de cálculo conservan las ecuaciones, unidades, validaciones, redondeos y estados del proyecto. La interfaz se alimenta directamente de esos motores; no utiliza resultados pregrabados.

## Novedades de uso

- **Excel**: el botón exporta un `.xlsx` real (hojas Resumen, Datos de entrada, Tabla, Armado; y Nodos/Envolventes en viga continua), que se puede enviar a quien no tenga el programa. Sin dependencias (`src/lib/xlsx.ts`). Los valores son estáticos; solo los totales de estribos usan fórmulas.
- **Restablecer**: pone todos los datos en 0 (se conserva el nombre de quien calcula). Se puede deshacer.
- **Deshacer / Rehacer**: botones y atajos Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y (`src/lib/history.ts`).
- **Autoguardado** en el navegador y botón **Ejemplo** para cargar datos de muestra.

### Añadir una herramienta nueva

1. Crea `src/tools/<nombre>/` con motor, componente y `exportXlsx.ts` (usa `SheetBuilder` de `lib/excelCommon.ts`).
2. En el componente usa `useHistory`, `useToast` y `<ToolActions>`; define una función `blank...` con todo en 0.
3. Regístrala en `src/tools/registry.ts`.

## Ejecutar

```bash
npm install
npm run dev
```

Compilar para producción:

```bash
npm run build
npm run preview
```

## Actualizar el repositorio

El contenido de esta carpeta corresponde a `prebeam-con-viga-continua/beam-app`. Copia los archivos fuente, `index.html`, `package.json` y `package-lock.json` sobre esa carpeta. No copies `node_modules` ni `dist`; ambos están excluidos en `.gitignore`.

## Referencia visual

https://www.behance.net/gallery/257470497/SLOPE-Website-Design-Brand-Identity-UIUX

PreBeam es una herramienta de apoyo. Todos los resultados deben ser revisados por el ingeniero responsable.
