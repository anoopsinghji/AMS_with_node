# Attendance Management System (AMS) with EJS

A comprehensive attendance management system built with **Node.js**, **Express.js**, and **EJS** templates. This application allows principals to manage teachers and students, create class schedules with time validation, and enables teachers to mark attendance efficiently with real-time analytics.

---

## 🎯 Features

### 👨‍💼 Principal Dashboard
- **Teacher Management**: Register and manage teachers with role-based access
- **Student Management**: Add students and organize them by class
- **Class Assignment**: Assign classes to teachers
- **Schedule Management**: Create class schedules with:
  - Time validation (prevents invalid times like 01:89)
  - Start time must be before end time validation
  - Day-wise scheduling
  - Subject and teacher assignment
- **Analytics Dashboard**:
  - Attendance overview with charts
  - Student performance metrics
  - Class-wise attendance statistics
  - Real-time attendance summaries

### 👨‍🏫 Teacher Dashboard
- **Schedule View**: See assigned classes with timing
- **My Classes**: View students in assigned class
- **Attendance Management**:
  - Mark attendance for students
  - Date-based attendance marking
  - Prevent future date attendance
  - Historical attendance records
- **Statistics**:
  - Today's classes count
  - Pending attendance count
  - Upcoming classes
  - Total classes overview
- **Quick Access**: Easy navigation to today's, pending, and upcoming classes

### 🔐 Authentication & Security
- JWT-based authentication
- Password hashing with bcryptjs
- Role-based access control (RBAC)
- Secure token validation
- Protected API routes

---

## 🛠️ Tech Stack

### Backend
- **Node.js**: JavaScript runtime
- **Express.js** (v5.2.1): Web framework
- **JWT**: JSON Web Tokens for authentication
- **bcryptjs**: Password hashing
- **EJS**: Template engine
- **dotenv**: Environment configuration

### Frontend
- **HTML5/CSS3**: Markup and styling
- **Vanilla JavaScript**: Frontend logic
- **Chart.js** (v4.5.1): Data visualization
- **DataTables** (v1.13.4): Advanced table features
- **SweetAlert2** (v11.26.24): Beautiful alerts
- **Toastr** (v2.1.4): Toast notifications
- **Select2** (v4.1.0-rc.0): Enhanced select boxes
- **Flatpickr** (v4.6.13): Date picker
- **AOS** (v2.3.4): Scroll animations
- **Font Awesome** (v6.4.0): Icon library
- **Moment.js** (v2.30.1): Date manipulation

### Data Storage
- **JSON Files**: Persistent data storage for users, students, schedules, and attendance

---

## 📁 Project Structure

```
AMS with EJS/
├── app.js                           # Main application entry point
├── package.json                     # Dependencies configuration
├── .env                            # Environment variables
│
├── middleware/
│   └── auth.js                     # Authentication & authorization middleware
│
├── routes/
│   ├── auth.js                     # Authentication routes (login/register)
│   ├── admin.js                    # Principal/Admin routes
│   └── teacher.js                  # Teacher routes
│
├── utils/
│   └── fileStore.js                # JSON file read/write utilities
│
├── data/
│   ├── users.json                  # Teachers and principals data
│   ├── students.json               # Students information
│   ├── schedule.json               # Class schedules
│   └── attendance.json             # Attendance records
│
├── public/
│   ├── css/
│   │   ├── styles.css              # Global styles
│   │   ├── teacher-dashboard.css   # Teacher-specific styles
│   │   ├── principal-enhanced.css  # Principal-specific styles
│   │   └── sweetalert-custom.css   # Alert customization
│   │
│   ├── js/
│   │   ├── login.js                # Login page logic
│   │   ├── principal.js            # Principal dashboard logic
│   │   └── teacher.js              # Teacher dashboard logic
│   │
│   └── images/                     # Static images
│
└── views/
    ├── login.ejs                   # Login page template
    ├── principal.ejs               # Principal dashboard template
    └── teacher.ejs                 # Teacher dashboard template
```

---

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Step 1: Clone the Repository
```bash
cd "AMS with EJS"
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment Variables
Edit the `.env` file:
```env
PORT=3000
JWT_SECRET=replace_this_with_a_long_random_secret
```

**Important**: Replace `JWT_SECRET` with a secure random string (minimum 32 characters).

Generate a secure secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Start the Application
```bash
npm start
```

The application will be available at `http://localhost:3000`

