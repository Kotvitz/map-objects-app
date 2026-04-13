
# Map Objects Application

The application allows users to draw geometric objects directly on the map, assign metadata to them, edit them, delete them, and control their display order.

---

# Requirements

Before running the application, make sure the following tools are installed:

- **Node.js** (recommended version 18 or newer)
- **npm** (included with Node.js)

You can verify installation with:

```bash
node -v
npm -v
```

---

# Installation

Clone the repository:

```bash
git clone <repository-url>
```

Navigate to the project directory:

```bash
cd map-objects-app
```

Install dependencies:

```bash
npm install
```

---

# Running the application

Start the development server:

```bash
npm run dev
```

After starting, open your browser and go to:

```text
http://localhost:5173
```

---

# Application features

## Object creation

Users can create map objects by:

1. Click the "+ Add Object" button on the sidebar menu

2. Selecting a drawing tool:
   - Point
   - Line
   - Polygon

3. Drawing the shape on the map.

4. Filling in metadata:
   - Name (**required**)
   - Description
   - Image URL
   - Color

5. Saving the object.

The object will then appear on:

- the map
- the sidebar list

---

## Object editing

Objects can be edited by:

1. Clicking the **edit icon** in the sidebar
2. Updating metadata
3. Saving changes

---

## Object deletion

Objects can be removed using the **delete icon** in the sidebar.

Deleted objects are removed from:

- the map
- the sidebar list

---

## Map interaction

Users can:

- Click objects on the map
- View popup information containing:
  - Name
  - Description
  - Image (if URL provided)

---

## Object focusing

Clicking an object in the sidebar automatically:

- moves the map
- zooms to the selected object

---

## Object ordering

Objects can be reordered using:

- Drag-and-drop in the sidebar

Display order on the map follows the sidebar order.

---

# Technologies used

This project uses:

- React
- TypeScript
- Vite
- MapLibre GL JS
- Geoman (MapLibre drawing tools)
- Mantine UI
- TanStack React Query
- Mock Service Worker (MSW)
- dnd-kit

---

# Mock API behavior

The application uses **Mock Service Worker (MSW)** to simulate backend API behavior.

Supported endpoints:

- `GET /api/objects`
- `POST /api/objects`
- `PUT /api/objects/:id`
- `DELETE /api/objects/:id`
- `PATCH /api/objects/reorder`

## Important note

Object data is stored **in memory only**.

This means:

- Objects persist during the current session
- Objects reset after refreshing the browser
- No external database is used

---

# Project structure

```text
src/
  components/        # Layout components
  features/
    map/             # Map rendering logic
    objects/         # Object form logic
  mocks/             # Mock Service Worker setup
  services/          # API service layer
  types/             # TypeScript types
```

---

# Support

If you encounter issues running the application:

1. Verify Node.js version:

```bash
node -v
```

Recommended:

```text
Node.js 18+
```

2. Remove node_modules and reinstall:

```bash
rm -rf node_modules
npm install
```

3. Restart development server:

```bash
npm run dev
```

