# C&K Commerce Group · Matcha Collection

A bilingual company and product website with an original interactive WebGL matcha powder vortex.

## Local preview

Run `npm run dev`, then open `http://127.0.0.1:4173`.

The site is plain HTML, CSS and JavaScript. There are no runtime dependencies or build step. `dist/` contains the complete deployable website; `npm run check` checks JavaScript syntax.

## Editing

- `dist/content.js`: Chinese and English copy, product descriptions and application categories.
- `dist/main.js`: language preference, product filtering, accessible detail dialogs, application tabs and inquiry drafts.
- `dist/field.js`: GPU-rendered particle sculpture, pointer/drag/keyboard input, reduced-motion support and visibility-based animation suspension.
- `dist/style.css`: visual system and responsive layouts.
- `dist/images/`: photography extracted from the supplied English brochure.
- `dist/catalogs/`: original Chinese and English product brochures.

## Product sources

All product descriptions, producer information, contact details and inquiry conditions come from the supplied 12-page `CK_Commerce_Group_Matcha_Collection_CN(1).pdf` and `CK_Commerce_Group_Matcha_Collection(1).pdf`. Descriptive website headings are editorial copy. No additional certifications, prices or product specifications are asserted.

Guitea S, A, B and BK remain separate collections. Guizhou Ruisai Song, Ming / Qing, and Baking & Seasoning remain separately selectable. The BK ingredient-statement note and producer-specific grading distinction are preserved.

## Inquiries

The form prepares an encoded `mailto:` draft to `c.kcommercegroup@gmail.com`. The visitor reviews and sends it in their email application. There is no backend submission, automatic email delivery or form-data storage. Only the language preference is saved locally.

## Hosting

This Site is registered in `.openai/hosting.json`. Preserve its project ID when editing or deploying. Static hosting serves `dist/`; production source and publication use the Sites workflow.
