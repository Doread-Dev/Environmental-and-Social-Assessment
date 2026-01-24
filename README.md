# Environmental and Social Assessment

**Environmental & Social Management System (ESMS)**  
Full-stack application for managing environmental and social impact assessments for development projects.

Aga Khan Foundation – Syria

---

## 📋 Project Overview

This is a comprehensive system for managing environmental and social assessments following a structured workflow with 5 main tools:

1. **Tool 1 — Screening**: Initial environmental risk categorization
2. **Tool 2 — Assessment**: Detailed environmental impact evaluation
3. **Tool 3 — SEMP (Management Activities)**: General management planning
4. **Tool 4 — Mitigation Plan**: Impact mitigation and enhancement strategies
5. **Tool 5 — Monitoring**: Ongoing environmental monitoring and evaluation

---

## 🏗️ Project Structure

```
├── backend/              # Express + MongoDB Backend
│   ├── src/
│   ├── package.json
│   └── README.md
│
├── frontend/             # React SPA Frontend
│   ├── src/
│   ├── documents/        # Project documentation & plans
│   │   ├── MASTER_PLAN.md
│   │   ├── phase-1-plan.md
│   │   ├── phase-2-plan.md
│   │   ├── phase-3-plan.md
│   │   └── PHASE_3_REVIEW.md
│   ├── package.json
│   └── README.md
│
└── Static UI/            # Original static HTML pages (reference)
```

---

## 🚀 Getting Started

### Frontend Setup

The frontend is a React SPA built with:
- **React 19.x** (latest stable)
- **React Router 7.x** (latest stable)
- **Tailwind CSS 4.x** (latest stable)
- **Vite 7.x** (latest stable)

```bash
cd frontend
npm install
npm run dev
```

See `frontend/README.md` for detailed frontend setup instructions.

**Current Status:** ✅ Phase 3 Complete - Ready for Phase 4

### Backend Setup

Navigate to the backend directory and follow the setup instructions:

```bash
cd backend
npm install
```

See `backend/README.md` for detailed backend setup instructions.

---

## 📊 Project Status

### Frontend Progress

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Project Setup & Build Pipeline |
| Phase 2 | ✅ Complete | Component Library (22 UI components) |
| Phase 3 | ✅ Complete | Layout Components & Routing (7 layout components, 25+ routes) |
| Phase 4 | 🔄 Next | Auth & Dashboard Domain |
| Phase 5 | ⏳ Pending | Project Workspace — Overview & Screening |
| Phase 6 | ⏳ Pending | Project Workspace — Assessment |
| Phase 7 | ⏳ Pending | Project Workspace — SEMP |
| Phase 8 | ⏳ Pending | Project Workspace — Monitoring & Files |
| Phase 9 | ⏳ Pending | QA & Consistency |

### Key Achievements

- ✅ **29 Components**: 22 UI components + 7 layout components
- ✅ **25+ Routes**: Complete routing structure configured
- ✅ **Dark Mode**: Full dark mode support
- ✅ **Responsive Design**: Mobile-first approach
- ✅ **Design System**: Unified color tokens and typography

---

## 📚 Documentation

### Frontend Documentation

All frontend documentation is in `frontend/documents/`:

- **MASTER_PLAN.md** - Comprehensive master plan (all phases)
- **phase-1-plan.md** - Phase 1 detailed plan (✅ Complete)
- **phase-2-plan.md** - Phase 2 detailed plan (✅ Complete)
- **phase-3-plan.md** - Phase 3 detailed plan (✅ Complete)
- **PHASE_3_REVIEW.md** - Phase 3 comprehensive review with all decisions and agreements

### Important Notes for Developers

1. **Step Locking Logic**: Currently disabled - all workflow tools are unlocked. TODO comments indicate where to re-enable sequential step locking.

2. **Navigation Structure**: 
   - Assessment menu contains only: Metadata, Methods, Scoring
   - Annex & Attachments contains: Attachments (files), Annex
   - Auto-expansion occurs only when visiting child pages manually

3. **Header Structure**: 
   - ProjectLayout has unified header (ESMS System logo on left)
   - Theme toggle is in User Card Dropdown (not in Header)
   - Each project page can have its own header based on requirements

4. **Mobile Menu**: 
   - Project variant shows "Back to Dashboard" instead of logo
   - Theme toggle is in User Card Dropdown

---

## 🛠️ Technology Stack

### Frontend

- React 19.x
- React Router 7.x
- Tailwind CSS 4.x
- Vite 7.x
- ESLint + Prettier

### Backend

- Express.js
- MongoDB

---

## 📝 License

ISC

---

## 📞 Support

For questions or assistance:

- **Frontend**: See `frontend/README.md` and `frontend/documents/`
- **Backend**: See `backend/README.md`
- **Master Plan**: See `frontend/documents/MASTER_PLAN.md`
- **Phase Reviews**: See `frontend/documents/PHASE_*_REVIEW.md`

---

**Last Updated:** January 23, 2026  
**Current Phase:** Phase 3 Complete ✅  
**Next Phase:** Phase 4 (Auth & Dashboard Domain)
