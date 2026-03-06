# ProjectFlow - Project Management System Specification

## 1. Project Overview

**Project Name**: ProjectFlow  
**Type**: Full-stack Web Application  
**Core Functionality**: A comprehensive project management system with Spaces, Projects, and Tasks hierarchy  
**Target Users**: Teams and individuals who need to organize projects and tasks

## 2. Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express.js |
| Database | SQLite (sql.js) |
| API | RESTful JSON API |

## 3. Project Structure

```
d:/workspace/Tasker/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── db.js
│   │   ├── routes/
│   │   │   ├── spaces.js
│   │   │   ├── projects.js
│   │   │   └── tasks.js
│   │   └── models/
│   │       ├── space.js
│   │       ├── project.js
│   │       └── task.js
│   ├── data/
│   │   └── projectflow.db
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── App.css
    │   ├── api.js
    │   ├── i18n.js
    │   └── components/
    │       ├── Layout.jsx
    │       ├── Sidebar.jsx
    │       ├── SpaceList.jsx
    │       ├── ProjectList.jsx
    │       ├── TaskList.jsx
    │       ├── Modal.jsx
    │       └── ConfirmDialog.jsx
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 4. Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| username | TEXT UNIQUE | Username |
| password | TEXT | Hashed password |
| created_at | TEXT | Timestamp |

### Spaces Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| user_id | INTEGER | Foreign key to users |
| name | TEXT NOT NULL | Space name |
| created_at | TEXT | Timestamp |

### Projects Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| space_id | INTEGER | Foreign key to spaces |
| name | TEXT NOT NULL | Project name |
| type | TEXT | 'general' or 'development' |
| description | TEXT | Project description |
| status | TEXT | Project status |
| start_date | TEXT | Start date |
| end_date | TEXT | End date |
| remarks | TEXT | Remarks |
| dev | TEXT | Development info (dev type) |
| test | TEXT | Testing info (dev type) |
| ops | TEXT | Operations info (dev type) |
| release_date | TEXT | Release date (dev type) |
| docs_url | TEXT | Documentation URL (dev type) |
| created_at | TEXT | Timestamp |

### Tasks Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment ID |
| project_id | INTEGER | Foreign key to projects |
| name | TEXT NOT NULL | Task name |
| description | TEXT | Task description |
| priority | TEXT | 'low', 'medium', 'high' (no default; user must choose) |
| due_date | TEXT | Due date |
| status | TEXT | 'todo', 'in_progress', 'done' |
| created_at | TEXT | Timestamp |

## 5. UI/UX Specification

### Layout
- Fixed layout: 1920x1080 base, responsive
- Left sidebar: collapsible, 240px width (60px collapsed)
- Right content area: flexible width
- Mobile: sidebar becomes drawer, bottom navigation

### Visual Design
- Light mode: Background #F5F7FA, Primary #4F46E5
- Dark mode: Background #1A1B1E, Primary #6366F1
- Card background: White (light) / #2D2E33 (dark)
- Border radius: 12px
- Font: Inter

### Components
1. **Layout**: Main container with sidebar and content
2. **Sidebar**: Collapsible, shows Spaces list
3. **SpaceList**: Shows all spaces with add/edit/delete
4. **ProjectList**: Grid of project cards
5. **TaskList**: Table/list of tasks
6. **Modal**: For creating/editing entities
7. **ConfirmDialog**: Delete confirmation modal

### Responsive Breakpoints
- Desktop: >= 1200px
- Tablet: 768px - 1199px
- Mobile: < 768px

## 6. API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |

### Spaces
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/spaces | Get all spaces |
| POST | /api/spaces | Create space |
| PUT | /api/spaces/:id | Update space |
| DELETE | /api/spaces/:id | Delete space (cascades) |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/spaces/:spaceId/projects | Get projects in space |
| POST | /api/spaces/:spaceId/projects | Create project |
| PUT | /api/projects/:id | Update project |
| DELETE | /api/projects/:id | Delete project (cascades) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/projects/:projectId/tasks | Get tasks in project |
| POST | /api/projects/:projectId/tasks | Create task |
| PUT | /api/tasks/:id | Update task |
| DELETE | /api/tasks/:id | Delete task |

## 7. Acceptance Criteria

1. User can register and login
2. User can create/edit/delete Spaces
3. User can create/edit/delete Projects within a Space
4. User can create/edit/delete Tasks within a Project
5. Light/Dark mode toggle works
6. English/Chinese language toggle works
7. Sidebar can collapse
8. Responsive on all screen sizes
9. Delete confirmations show properly
