# Attendance Management System (AMS)

A full-stack Attendance Management System built with Node.js, Express, EJS, and MongoDB.

Developer: Anoop Singh

## Overview

AMS helps schools manage teacher accounts, student records, class schedules, and attendance tracking through separate Principal and Teacher dashboards.

## Key Features

- Role-based authentication for Principal and Teacher
- Secure JWT-based login flow
- Teacher account creation and class assignment
- Student admission and record management
- Schedule creation per teacher, class, subject, and day
- Attendance marking by teachers (present and absent lists)
- Attendance summaries and stats for principal analytics
- Teacher performance insights on principal dashboard
- Modern UI with charts, tables, and notifications
- Custom project logo favicon across pages

## Tech Stack

- Backend: Node.js, Express
- Frontend: EJS, HTML, CSS, Vanilla JavaScript
- Database: MongoDB with Mongoose
- Authentication: JSON Web Token (JWT)
- UI and Libraries: SweetAlert2, Toastr, Chart.js, DataTables, Flatpickr, AOS, Select2

## Project Structure

- app.js: App entry point and route mounting
- config/db.js: MongoDB connection
- middleware/auth.js: JWT auth and role guard middleware
- models/: Mongoose models (User, Student, Schedule, Attendance)
- routes/: API routes (auth, admin, teacher)
- utils/seedDefaultPrincipal.js: Creates default principal user on startup
- views/: EJS pages (login, principal dashboard, teacher dashboard)
- public/: Static assets (css, js, images)

## Roles and Dashboards

### Principal

- Create teacher accounts
- Add students
- Assign class to teachers
- Create and manage class schedules
- View teacher list and student records
- View attendance summary and attendance statistics charts

### Teacher

- View class and schedule
- View students by schedule
- Submit attendance by date and schedule
- See class cards grouped into Today, Pending, and Upcoming

## API Routes

Base URL for local development: http://localhost:3000

### Authentication

- POST /api/auth/register
- POST /api/auth/login
- GET /api/auth/me

### Principal (admin)

- POST /api/admin/register-teacher
- POST /api/admin/add-student
- POST /api/admin/assign-class
- GET /api/admin/teachers
- GET /api/admin/classes
- GET /api/admin/students-by-class/:className
- POST /api/admin/create-schedule
- GET /api/admin/schedules
- GET /api/admin/teacher-schedule/:teacherId
- GET /api/admin/class-schedule/:className
- DELETE /api/admin/schedule/:scheduleId
- GET /api/admin/all-students
- GET /api/admin/attendance-summary
- GET /api/admin/attendance-stats

### Teacher

- GET /api/teacher/my-class
- GET /api/teacher/my-schedule
- GET /api/teacher/schedule/:scheduleId/students
- POST /api/teacher/submit-attendance

## Getting Started

### 1. Clone the repository

- git clone https://github.com/anoopsinghji/AMS_with_node.git
- cd AMS_with_node

### 2. Install dependencies

- npm install

### 3. Configure environment variables

Create a .env file in the project root with values similar to:

- PORT=3000
- MONGODB_URI=mongodb://127.0.0.1:27017/ams_with_ejs
- JWT_SECRET=your_jwt_secret_here
- DEFAULT_PRINCIPAL_ID=P001
- DEFAULT_PRINCIPAL_NAME=Principal
- DEFAULT_PRINCIPAL_PASSWORD=principal123

### 4. Run the app

- npm start

Or use:

- npm run dev

Open:

- http://localhost:3000

## Default Principal User

On first startup, the app seeds a principal account if none exists.

Default values are read from environment variables:

- ID: DEFAULT_PRINCIPAL_ID (default P001)
- Name: DEFAULT_PRINCIPAL_NAME (default Principal)
- Password: DEFAULT_PRINCIPAL_PASSWORD (default principal123)

Important: Change default credentials immediately in production.

## Authentication and Security Notes

- JWT token is generated after login and used in Authorization header.
- Principal routes are protected by role guard requiring principal role.
- Teacher routes are protected by role guard requiring teacher role.
- Passwords are hashed with bcrypt before storing.

## Data Models (High Level)

- User: id, name, email, phone, password, role, assignedClass
- Student: id, name, class, contact and guardian details
- Schedule: id, teacherId, className, subject, startTime, endTime, day
- Attendance: date, class, teacherId, scheduleId, present, absent

## Scripts

- npm start: Start server
- npm run dev: Start server in development mode
- npm test: Placeholder test command

## Health Check

- GET /health returns { status: ok }

## Branding

- Project favicon/logo: public/images/ams-logo.svg

## License

This project is licensed under the MIT License.
See the LICENSE file for details.

## Developer

Anoop Singh
