# Plan: Sección de Edición de Categorías en el Side Panel

## Contexto y objetivo

Actualmente las categorías se muestran como "pills" en una barra horizontal. La única forma de eliminarlas era con un botón `×` dentro de cada pill (comentado en el CSS con `/*.cat-pill:hover .pill-del{...}*/`). No existe forma de renombrarlas, y el formulario de creación está separado (se despliega con el botón `+`).

**Objetivo:** reemplazar ese sistema fragmentado por una sección dedicada tipo panel colapsable — similar a como funcionan "Enlaces Rápidos" y "Automatizar Lote" — donde el usuario puede **crear, renombrar y eliminar** categorías desde una interfaz unificada.

---

## Arquitectura de la solución

### Concepto visual

La nueva sección de categorías tendrá dos modos:

- **Modo vista (por defecto):** muestra las pills existentes para filtrar snippets (comportamiento actual, sin cambios funcionales).
- **Modo edición:** se activa con un botón de lápiz (`✏️`) en el header de la barra de categorías. Muestra una lista de filas donde cada categoría tiene su color, nombre editable inline, y botón de eliminar. Al final de la lista hay un formulario para crear una nueva.

---

## Cambios por archivo

### 1. `sidepanel.html`

#### 1.1 Modificar el bloque `<!-- CATEGORIES -->`

**Ubicación actual (líneas ~2939–2960 del archivo fuente):**
```html
<!-- CATEGORIES -->
<div class="categories-bar">
  <div class="categories-scroll" id="categoriesList"></div>
  <button id="btnAddCategory" class="btn-add-cat" title="Nueva categoría">...</button>
</div>

<!-- CATEGORY FORM -->
<div class="category-form" id="categoryForm">
  <div class="category-form-inner">
    <input type="text" id="catNameInput" ...>
    <div class="color-picker" id="colorPicker"></div>
    <div class="category-form-actions">
      <button id="cancelCatBtn">Cancelar</button>
      <button id="saveCatBtn">Añadir</button>
    </div>
  </div>
</div>
```

**Reemplazar por:**
```html
<!-- CATEGORIES BAR (modo filtro — sin cambios visuales) -->
<div class="categories-bar">
  <div class="categories-scroll" id="categoriesList"></div>
  <button id="btnEditCategories" class="btn-add-cat" title="Gestionar categorías">
    <!-- Ícono de lápiz/edición -->
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  </button>
</div>

<!-- CATEGORY MANAGER (modo edición — colapsable) -->
<div class="category-manager" id="categoryManager">
  <div class="category-manager-inner">
    <!-- Lista dinámica de categorías editables — generada por JS -->
    <div id="catEditList"></div>

    <!-- Formulario para crear nueva categoría -->
    <div class="cat-create-form">
      <input type="text" id="catNameInput" class="cat-name-input" placeholder="Nueva categoría..." maxlength="30">
      <div class="color-picker" id="colorPicker"></div>
      <div class="category-form-actions">
        <button id="cancelCatBtn" class="btn btn-ghost btn-sm">Cerrar</button>
        <button id="saveCatBtn" class="btn btn-primary btn-sm">Añadir</button>
      </div>
    </div>
  </div>
</div>
```

> **Nota:** Se elimina el elemento `id="btnAddCategory"` (ya no existe). Se reutilizan los IDs `catNameInput`, `colorPicker`, `cancelCatBtn`, `saveCatBtn` para minimizar cambios en el resto del código.

---

### 2. `sidepanel.css`

#### 2.1 Eliminar o conservar estilos existentes

Los estilos de `.categories-bar`, `.categories-scroll`, `.cat-pill`, `.btn-add-cat`, `.category-form`, `.category-form-inner`, `.cat-name-input`, `.color-picker`, `.color-dot`, `.category-form-actions` **se conservan todos** — siguen siendo usados.

#### 2.2 Agregar nuevos estilos al final del archivo

