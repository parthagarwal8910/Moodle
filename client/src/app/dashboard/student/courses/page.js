"use client";

import DashboardLayout from "@/components/Layout/DashboardLayout";
import { BookMarked, Calendar, ArrowRight, PlusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { coursesAPI } from "@/lib/api";
import Link from "next/link";

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState({ department: "Unknown" });

  // Enrollment feedback state map: { [courseId]: 'loading' | 'success' | 'error' }
  const [enrollStatus, setEnrollStatus] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(prev => ({ ...prev, ...JSON.parse(storedUser) }));
    }
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const resMy = await coursesAPI.getMyCourses();
      setCourses(resMy.data.data || []);

      const resAll = await coursesAPI.getAllCourses();
      setAllCourses(resAll.data.data || []);
    } catch (error) {
      console.error("Failed to fetch courses", error);
    } finally {
      setLoading(false);
    }
  }

  const handleEnroll = async (courseId) => {
    setEnrollStatus((prev) => ({ ...prev, [courseId]: 'loading' }));
    try {
      await coursesAPI.enrollInCourse(courseId);
      setEnrollStatus((prev) => ({ ...prev, [courseId]: 'success' }));
      // Refresh to update valid enrolled lists!
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to enroll");
      setEnrollStatus((prev) => ({ ...prev, [courseId]: 'error' }));
    }
  };

  // Determine which courses the student is *not* enrolled in
  // by keeping only those in allCourses that do not exist in the 'courses' state array
  const enrolledIds = courses.map((c) => c._id);
  const availableCourses = allCourses.filter((c) => {
    const isNotEnrolled = !enrolledIds.includes(c._id);
    const isRightDepartment = c.department === user.department || c.department === 'All';
    return isNotEnrolled && isRightDepartment;
  });

  const autumnCourses = availableCourses.filter(c => c.semester === "Autumn");
  const springCourses = availableCourses.filter(c => c.semester === "Spring");

  return (
    <DashboardLayout requiredRole="student">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Welcome Back!</h1>
          <p className="text-slate-500 mt-1">Here is a quick overview of your enrolled courses.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-12"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div></div>
      ) : (
        <>
          <h2 className="text-xl font-bold text-slate-800 mb-4">My Enrolled Courses</h2>
          {courses.length === 0 ? (
            <div className="bg-white p-8 rounded-xl text-center border shadow-sm mb-10 text-slate-500">
              You are not enrolled in any courses right now.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
              {courses.map((c) => (
                <Link key={c._id} href={`/dashboard/student/courses/${c.courseId}`} className="block">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-lg transition-shadow group relative overflow-hidden h-full flex flex-col cursor-pointer">
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-indigo-100 to-blue-50 bg-opacity-50 rounded-full blur-xl group-hover:bg-indigo-200 transition-colors"></div>
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <BookMarked className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold px-2 py-1 bg-slate-50 text-slate-600 rounded border border-slate-200">{c.courseId}</span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2 group-hover:text-indigo-600 transition-colors">{c.title}</h3>
                    <p className="text-slate-500 text-sm mb-6 flex-grow">{c.instructor?.name || 'Instructor'}</p>

                    <div className="mt-auto flex justify-between items-center bg-slate-50 rounded-xl p-3">
                      <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 group-hover:text-indigo-600 transition-colors">
                        Go to Course <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* AVAILABLE COURSES EXPLORER */}
          <h2 className="text-xl font-bold text-slate-800 mb-4 mt-12 border-t pt-8">Available Courses to Join</h2>
          {availableCourses.length === 0 ? (
            <div className="bg-white p-8 rounded-xl text-center border shadow-sm mb-10 text-slate-500">
              There are no new courses available for your department right now.
            </div>
          ) : (
            <div className="space-y-8 mb-10">
              {/* Autumn Semester */}
              {autumnCourses.length > 0 && (
                <div>
                   <h3 className="text-lg font-bold text-orange-700 bg-orange-50 px-4 py-2 rounded-lg mb-4 inline-block">🍁 Autumn Semester</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {autumnCourses.map((c) => (
                      <div key={c._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">{c.courseId}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2">{c.title}</h3>
                        <p className="text-slate-500 text-sm flex-grow line-clamp-2 mb-4">{c.description || "No description provided."}</p>
                        
                        <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                          <p className="text-xs font-medium text-slate-500">By {c.instructor?.name}</p>
                          <button 
                            onClick={() => handleEnroll(c.courseId)}
                            disabled={enrollStatus[c.courseId] === 'loading' || enrollStatus[c.courseId] === 'success'}
                            className="bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1"
                          >
                            {enrollStatus[c.courseId] === 'loading' ? 'Enrolling...' : 
                             enrollStatus[c.courseId] === 'success' ? 'Enrolled!' :
                             <><PlusCircle className="w-4 h-4"/> Enroll</>}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Spring Semester */}
              {springCourses.length > 0 && (
                <div className="mt-8 border-t pt-6">
                   <h3 className="text-lg font-bold text-green-700 bg-green-50 px-4 py-2 rounded-lg mb-4 inline-block">🌸 Spring Semester</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {springCourses.map((c) => (
                      <div key={c._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:shadow-md transition-shadow flex flex-col h-full">
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-xs font-bold px-2 py-1 bg-slate-100 text-slate-700 rounded border border-slate-200">{c.courseId}</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 leading-tight mb-2">{c.title}</h3>
                        <p className="text-slate-500 text-sm flex-grow line-clamp-2 mb-4">{c.description || "No description provided."}</p>
                        
                        <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                          <p className="text-xs font-medium text-slate-500">By {c.instructor?.name}</p>
                          <button 
                            onClick={() => handleEnroll(c.courseId)}
                            disabled={enrollStatus[c.courseId] === 'loading' || enrollStatus[c.courseId] === 'success'}
                            className="bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 text-sm font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1"
                          >
                            {enrollStatus[c.courseId] === 'loading' ? 'Enrolling...' : 
                             enrollStatus[c.courseId] === 'success' ? 'Enrolled!' :
                             <><PlusCircle className="w-4 h-4"/> Enroll</>}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  );
}