---

## 📖 Usage Guide

### Initial Setup

#### 1. Register Principal (First Time)
```bash
# Use an API client (Postman, Thunder Client, etc.) to register:
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "id": "P001",
  "name": "Principal Name",
  "password": "securePassword123",
  "role": "principal"
}
```

#### 2. Login
Navigate to `http://localhost:3000` and login with principal credentials.

### Principal Workflow

1. **Register Teachers**
   - Go to "Register Teacher" section
   - Enter Teacher ID, Name, Email, Phone, Password
   - Select assigned class
   - Click "Register"

2. **Add Students**
   - Go to "Add Student" section
   - Enter student details (ID, Name, Class, DOB, Contact info, etc.)
   - Click "Add"

3. **Assign Classes**
   - Go to "Assign Class" section
   - Select teacher and class
   - Click "Assign"

4. **Create Schedule**
   - Go to "Create Class Schedule" section
   - Select Teacher, Class, Subject, Day
   - Enter Start Time and End Time (HH:MM format)
   - **Validation**: Times must be valid (e.g., 09:30, 14:45)
   - **Validation**: Start time must be before end time
   - Click "Create Schedule"

5. **View Analytics**
   - Dashboard shows real-time statistics
   - View attendance charts and summaries
   - Access attendance records by date and class

### Teacher Workflow

1. **Login**
   - Login with teacher credentials
   - View assigned class and students

2. **Mark Attendance**
   - Go to schedule details
   - Select date (cannot select future dates)
   - Check students present
   - Click "Submit Attendance"

3. **View Schedule**
   - See today's classes
   - View pending attendance
   - Check upcoming classes

4. **Access Statistics**
   - View today's classes count
   - See pending attendance count
   - Check total classes overview

---

## 🔌 API Endpoints

### Authentication Routes (`/api/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register` | Register new user (principal/teacher) |
| POST | `/login` | Login and get JWT token |
| POST | `/logout` | Logout user (client-side) |

### Admin Routes (`/api/admin`) - *Principal Only*
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/register-teacher` | Register a new teacher |
| POST | `/add-student` | Add a new student |
| POST | `/assign-class` | Assign class to teacher |
| GET | `/teachers` | Get all teachers |
| GET | `/classes` | Get all unique classes |
| GET | `/students-by-class/:className` | Get students in a class |
| POST | `/create-schedule` | Create class schedule with validation |
| GET | `/schedules` | Get all schedules |
| GET | `/teacher-schedule/:teacherId` | Get teacher's schedule |
| GET | `/class-schedule/:className` | Get class schedule |
| DELETE | `/schedule/:scheduleId` | Delete a schedule |
| GET | `/all-students` | Get all students details |
| GET | `/attendance-summary` | Get attendance summary |

### Teacher Routes (`/api/teacher`) - *Teacher Only*
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/my-class` | Get assigned class and students |
| GET | `/my-schedule` | Get personal schedule |
| GET | `/schedule/:scheduleId/students` | Get students for a schedule |
| POST | `/submit-attendance` | Submit attendance for a class |

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Check server status |

---

## 🔒 Data Structures

### User Object
```json
{
  "id": "T001",
  "name": "Teacher Name",
  "email": "teacher@example.com",
  "phone": "9876543210",
  "password": "hashed_password",
  "role": "teacher",
  "assignedClass": "10A"
}
```

### Student Object
```json
{
  "id": "S001",
  "name": "Student Name",
  "class": "10A",
  "email": "student@example.com",
  "phone": "9876543210",
  "dateOfBirth": "2008-05-15",
  "address": "123 Main St",
  "parentName": "Parent Name",
  "parentPhone": "9876543210",
  "admissionDate": "2024-01-15"
}
```

### Schedule Object
```json
{
  "id": "SCH1234567890",
  "teacherId": "T001",
  "className": "10A",
  "subject": "English",
  "startTime": "09:30",
  "endTime": "10:30",
  "day": "Monday",
  "createdDate": "2024-01-15"
}
```