```css
/* =======================================
   CATEGORY MANAGER (modo edición)
   ======================================= */

.category-manager {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.35s ease;
  flex-shrink: 0;
}

.category-manager.active {
  max-height: 500px; /* suficiente para cualquier cantidad razonable */
}

.category-manager-inner {
  padding: 8px 14px 12px;
  background: var(--primary-bg);
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Lista de categorías editables */
#catEditList {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cat-edit-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: var(--radius);
  transition: var(--transition);
}

.cat-edit-row:hover {
  border-color: var(--border-focus);
}

/* Indicador de color de la categoría */
.cat-edit-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Input de nombre inline — editable */
.cat-edit-name {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
  outline: none;
  padding: 2px 4px;
  border-radius: var(--radius-sm);
  transition: var(--transition);
  min-width: 0;
}

.cat-edit-name:focus {
  background: var(--bg);
  box-shadow: 0 0 0 2px rgba(99,102,241,0.15);
}

.cat-edit-name:disabled {
  color: var(--text-secondary);
  cursor: default;
}

/* Botón guardar cambio de nombre (aparece al enfocar el input) */
.btn-cat-save-name {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  border: none;
  background: var(--primary);
  color: #fff;
  cursor: pointer;
  display: none; /* oculto por defecto */
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: var(--transition);
}

.btn-cat-save-name:hover { background: var(--primary-dark); }

.cat-edit-name:focus ~ .btn-cat-save-name,
.cat-edit-row:focus-within .btn-cat-save-name {
  display: flex;
}

/* Botón eliminar categoría */
.btn-cat-del {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: var(--transition);
}

.btn-cat-del:hover {
  background: var(--danger-bg);
  color: var(--danger);
}

/* Fila de "General" — no editable ni eliminable */
.cat-edit-row.cat-locked .cat-edit-name {
  color: var(--text-tertiary);
  font-style: italic;
}

.cat-edit-row.cat-locked .btn-cat-del {
  display: none;
}

/* Separador visual entre lista y formulario de creación */
.cat-create-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
  border-top: 1px solid var(--border);
}

/* Ajuste: el botón + ahora muestra ícono de lápiz */
/* El btn-add-cat ya tiene estilos, no necesita cambios */
```

---

### 3. `sidepanel.js`

#### 3.1 Eliminar variables y funciones que ya no aplican

- **Eliminar** la variable `let qlEditMode` si se usaba solo para el formulario de categorías (verificar — probablemente sea solo de Quick Links, en ese caso **no tocar**).
- El botón `btnAddCategory` deja de existir en el HTML; eliminar su listener en `bind()`.

#### 3.2 Agregar variable de estado para el panel de edición

Al inicio del archivo, junto al resto de variables globales:

```js
let catManagerOpen = false;
```

#### 3.3 Reemplazar `toggleCatForm()` por `toggleCatManager()`

**Eliminar** la función `toggleCatForm()` completa.

**Agregar** en su lugar:

```js
function toggleCatManager () {
  catManagerOpen = !catManagerOpen;
  const el = $('categoryManager');
  if (catManagerOpen) {
    el.classList.add('active');
    renderCatEditList();
    // Resetear el formulario de creación
    $('catNameInput').value = '';
    selectColor(COLORS[0]);
    setTimeout(() => $('catNameInput').focus(), 200);
  } else {
    el.classList.remove('active');
  }
}
```

#### 3.4 Agregar función `renderCatEditList()`

Esta función genera la lista de filas editables dentro del panel de gestión.

```js
function renderCatEditList () {
  const list = $('catEditList');
  list.innerHTML = '';

  state.categories.forEach(cat => {
    const isLocked = cat.id === 'general';
    const row = document.createElement('div');
    row.className = 'cat-edit-row' + (isLocked ? ' cat-locked' : '');

    // Dot de color
    const dot = document.createElement('span');
    dot.className = 'cat-edit-dot';
    dot.style.background = cat.color || '#6366f1';

    // Input de nombre
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'cat-edit-name';
    input.value = cat.name;
    input.maxLength = 30;
    input.disabled = isLocked;
    if (isLocked) input.title = 'La categoría General no se puede modificar';

    // Botón guardar nombre
    const btnSave = document.createElement('button');
    btnSave.className = 'btn-cat-save-name';
    btnSave.title = 'Guardar nombre';
    btnSave.innerHTML = `
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
    `;

    // Botón eliminar
    const btnDel = document.createElement('button');
    btnDel.className = 'btn-cat-del';
    btnDel.title = 'Eliminar categoría';
    btnDel.innerHTML = `
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    `;

    // Evento: guardar nombre al hacer click en btnSave
    btnSave.addEventListener('click', () => {
      const newName = input.value.trim();
      if (!newName) { toast('El nombre no puede estar vacío'); input.focus(); return; }
      renameCategory(cat.id, newName);
      input.blur();
    });

    // Evento: guardar nombre con Enter
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { btnSave.click(); }
      if (e.key === 'Escape') { input.value = cat.name; input.blur(); }
    });

    // Evento: eliminar categoría
    btnDel.addEventListener('click', () => {
      confirmAction(
        `¿Eliminar categoría <strong>${esc(cat.name)}</strong>?<br>Los snippets pasarán a General.`,
        () => {
          deleteCategory(cat.id);
          renderCatEditList(); // refrescar lista sin cerrar el panel
        }
      );
    });

    row.appendChild(dot);
    row.appendChild(input);
    if (!isLocked) row.appendChild(btnSave);
    row.appendChild(btnDel);
    list.appendChild(row);
  });
}
```

