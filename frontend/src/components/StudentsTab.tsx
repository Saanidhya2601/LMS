import React from "react";

interface EnrolledStudent {
  id: string;
  created_at?: string;
  user: {
    full_name: string;
    email: string;
  };
}

interface StudentsTabProps {
  students: EnrolledStudent[];
  loadingStudents: boolean;
}

export default function StudentsTab({
  students,
  loadingStudents,
}: StudentsTabProps) {
  return (
    <div className="max-w-4xl animate-in fade-in duration-300">
      <h1 className="text-3xl font-bold mb-2 text-white">Enrolled Students</h1>
      <p className="text-slate-400 mb-8">
        View and manage the students taking this course.
      </p>

      <div className="bg-slate-900/50 border border-white/10 rounded-2xl overflow-hidden">
        {loadingStudents ? (
          <div className="p-10 text-center text-slate-500 animate-pulse">
            Loading student data...
          </div>
        ) : students.length === 0 ? (
          <div className="p-10 border-2 border-dashed border-white/10 rounded-2xl text-center text-slate-500 bg-slate-900/50 m-4">
            No students have enrolled in this course yet.
          </div>
        ) : (
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/80 text-xs uppercase font-semibold text-slate-400 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Student Name</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Enrollment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {students.map((enrollment) => (
                <tr
                  key={enrollment.id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-xs border border-indigo-500/30">
                      {enrollment.user.full_name.charAt(0).toUpperCase()}
                    </div>
                    {enrollment.user.full_name}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {enrollment.user.email}
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {enrollment.created_at
                      ? new Date(enrollment.created_at).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )
                      : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
