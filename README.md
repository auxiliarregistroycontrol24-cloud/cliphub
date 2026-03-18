# QuickCopy

Una extensión moderna de Chrome para administrar y copiar snippets (fragmentos de texto) reutilizables de forma rápida y eficiente.

## 🎯 Características

- **Guardar Snippets**: Almacena fragmentos de texto para reutilizar fácilmente
- **Búsqueda Rápida**: Encuentra tus snippets por nombre instantáneamente
- **Categorías**: Organiza tus snippets por categorías personalizables
- **12 Colores**: Identifica categorías visualmente con 12 colores predefinidos
- **Copia Rápida**: Copia al portapapeles con un solo clic
- **Almacenamiento Persistente**: Sincronización automática en Chrome Storage
- **Interfaz Intuitiva**: Diseño moderno y responsivo completamente en español

## 📦 Instalación

### Instalación en Chrome

1. Clona o descarga este repositorio
2. Abre Chrome y ve a `chrome://extensions/`
3. Activa el "Modo de desarrollador" en la esquina superior derecha
4. Haz clic en "Cargar extensión sin empaquetar"
5. Selecciona la carpeta del proyecto
6. ¡La extensión QuickCopy aparecerá en tu barra de herramientas!

## 🚀 Uso

1. Haz clic en el icono de QuickCopy en la barra de herramientas
2. **Crear Snippet**: 
   - Selecciona una categoría o crea una nueva
   - Ingresa el nombre y contenido del snippet
   - Guarda

3. **Buscar y Copiar**:
   - Usa el campo de búsqueda para encontrar snippets
   - Haz clic en el snippet que deseas copiar
   - Se copiará automáticamente al portapapeles

## 📁 Estructura del Proyecto

```
cliphub/
├── manifest.json       # Configuración de la extensión
├── popup.html         # Interfaz HTML
├── popup.css          # Estilos CSS
├── popup.js           # Lógica JavaScript
├── README.md          # Este archivo
└── .gitignore         # Archivos ignorados por git
```

## 🛠️ Desarrollo

### Requisitos
- Chrome 91+
- Cualquier editor de código (VS Code recomendado)

### Estructura del Código

- **manifest.json**: Define permisos (storage, clipboardWrite) y configuración de la extensión
- **popup.html**: Estructura HTML con componentes para categorías, búsqueda y modal
- **popup.js**: Lógica de aplicación, gestión de estado y almacenamiento
- **popup.css**: Diseño responsivo con variables CSS y componentes modernos

### Para contribuir
1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Realiza tus cambios
4. Haz commit (`git commit -m 'Add some AmazingFeature'`)
5. Push a la rama (`git push origin feature/AmazingFeature`)
6. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👤 Autor

Desarrollado por el equipo de Auxiliar Registro y Control 24 Cloud.

## 🤝 Soporte

Si encuentras algún problema o tienes sugerencias, abre un issue en el repositorio.

---

**Versión**: 1.0.0  
**Última actualización**: Marzo 2026
