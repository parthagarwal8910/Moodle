"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Book, CheckSquare, LayoutDashboard, Users, UserCheck, Calendar, User as UserIcon } from "lucide-react";

export default function Sidebar({ role }) {
  const pathname = usePathname();

  // Define links based on role
  const links = {
    professor: [
      { name: "Dashboard", href: "/dashboard/professor", icon: LayoutDashboard },
      { name: "Class Schedule", href: "/dashboard/schedule", icon: Calendar },
      { name: "Profile", href: "/dashboard/profile", icon: UserIcon }
    ],
    student: [
      { name: "Dashboard", href: "/dashboard/student", icon: LayoutDashboard },
      { name: "My Courses", href: "/dashboard/student/courses", icon: Book },
      { name: "Class Schedule", href: "/dashboard/schedule", icon: Calendar },
      { name: "Profile", href: "/dashboard/profile", icon: UserIcon }
    ],
    ta: [
      { name: "Dashboard", href: "/dashboard/ta", icon: LayoutDashboard },
      { name: "Courses", href: "/dashboard/ta/courses", icon: Book },
      { name: "Submissions", href: "/dashboard/ta/submissions", icon: CheckSquare },
      { name: "Class Schedule", href: "/dashboard/schedule", icon: Calendar },
      { name: "Profile", href: "/dashboard/profile", icon: UserIcon }
    ],
    admin: [
      { name: "Dashboard", href: "/dashboard/admin", icon: LayoutDashboard },
      { name: "Profile", href: "/dashboard/profile", icon: UserIcon }
    ],
  };

  const currentLinks = links[role] || links["student"];

  return (
    <aside className="w-64 bg-white border-r h-screen hidden md:block sticky top-0">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          EduDash
        </h1>
        <p className="text-xs text-slate-500 uppercase mt-1 tracking-wider">{role} Portal</p>
      </div>
      <nav className="mt-6">
        <ul>
          {currentLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <li key={link.name} className="px-4 mb-2">
                <Link
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700 font-medium"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-indigo-600" : "text-slate-400"}`} />
                  {link.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
