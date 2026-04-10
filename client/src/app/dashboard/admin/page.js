"use client";

import DashboardLayout from "@/components/Layout/DashboardLayout";
import { useEffect, useState } from "react";
import { BookOpen, Users, FilePlus, Trash2 } from "lucide-react";
import { coursesAPI, userAPI } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminDashboard() {
  const router = useRouter();
  const [courses, setCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [semester, setSemester] = useState("Autumn");
  const [instructor, setInstructor] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const DEPARTMENTS = [
    "CSE",
    "Mech",
    "Electrical",
    "Data Science",
    "Mathematics and Computing",
    "AI",
    "Civil",
    "Humanities",
    "All"
  ];

  useEffect(() => {
    fetchCourses();
    fetchUsers();
  }, []);

  async function fetchCourses() {
    setLoading(true);
    try {
      const res = await coursesAPI.getMyCourses();
      setCourses(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch courses", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUsers() {
    try {
      const res = await userAPI.getAllUsers();
      const allUsers = res.data.data;
      const profs = allUsers.filter(u => u.role === "professor");
      setProfessors(profs);
      if (profs.length > 0) {
        setInstructor(profs[0]._id);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    }
  }

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!instructor) {
      alert("Please select an instructor");
      return;
    }
    setSubmitting(true);
    try {
      await coursesAPI.createCourse({ courseId, title, description, department, semester, instructor });
      alert("Course created successfully!");
      setShowCreateForm(false);
      setCourseId("");
      setTitle("");
      setDescription("");
      fetchCourses();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to create course");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCourse = async (e, id, courseName) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to completely delete "${courseName}"? This action cannot be undone.`)) {
      try {
        await coursesAPI.deleteCourse(id);
        alert("Course deleted successfully!");
        fetchCourses();
      } catch (error) {
        console.error(error);
        alert(error.response?.data?.message || "Failed to delete course");
      }
    }
  };

  return (
    <DashboardLayout requiredRole="admin">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage global platform courses and assignments.</p>
        </div>
        <button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2"
        >
          <FilePlus className="w-4 h-4" />
          {showCreateForm ? 'Cancel Creation' : 'Create Course'}
        </button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-8 mb-8 relative overflow-hidden flex flex-col">
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-600"></div>
          <h2 className="text-xl font-bold text-slate-800 mb-6">Create New Course</h2>
          <form onSubmit={handleCreateCourse} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Course Code</label>
                <input 
                  type="text" 
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="e.g. CS101"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Course Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                  placeholder="e.g. Data Structures"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  <option value="Autumn">Autumn</option>
                  <option value="Spring">Spring</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  {DEPARTMENTS.map(dep => <option key={dep} value={dep}>{dep}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instructor</label>
                <select
                  value={instructor}
                  onChange={(e) => setInstructor(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                >
                  {professors.map(prof => (
                    <option key={prof._id} value={prof._id}>
                      {prof.name} ({prof.collegeId})
                    </option>
                  ))}
                  {professors.length === 0 && <option value="" disabled>No professors found</option>}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" 
                rows="3"
                required
              ></textarea>
            </div>
            <div className="flex justify-end pt-2">
              <button 
                type="submit" 
                disabled={submitting || professors.length === 0}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
              >
                {submitting ? 'Creating...' : 'Publish Course'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">{courses.length}</h3>
            <p className="text-sm text-slate-500 font-medium">All Platform Courses</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-800">{professors.length}</h3>
            <p className="text-sm text-slate-500 font-medium">Registered Instructors</p>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-slate-800 mb-4">All Managed Courses</h2>
      {loading ? (
        <div className="flex justify-center my-12"><div className="w-8 h-8 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div></div>
      ) : courses.length === 0 ? (
        <div className="bg-white p-8 rounded-xl text-center border shadow-sm mb-10 text-slate-500">
          No courses have been created yet on the platform.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {courses.map((c) => (
             <div key={c._id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group h-full flex flex-col relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-bold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md">{c.courseId}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 bg-green-50 text-green-700 rounded-md whitespace-nowrap">{c.semester}</span>
                    <span className="text-xs font-medium px-2 py-1 bg-slate-50 text-slate-600 rounded-md whitespace-nowrap">{c.department}</span>
                    <button 
                      onClick={(e) => handleDeleteCourse(e, c.courseId, c.title)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Course"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{c.title}</h3>
                
                <div className="mt-2 text-sm text-slate-600 mb-4 flex-grow">
                  <p><strong>Prof:</strong> {c.instructor?.name || "Unknown"} ({c.instructor?.collegeId || "N/A"})</p>
                </div>
                
                <div className="flex items-center justify-between text-slate-500 text-sm mt-auto pt-4 border-t border-slate-50">
                   <div className="flex items-center gap-2">
                     <Users className="w-4 h-4" />
                     <span>{c.students?.length || 0} Students</span>
                   </div>
                </div>
             </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
