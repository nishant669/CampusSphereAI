const mongoose = require('mongoose');
const User = require('../models/User');
const Student = require('../models/Student');
const Professor = require('../models/Professor');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Marks = require('../models/Marks');
const SubmissionStatus = require('../models/SubmissionStatus');
const StudyMaterial = require('../models/StudyMaterial');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    console.log('Checking database seed status...');

    // 1. Ensure Admin User
    let adminUser = await User.findOne({ role: 'ADMIN' });
    if (!adminUser) {
      adminUser = await User.create({
        name: process.env.ADMIN_NAME || 'Director / HOD (Administrator)',
        email: process.env.ADMIN_EMAIL || 'admin@college.edu',
        password: process.env.ADMIN_PASSWORD || 'Admin@123',
        role: 'ADMIN'
      });
      console.log('Admin user created');
    }

    // 2. Ensure Subjects
    const subjectsData = [
      { subjectCode: 'CS501', subjectName: 'Java Programming', semester: 5, branch: 'CSE', course: 'B.Tech', academicYear: '2024-25' },
      { subjectCode: 'CS502', subjectName: 'Database Management', semester: 5, branch: 'CSE', course: 'B.Tech', academicYear: '2024-25' },
      { subjectCode: 'CS503', subjectName: 'Computer Networks', semester: 5, branch: 'CSE', course: 'B.Tech', academicYear: '2024-25' },
      { subjectCode: 'CS504', subjectName: 'Operating Systems', semester: 5, branch: 'CSE', course: 'B.Tech', academicYear: '2024-25' },
      { subjectCode: 'CS505', subjectName: 'Software Engineering', semester: 5, branch: 'CSE', course: 'B.Tech', academicYear: '2024-25' },
      { subjectCode: 'CS506', subjectName: 'Artificial Intelligence', semester: 5, branch: 'CSE', course: 'B.Tech', academicYear: '2024-25' }
    ];

    const subjectDocs = [];
    for (const sub of subjectsData) {
      let doc = await Subject.findOne({ subjectCode: sub.subjectCode });
      if (!doc) {
        doc = await Subject.create(sub);
      } else {
        if (!doc.course) {
          doc.course = 'B.Tech';
          await doc.save();
        }
      }
      subjectDocs.push(doc);
    }
    console.log('Subjects verified/created');

    // 3. Ensure Professors
    const professorsData = [
      {
        fullName: 'Dr. Rajesh Verma',
        email: 'prof.rajesh@college.edu',
        employeeId: 'PROF101',
        phone: '9876500001',
        department: 'CSE',
        course: 'B.Tech',
        password: 'Prof@123',
        assignedSubjectCodes: ['CS501', 'CS502']
      },
      {
        fullName: 'Dr. Sunita Sharma',
        email: 'prof.sunita@college.edu',
        employeeId: 'PROF102',
        phone: '9876500002',
        department: 'CSE',
        course: 'B.Tech',
        password: 'Prof@123',
        assignedSubjectCodes: ['CS503', 'CS504']
      }
    ];

    const professorDocs = [];
    for (const p of professorsData) {
      let user = await User.findOne({ email: p.email });
      if (!user) {
        user = await User.create({
          name: p.fullName,
          email: p.email,
          password: p.password,
          role: 'PROFESSOR'
        });
      }

      let prof = await Professor.findOne({ employeeId: p.employeeId });
      const assignedIds = subjectDocs
        .filter(s => p.assignedSubjectCodes.includes(s.subjectCode))
        .map(s => s._id);

      if (!prof) {
        prof = await Professor.create({
          userId: user._id,
          employeeId: p.employeeId,
          fullName: p.fullName,
          email: p.email,
          phone: p.phone,
          course: p.course,
          department: p.department,
          assignedSubjects: assignedIds,
          status: 'ACTIVE'
        });
      } else {
        prof.assignedSubjects = assignedIds;
        await prof.save();
      }

      // Link in Subject docs
      await Subject.updateMany(
        { _id: { $in: assignedIds } },
        { $set: { assignedProfessor: prof._id } }
      );

      professorDocs.push(prof);
    }
    console.log('Professors verified/created');

    // 4. Ensure Students
    const studentsData = [
      {
        enrollmentNumber: '2301234567',
        fullName: 'Rahul Sharma',
        email: 'rahul@student.college.edu',
        phone: '9876543210',
        course: 'B.Tech',
        branch: 'CSE',
        semester: 5,
        section: 'A',
        academicYear: '2024-25',
        lastSemSGPA: 8.45,
        cgpa: 8.20,
        academicPerformance: [
          { semester: 1, sgpa: 8.0, cgpa: 8.0, totalCredits: 22, backlogs: 0, remarks: 'Excellent' },
          { semester: 2, sgpa: 8.1, cgpa: 8.05, totalCredits: 22, backlogs: 0, remarks: 'Very Good' },
          { semester: 3, sgpa: 8.2, cgpa: 8.10, totalCredits: 24, backlogs: 0, remarks: 'Very Good' },
          { semester: 4, sgpa: 8.45, cgpa: 8.20, totalCredits: 24, backlogs: 0, remarks: 'Outstanding' }
        ],
        password: 'Student@123'
      },
      {
        enrollmentNumber: '2301234568',
        fullName: 'Priya Singh',
        email: 'priya@student.college.edu',
        phone: '9876543211',
        course: 'B.Tech',
        branch: 'CSE',
        semester: 5,
        section: 'A',
        academicYear: '2024-25',
        lastSemSGPA: 8.80,
        cgpa: 8.65,
        academicPerformance: [
          { semester: 1, sgpa: 8.5, cgpa: 8.5, totalCredits: 22, backlogs: 0, remarks: 'Outstanding' },
          { semester: 2, sgpa: 8.6, cgpa: 8.55, totalCredits: 22, backlogs: 0, remarks: 'Outstanding' },
          { semester: 3, sgpa: 8.7, cgpa: 8.60, totalCredits: 24, backlogs: 0, remarks: 'Top Performer' },
          { semester: 4, sgpa: 8.8, cgpa: 8.65, totalCredits: 24, backlogs: 0, remarks: 'Top Performer' }
        ],
        password: 'Student@123'
      },
      {
        enrollmentNumber: '2301234569',
        fullName: 'Amit Kumar',
        email: 'amit@student.college.edu',
        phone: '9876543212',
        course: 'B.Tech',
        branch: 'CSE',
        semester: 5,
        section: 'B',
        academicYear: '2024-25',
        lastSemSGPA: 7.60,
        cgpa: 7.45,
        academicPerformance: [
          { semester: 1, sgpa: 7.2, cgpa: 7.2, totalCredits: 22, backlogs: 0, remarks: 'Good' },
          { semester: 2, sgpa: 7.4, cgpa: 7.3, totalCredits: 22, backlogs: 0, remarks: 'Good' },
          { semester: 3, sgpa: 7.5, cgpa: 7.37, totalCredits: 24, backlogs: 0, remarks: 'Consistent' },
          { semester: 4, sgpa: 7.6, cgpa: 7.45, totalCredits: 24, backlogs: 0, remarks: 'Improving' }
        ],
        password: 'Student@123'
      }
    ];

    const studentDocs = [];
    for (const s of studentsData) {
      let user = await User.findOne({ email: s.email });
      if (!user) {
        user = await User.create({
          name: s.fullName,
          email: s.email,
          password: s.password,
          role: 'STUDENT'
        });
      }

      let student = await Student.findOne({ enrollmentNumber: s.enrollmentNumber });
      if (!student) {
        student = await Student.create({
          userId: user._id,
          enrollmentNumber: s.enrollmentNumber,
          fullName: s.fullName,
          email: s.email,
          phone: s.phone,
          course: s.course,
          branch: s.branch,
          semester: s.semester,
          section: s.section,
          academicYear: s.academicYear,
          lastSemSGPA: s.lastSemSGPA,
          cgpa: s.cgpa,
          academicPerformance: s.academicPerformance
        });
      } else {
        student.course = s.course;
        student.lastSemSGPA = s.lastSemSGPA;
        student.cgpa = s.cgpa;
        student.academicPerformance = s.academicPerformance;
        await student.save();
      }
      studentDocs.push(student);
    }
    console.log('Students verified/created with SGPA/CGPA records');

    // 5. Ensure Attendance
    const existingAttendanceCount = await Attendance.countDocuments();
    if (existingAttendanceCount === 0) {
      const today = new Date();
      const attendanceRecords = [];
      
      for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        if (date.getDay() === 0 || date.getDay() === 6) continue;

        for (const student of studentDocs) {
          for (const subject of subjectDocs) {
            const status = Math.random() < 0.8 ? 'PRESENT' : 'ABSENT';
            attendanceRecords.push({
              student: student._id,
              subject: subject._id,
              date: date,
              status
            });
          }
        }
      }
      await Attendance.insertMany(attendanceRecords);
      console.log('Attendance seeded');
    }

    // 6. Ensure Marks (MST 1, 2, 3 and Unit Tests)
    const existingMarksCount = await Marks.countDocuments();
    if (existingMarksCount === 0) {
      const marksRecords = [];
      for (const student of studentDocs) {
        for (const subject of subjectDocs) {
          marksRecords.push({
            student: student._id,
            subject: subject._id,
            examType: 'MST_1',
            obtainedMarks: Math.floor(Math.random() * 11) + 12,
            maximumMarks: 25,
            remarks: 'Satisfactory performance'
          });
          marksRecords.push({
            student: student._id,
            subject: subject._id,
            examType: 'MST_2',
            obtainedMarks: Math.floor(Math.random() * 10) + 14,
            maximumMarks: 25,
            remarks: 'Good progress'
          });
          marksRecords.push({
            student: student._id,
            subject: subject._id,
            examType: 'UNIT_TEST_1',
            obtainedMarks: Math.floor(Math.random() * 5) + 6,
            maximumMarks: 10,
            remarks: 'Well prepared'
          });
          marksRecords.push({
            student: student._id,
            subject: subject._id,
            examType: 'UNIT_TEST_2',
            obtainedMarks: Math.floor(Math.random() * 4) + 7,
            maximumMarks: 10,
            remarks: 'Very active'
          });
        }
      }
      await Marks.insertMany(marksRecords);
      console.log('Marks seeded (MST1, MST2, UT1, UT2)');
    }

    // 7. Ensure Submission Status (Assignment & Practical)
    for (const student of studentDocs) {
      for (const subject of subjectDocs) {
        const existing = await SubmissionStatus.findOne({ student: student._id, subject: subject._id });
        if (!existing) {
          await SubmissionStatus.create({
            student: student._id,
            subject: subject._id,
            assignmentSubmitted: Math.random() > 0.3, // 70% submitted
            assignmentSubmissionDate: new Date(),
            assignmentRemarks: 'Assignment 1 & 2 completed',
            practicalSubmitted: Math.random() > 0.25, // 75% practical submitted
            practicalSubmissionDate: new Date(),
            practicalRemarks: 'Lab file signed and verified',
            updatedBy: adminUser._id
          });
        }
      }
    }
    console.log('Assignment and Practical submission statuses verified/created');

    console.log('Database seeding & synchronization completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

module.exports = { seedDatabase };

if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/college_portal')
    .then(async () => {
      await seedDatabase();
      process.exit(0);
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
