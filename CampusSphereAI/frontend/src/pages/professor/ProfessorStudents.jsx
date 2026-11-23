import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { ChevronDownIcon, ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import { getMe } from '../../services/professorService';
import { getSubjectFull } from '../../services/studentService';

const EXAM_LABEL = {
  MST_1: 'MST 1', MST_2: 'MST 2', MST_3: 'MST 3',
  UNIT_TEST_1: 'Unit Test 1', UNIT_TEST_2: 'Unit Test 2', UNIT_TEST_3: 'Unit Test 3'
};

const ProfessorStudents = () => {
  const [professor, setProfessor] = useState(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [students, setStudents] = useState([]);
  const [loadingProfessor, setLoadingProfessor] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState({});

  useEffect(() => {
    fetchProfessor();
  }, []);

  const fetchProfessor = async () => {
    try {
      setLoadingProfessor(true);
      const res = await getMe();
      setProfessor(res.data);
      if (res.data?.assignedSubjects?.length > 0) {
        const firstSubj = res.data.assignedSubjects[0];
        setSelectedSubjectId(typeof firstSubj === 'object' ? firstSubj._id : firstSubj);
      }
    } catch (error) {
      toast.error('Failed to load professor profile');
    } finally {
      setLoadingProfessor(false);
    }
  };

  const handleLoadStudents = async () => {
    if (!selectedSubjectId) {
      toast.error('Please select a subject');
      return;
    }
    
    try {
      setLoadingStudents(true);
      const res = await getSubjectFull({ subjectId: selectedSubjectId });
      // API may return data in different shapes
      const studentsData = Array.isArray(res.data) ? res.data : (res.data?.students || []);
      setStudents(studentsData);
      setExpandedRows({}); // Reset expansions
      toast.success('Students loaded successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to load students');
    } finally {
      setLoadingStudents(false);
    }
  };

  const toggleRowExpand = (studentId) => {
    setExpandedRows(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const getAttendanceBadgeClass = (percentage) => {
    if (percentage === null || percentage === undefined) return 'badge-gray';
    if (percentage >= 75) return 'badge-green';
    if (percentage >= 60) return 'badge-yellow';
    return 'badge-red';
  };

  const getCgpaBadgeClass = (cgpa) => {
    if (cgpa === null || cgpa === undefined) return 'badge-gray';
    if (cgpa >= 8) return 'badge-green';
    if (cgpa >= 6) return 'badge-blue';
    if (cgpa >= 5) return 'badge-yellow';
    return 'badge-red';
  };
  
  const getMarksPercentClass = (percentage) => {
    if (percentage === null || percentage === undefined) return '';
    if (percentage >= 75) return 'text-green-600 font-medium';
    if (percentage >= 50) return 'text-yellow-600 font-medium';
    return 'text-red-600 font-medium';
  };

  const filteredStudents = students.filter(student => 
    (student.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.enrollmentNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Summary stats calculations
  const totalStudents = filteredStudents.length;
  const below75SubjectAtt = filteredStudents.filter(s => s.subjectAttendance?.percentage !== null && s.subjectAttendance?.percentage < 75).length;
  const below75OverallAtt = filteredStudents.filter(s => s.overallAttendance?.percentage !== null && s.overallAttendance?.percentage < 75).length;
  
  const validCgpaStudents = filteredStudents.filter(s => s.cgpa !== null && s.cgpa !== undefined);
  const avgCgpa = validCgpaStudents.length > 0 
    ? (validCgpaStudents.reduce((sum, s) => sum + s.cgpa, 0) / validCgpaStudents.length).toFixed(2)
    : 'N/A';

  if (loadingProfessor) {
    return <div className="p-6"><LoadingSpinner /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Subject Students</h1>
          <p className="text-sm text-gray-500">View attendance and marks for your assigned subjects.</p>
        </div>
        <div className="text-sm text-gray-500 font-medium bg-white px-3 py-1.5 rounded shadow-sm border border-gray-200">
          Date: {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="card p-4 flex flex-col md:flex-row items-end gap-4">
        <div className="flex-1 w-full">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Subject</label>
          <select 
            className="input-field w-full"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
          >
            <option value="">-- Select Subject --</option>
            {professor?.assignedSubjects?.map(subj => {
              const id = typeof subj === 'object' ? subj._id : subj;
              const name = typeof subj === 'object' ? `${subj.name} (${subj.code})` : subj;
              return (
                <option key={id} value={id}>
                  {name}
                </option>
              );
            })}
          </select>
        </div>
        <button 
          onClick={handleLoadStudents}
          className="btn-primary whitespace-nowrap w-full md:w-auto"
          disabled={loadingStudents || !selectedSubjectId}
        >
          {loadingStudents ? 'Loading...' : 'Load Students'}
        </button>
      </div>

      {students.length > 0 && (
        <>
          {/* Summary Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-sm text-gray-500 font-medium">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500 font-medium">Below 75% Subj. Att.</p>
              <p className="text-2xl font-bold text-orange-600">{below75SubjectAtt}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500 font-medium">Below 75% Overall Att.</p>
              <p className="text-2xl font-bold text-red-600">{below75OverallAtt}</p>
            </div>
            <div className="card p-4">
              <p className="text-sm text-gray-500 font-medium">Average CGPA</p>
              <p className="text-2xl font-bold text-blue-600">{avgCgpa}</p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <h2 className="text-lg font-medium text-gray-900">Student Roster</h2>
              <div className="relative w-full sm:w-64">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search name or enrollment..."
                  className="input-field pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="table-header">#</th>
                    <th scope="col" className="table-header">Enrollment</th>
                    <th scope="col" className="table-header">Name</th>
                    <th scope="col" className="table-header">Sec</th>
                    <th scope="col" className="table-header text-center">Subject Att %</th>
                    <th scope="col" className="table-header text-center">Overall Att %</th>
                    <th scope="col" className="table-header text-center">CGPA</th>
                    <th scope="col" className="table-header text-center">SGPA</th>
                    <th scope="col" className="table-header text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, index) => (
                      <React.Fragment key={student._id || index}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="table-cell whitespace-nowrap text-gray-500">{index + 1}</td>
                          <td className="table-cell whitespace-nowrap font-medium text-gray-900">{student.enrollmentNumber}</td>
                          <td className="table-cell whitespace-nowrap">
                            <div className="text-gray-900 font-medium">{student.fullName}</div>
                            <div className="text-gray-500 text-xs">{student.email}</div>
                          </td>
                          <td className="table-cell whitespace-nowrap text-gray-500">{student.section || '-'}</td>
                          <td className="table-cell whitespace-nowrap text-center">
                            {student.subjectAttendance?.percentage != null ? (
                              <span className={`badge ${getAttendanceBadgeClass(student.subjectAttendance.percentage)}`}>
                                {student.subjectAttendance.percentage.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="badge badge-gray">No data</span>
                            )}
                          </td>
                          <td className="table-cell whitespace-nowrap text-center">
                            {student.overallAttendance?.percentage != null ? (
                              <span className={`badge ${getAttendanceBadgeClass(student.overallAttendance.percentage)}`}>
                                {student.overallAttendance.percentage.toFixed(1)}%
                              </span>
                            ) : (
                              <span className="badge badge-gray">No data</span>
                            )}
                          </td>
                          <td className="table-cell whitespace-nowrap text-center">
                            {student.cgpa != null ? (
                              <span className={`badge ${getCgpaBadgeClass(student.cgpa)}`}>
                                {student.cgpa.toFixed(2)}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="table-cell whitespace-nowrap text-center text-gray-500">
                            {student.lastSemSGPA != null ? student.lastSemSGPA.toFixed(2) : '-'}
                          </td>
                          <td className="table-cell whitespace-nowrap text-center">
                            <button
                              onClick={() => toggleRowExpand(student._id)}
                              className="text-gray-500 hover:text-gray-700 focus:outline-none p-1.5 rounded-md hover:bg-gray-200 transition-colors"
                              title={expandedRows[student._id] ? "Collapse details" : "Expand details"}
                            >
                              {expandedRows[student._id] ? (
                                <ChevronDownIcon className="h-5 w-5" />
                              ) : (
                                <ChevronRightIcon className="h-5 w-5" />
                              )}
                            </button>
                          </td>
                        </tr>
                        
                        {/* Expanded Row Content */}
                        {expandedRows[student._id] && (
                          <tr>
                            <td colSpan="9" className="p-0 border-b border-gray-200 bg-gray-50">
                              <div className="p-4 border-l-4 border-indigo-500">
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                  
                                  {/* Attendance Details Column */}
                                  <div className="lg:col-span-1 space-y-4">
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Attendance Detail</h3>
                                    
                                    <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
                                      <h4 className="text-xs font-semibold text-gray-500 mb-2">Subject Attendance</h4>
                                      {student.subjectAttendance ? (
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div><span className="text-gray-500">Total:</span> {student.subjectAttendance.total}</div>
                                          <div><span className="text-gray-500">Present:</span> <span className="text-green-600 font-medium">{student.subjectAttendance.present}</span></div>
                                          <div><span className="text-gray-500">Absent:</span> <span className="text-red-600 font-medium">{student.subjectAttendance.absent}</span></div>
                                          <div><span className="text-gray-500">%:</span> {student.subjectAttendance.percentage != null ? `${student.subjectAttendance.percentage.toFixed(1)}%` : '-'}</div>
                                        </div>
                                      ) : (
                                        <div className="text-sm text-gray-500 italic">No data available</div>
                                      )}
                                    </div>
                                    
                                    <div className="bg-white p-3 rounded-md shadow-sm border border-gray-200">
                                      <h4 className="text-xs font-semibold text-gray-500 mb-2">Overall Attendance</h4>
                                      {student.overallAttendance ? (
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                          <div><span className="text-gray-500">Total:</span> {student.overallAttendance.total}</div>
                                          <div><span className="text-gray-500">Present:</span> <span className="text-green-600 font-medium">{student.overallAttendance.present}</span></div>
                                          <div><span className="text-gray-500">Absent:</span> <span className="text-red-600 font-medium">{student.overallAttendance.absent}</span></div>
                                          <div><span className="text-gray-500">%:</span> {student.overallAttendance.percentage != null ? `${student.overallAttendance.percentage.toFixed(1)}%` : '-'}</div>
                                        </div>
                                      ) : (
                                        <div className="text-sm text-gray-500 italic">No data available</div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Marks Details Column */}
                                  <div className="lg:col-span-2">
                                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">All Marks</h3>
                                    
                                    {!student.marksGroups || student.marksGroups.length === 0 ? (
                                      <div className="bg-white p-6 rounded-md shadow-sm border border-gray-200 text-sm text-gray-500 text-center italic">
                                        No marks recorded yet for this student.
                                      </div>
                                    ) : (
                                      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                                        <div className="overflow-x-auto">
                                          <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                                              <tr>
                                                <th className="px-4 py-2.5 text-left font-medium">Subject</th>
                                                <th className="px-4 py-2.5 text-left font-medium">Exam Type</th>
                                                <th className="px-4 py-2.5 text-right font-medium">Obtained</th>
                                                <th className="px-4 py-2.5 text-right font-medium">Max</th>
                                                <th className="px-4 py-2.5 text-right font-medium">%</th>
                                              </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200 text-sm">
                                              {student.marksGroups.map((group, gIdx) => (
                                                group.marks?.map((mark, mIdx) => (
                                                  <tr key={`${gIdx}-${mIdx}`} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2.5 text-gray-900 font-medium">
                                                      {mIdx === 0 ? (
                                                        <span title={group.subjectName}>{group.subjectCode || group.subjectName}</span>
                                                      ) : null}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-gray-600">
                                                      {EXAM_LABEL[mark.examType] || mark.examType}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right font-semibold text-gray-900">
                                                      {mark.obtainedMarks}
                                                    </td>
                                                    <td className="px-4 py-2.5 text-right text-gray-500">
                                                      {mark.maximumMarks}
                                                    </td>
                                                    <td className={`px-4 py-2.5 text-right ${getMarksPercentClass(mark.percentage)}`}>
                                                      {mark.percentage != null ? `${mark.percentage.toFixed(1)}%` : '-'}
                                                    </td>
                                                  </tr>
                                                ))
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                  
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="p-8">
                        <EmptyState 
                          title="No students found" 
                          message={searchQuery ? `No students match "${searchQuery}"` : "No students in this batch"} 
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Empty State when no subject loaded and not loading */}
      {!loadingStudents && students.length === 0 && (
        <div className="card p-12 flex flex-col items-center justify-center">
          <EmptyState
            title="No Data"
            message="Select a subject and click 'Load Students' to view records."
          />
        </div>
      )}
    </div>
  );
};

export default ProfessorStudents;
