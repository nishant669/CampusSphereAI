import React, { useState, useEffect } from 'react';
import { getMe } from '../../services/professorService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { UserCircleIcon, BookOpenIcon, IdentificationIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function ProfessorProfile() {
  const [professor, setProfessor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getMe();
      setProfessor(res.data.data);
    } catch (err) {
      toast.error('Failed to load professor profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner message="Loading profile..." />;
  if (!professor) {
    return (
      <div className="card text-center py-16 text-gray-500">
        <UserCircleIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <p>Profile information not found.</p>
      </div>
    );
  }

  const getInitials = (name) =>
    name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'PR';

  const assignedSubjects = professor.assignedSubjects || [];

  const InfoItem = ({ label, value, icon: Icon }) => (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-start gap-3">
      {Icon && <Icon className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />}
      <div>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{label}</p>
        <p className="font-semibold text-gray-800 text-sm mt-0.5">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Profile Card */}
      <div className="card bg-gradient-to-br from-white to-emerald-50/30 border border-emerald-100">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-24 h-24 rounded-2xl bg-emerald-700 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-emerald-200 shrink-0">
            {getInitials(professor.fullName)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-black text-gray-900">{professor.fullName}</h2>
              <span className="badge badge-green text-xs font-bold">✓ Active Faculty</span>
            </div>
            <p className="text-emerald-700 font-mono font-bold text-sm mt-1">
              Employee ID: {professor.employeeId}
            </p>
            <p className="text-gray-500 text-xs mt-0.5">
              Department of {professor.department} · {professor.course || 'B.Tech'} Faculty
            </p>
          </div>
        </div>
      </div>

      {/* Basic Contact & Department Details */}
      <div className="card">
        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <IdentificationIcon className="w-5 h-5 text-emerald-600" />
          Faculty Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoItem label="Full Name" value={professor.fullName} />
          <InfoItem label="Employee / Professor ID" value={professor.employeeId} />
          <InfoItem label="Official Email" value={professor.email} />
          <InfoItem label="Contact Phone" value={professor.phone || 'Not provided'} />
          <InfoItem label="Department" value={professor.department} icon={BuildingOffice2Icon} />
          <InfoItem label="Assigned Course" value={professor.course || 'B.Tech'} />
        </div>
      </div>

      {/* Assigned Subjects */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <BookOpenIcon className="w-5 h-5 text-emerald-600" />
            Assigned Teaching Subjects ({assignedSubjects.length})
          </h3>
          <span className="text-xs text-gray-400">Assigned by Director / HOD</span>
        </div>

        {assignedSubjects.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No subjects currently assigned to your account.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assignedSubjects.map((sub) => (
              <div
                key={sub._id}
                className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 flex items-center justify-between"
              >
                <div>
                  <span className="text-xs font-mono font-bold text-emerald-700 px-2 py-0.5 rounded bg-emerald-100/80">
                    {sub.subjectCode}
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm mt-1">{sub.subjectName}</h4>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Semester {sub.semester} · {sub.branch} · {sub.course || 'B.Tech'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