### Attendance Object
```json
{
  "id": "ATT1234567890",
  "scheduleId": "SCH1234567890",
  "date": "2024-01-15",
  "presentIds": ["S001", "S002", "S003"],
  "createdBy": "T001",
  "createdDate": "2024-01-15"
}
```

---

## ✅ Validation Rules

### Time Validation
- ✅ Format: `HH:MM` (24-hour format)
- ✅ Valid hours: 00-23
- ✅ Valid minutes: 00-59
- ❌ Invalid examples: `01:89`, `25:00`, `12:60`

### Schedule Validation
- ✅ Start time must be before end time
- ✅ All fields are required
- ✅ Teacher and class must exist in system
- ✅ Class must have at least one student

### Attendance Validation
- ✅ Cannot mark attendance for future dates
- ✅ Cannot mark attendance for past dates (admin discretion)
- ✅ Schedule must exist
- ✅ Teacher must own the schedule

---

## 🎨 UI Features

### Principal Dashboard
- **Dashboard Stats**: Quick overview of key metrics
- **Data Tables**: SortFilterable and searchable tables
- **Charts**: Visual representation of attendance data
- **Forms**: User-friendly forms with validation
- **Responsive Design**: Works on desktop and mobile devices

### Teacher Dashboard
- **Today's Classes**: Quick view of current day schedule
- **Pending Attendance**: Shortcut to mark pending attendance
- **Upcoming Classes**: Preview of upcoming schedules
- **Statistics**: Real-time attendance and class statistics
- **Class Details**: Student roster and attendance history

### Notifications
- **Toast Notifications**: Quick feedback using Toastr
- **Sweet Alerts**: Confirmation and success messages
- **Error Messages**: Clear validation error messages
- **Loading States**: Visual feedback during operations

---

## 🐛 Troubleshooting

### Application Won't Start
```bash
# Check Node.js version
node --version

# Reinstall dependencies
rm -rf node_modules
npm install

# Check port availability
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Mac/Linux
```

### Login Issues
- Verify credentials are correct
- Check JWT_SECRET is properly set in .env
- Clear browser cache and cookies
- Check console for error messages

### Data Not Saving
- Verify `data/` directory exists and has write permissions
- Check file permissions: `chmod 755 data/`
- Ensure JSON files are not corrupted
- Check available disk space

### Schedule Creation Fails
- Verify teacher exists in system
- Verify class has at least one student
- Check time format (HH:MM)
- Ensure start time is before end time
- Check browser console for detailed error

---

## 📝 Notes

### Data Persistence
- All data is stored in JSON files in the `data/` directory
- Files are created automatically on first use
- Regular backups are recommended for production use

### Security Considerations
1. **Change JWT_SECRET**: Update in `.env` immediately
2. **Use HTTPS**: Deploy with SSL certificate in production
3. **Input Validation**: All inputs are validated server-side
4. **Password Security**: Passwords are hashed with bcryptjs
5. **Token Expiration**: Implement token refresh in production

### Performance Tips
- Clear old attendance records periodically
- Archive completed schedules
- Optimize charts for large datasets
- Use database instead of JSON files for production

---

## 🚀 Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Email notifications for attendance
- [ ] SMS alerts
- [ ] Mobile app
- [ ] Advanced reporting
- [ ] Offline functionality
- [ ] Multi-language support
- [ ] Parent portal
- [ ] Automated routine schedules
- [ ] Leave management system
- [ ] Performance analytics
- [ ] Dashboard customization

---

## 📄 License

This project is licensed under the ISC License.

---

## 👥 Support

For issues and questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check browser console for errors
4. Verify `.env` configuration
5. Check data file permissions

---

## 📞 Contact & Credits

Created with ❤️ for educational institutions.

**Version**: 1.0.0  
**Last Updated**: 02-04-2026  
**Status**: Active Development

---

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [JWT Introduction](https://jwt.io/)
- [EJS Template Engine](https://ejs.co/)
- [Chart.js Documentation](https://www.chartjs.org/)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)

---

## 🔄 Version History

### v1.0.0 (Current)
- ✅ Core authentication system
- ✅ Principal dashboard with analytics
- ✅ Teacher dashboard with attendance marking
- ✅ Schedule management with time validation
- ✅ Student and teacher management
- ✅ Real-time notifications
- ✅ Responsive UI design