#### 3.5 Agregar función `renameCategory()`

Añadir junto a las otras funciones CRUD de categorías (`addCategory`, `deleteCategory`):

```js
function renameCategory (id, newName) {
  const cat = state.categories.find(c => c.id === id);
  if (cat) { cat.name = newName; }
  persist();
  render(); // actualiza pills y el select del modal de snippets
  toast('Categoría renombrada');
}
```

#### 3.6 Modificar `saveCategoryForm()` → `saveCategoryAndRefresh()`

La función `saveCategoryForm()` existente hace `toggleCatForm()` al final — eso ya no aplica porque el panel permanece abierto. Modificarla:

```js
function saveCategoryForm () {
  const name = $('catNameInput').value.trim();
  if (!name) { toast('Escribe un nombre'); return; }
  addCategory(name, selectedColor);
  // Limpiar el formulario de creación pero NO cerrar el panel
  $('catNameInput').value = '';
  selectColor(COLORS[0]);
  $('catNameInput').focus();
  renderCatEditList(); // refrescar lista con la nueva categoría
  toast('Categoría creada');
}
```

#### 3.7 Modificar la función `bind()`

**Eliminar** estas líneas:
```js
$('btnAddCategory').addEventListener('click', toggleCatForm);
$('cancelCatBtn').addEventListener('click', toggleCatForm);
```

**Agregar** en su lugar:
```js
$('btnEditCategories').addEventListener('click', toggleCatManager);
$('cancelCatBtn').addEventListener('click', toggleCatManager);
$('saveCatBtn').addEventListener('click', saveCategoryForm);
$('catNameInput').addEventListener('keydown', e => { if (e.key === 'Enter') saveCategoryForm(); });
```

> **Nota:** Los listeners de `saveCatBtn` y `catNameInput` probablemente ya existen en el código original — verificar antes de duplicar.

#### 3.8 Cerrar el panel al presionar Escape

En el listener global de teclado que ya existe:
```js
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal();
    closeConfirm();
    // AÑADIR:
    if (catManagerOpen) toggleCatManager();
  }
});
```

---

## Resumen de IDs relevantes

| ID (HTML)           | Descripción                                      | Estado     |
|---------------------|--------------------------------------------------|------------|
| `btnEditCategories` | Botón lápiz en la barra de categorías            | **Nuevo**  |
| `categoryManager`   | Contenedor colapsable del panel de gestión       | **Nuevo**  |
| `catEditList`       | Lista dinámica de filas editables                | **Nuevo**  |
| `catNameInput`      | Input para nombre de nueva categoría             | Reutilizado|
| `colorPicker`       | Selector de color                                | Reutilizado|
| `saveCatBtn`        | Botón "Añadir" nueva categoría                   | Reutilizado|
| `cancelCatBtn`      | Botón "Cerrar" el panel                          | Reutilizado|
| `btnAddCategory`    | Botón `+` antiguo                                | **Eliminar**|
| `categoryForm`      | Contenedor antiguo del formulario inline         | **Eliminar**|

---

## Comportamiento esperado (UX)

1. El usuario ve la barra de pills con un ícono de lápiz `✏️` a la derecha (en lugar del `+`).
2. Al hacer click, se despliega el panel de gestión con animación suave (mismo patrón que Quick Links).
3. El panel muestra cada categoría como una fila con:
   - Dot de color a la izquierda.
   - Input con el nombre (editable directo).
   - Al hacer foco en el input, aparece un botón de check (✓) para confirmar el nuevo nombre.
   - Botón de basurero para eliminar (con confirmación modal existente).
   - La fila de "General" tiene el input deshabilitado y sin botón de eliminar.
4. Debajo de la lista hay un separador y el formulario de creación (nombre + picker de color + botón Añadir).
5. El botón "Cerrar" (antes "Cancelar") colapsa el panel sin cerrar los snippets ni el modal principal.
6. Al crear, renombrar o eliminar, la barra de pills y el `<select>` del modal de snippets se actualizan automáticamente.

---

## Archivos que NO se tocan

- `background.js` — sin cambios.
- `content.js` — sin cambios.
- `manifest.json` — sin cambios.
- `popup.html` / `popup.css` / `popup.js` — sin cambios (el plan es solo para el side panel).
