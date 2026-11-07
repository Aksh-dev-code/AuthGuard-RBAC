import {
  BookOpen,
  CalendarCheck,
  GraduationCap,
  KeyRound,
  LayoutDashboard,
  MessageSquareText,
  School,
  ShieldCheck,
  Users,
} from "lucide-react";

// anyOf: the link shows if the user holds ANY of these permissions (null = everyone).
export const NAV_LINKS = [
  { to: "/", label: "Home", icon: LayoutDashboard, anyOf: null },
  { to: "/classes", label: "Classes", icon: School, anyOf: ["classes:READ", "classes:READ_ASSIGNED", "classes:READ_OWN"] },
  { to: "/attendance", label: "Attendance", icon: CalendarCheck, anyOf: ["attendance:READ", "attendance:READ_ASSIGNED", "attendance:READ_OWN"] },
  { to: "/questions", label: "Questions", icon: MessageSquareText, anyOf: ["questions:READ", "questions:READ_ASSIGNED", "questions:READ_OWN_CLASS"] },
  { to: "/subjects", label: "Subjects", icon: BookOpen, anyOf: ["subjects:UPDATE"] },
  { to: "/enrollment", label: "Enrollment", icon: GraduationCap, anyOf: ["enrollment:READ"] },
  { to: "/users", label: "Users", icon: Users, anyOf: ["users:READ"] },
  { to: "/roles", label: "Roles", icon: ShieldCheck, anyOf: ["roles:READ"] },
  { to: "/permissions", label: "Permissions", icon: KeyRound, anyOf: ["permissions:READ"] },
];

export const visibleLinks = (hasAnyPermission) =>
  NAV_LINKS.filter((l) => !l.anyOf || hasAnyPermission(l.anyOf));