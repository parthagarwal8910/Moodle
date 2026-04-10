"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/Layout/DashboardLayout";
import { userAPI } from "@/lib/api";
import IdentitySettings from "@/components/Dashboard/Profile/IdentitySettings";
import AcademicTranscript from "@/components/Dashboard/Profile/AcademicTranscript";
import { UserCircle, BookOpen, User } from "lucide-react";

export default function ProfileHub() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("identity"); // 'identity', 'transcript'

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const res = await userAPI.getMe();
      setUser(res.data.data);
      // Synchronize with local storage as well
      localStorage.setItem("user", JSON.stringify(res.data.data));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="">
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="w-10 h-10 border-4 border-t-[#2d2a26] border-[#e6e2d8] rounded-full animate-spin"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  return (
    <DashboardLayout requiredRole="">
      <div className="max-w-[1600px] mx-auto min-h-[calc(100vh-4rem)] bg-[#fcfaf7]">

        {/* Header Block */}
        <div className="mb-8 p-8 bg-white rounded-xl border border-[#e6e2d8] shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-start bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] relative overflow-hidden">
          <div className="w-24 h-24 bg-[#fcfbf9] rounded-2xl border border-[#e6e2d8] flex items-center justify-center shrink-0 z-10 shadow-sm">
            <UserCircle className="w-14 h-14 text-[#a99c85]" />
          </div>

          <div className="text-center md:text-left z-10 flex-grow">
            <h1 className="text-3xl font-serif font-bold text-[#2d2a26] leading-tight">
              {user.name}
            </h1>
            <p className="text-[#736d65] mt-1 font-medium tracking-wide">
              {user.collegeId} • {user.department} Department
            </p>
            <div className="mt-3 flex gap-2 justify-center md:justify-start">
              <span className="text-xs font-bold px-3 py-1 bg-[#2d2a26] text-white rounded-full capitalize">{user.role}</span>
              {user.isCR && (
                <span className="text-xs font-bold px-3 py-1 bg-[#8b9d83] text-white rounded-full">Class Representative</span>
              )}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-[#e6e2d8] pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab("identity")}
            className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "identity"
                ? "text-[#2d2a26] border-b-2 border-[#2d2a26]"
                : "text-[#a99c85] hover:text-[#2d2a26]"
              }`}
          >
            <User className="w-4 h-4" /> Identity
          </button>

          <button
            onClick={() => setActiveTab("transcript")}
            className={`px-6 py-2.5 text-sm font-bold uppercase tracking-wider transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "transcript"
                ? "text-[#2d2a26] border-b-2 border-[#2d2a26]"
                : "text-[#a99c85] hover:text-[#2d2a26]"
              }`}
          >
            <BookOpen className="w-4 h-4" /> Transcript
          </button>
        </div>

        {/* Tab Content */}
        <div className="mb-12">
          {activeTab === "identity" && <IdentitySettings user={user} setUser={setUser} />}
          {activeTab === "transcript" && <AcademicTranscript user={user} />}
        </div>

      </div>
    </DashboardLayout>
  );
}
