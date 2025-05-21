import type { UserRole } from '@/config/roles';
import { USER_ROLES } from '@/config/roles';
import { LayoutDashboard, Briefcase, Users, CalendarDays, UserCircle, Settings, Building, CreditCard, BotMessageSquare, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  subLinks?: NavLink[];
  isTourStep?: boolean;
  tourStepId?: string;
  tourText?: string;
}

export const NAV_LINKS: NavLink[] = [
  // Candidate Links
  {
    href: `/dashboard/${USER_ROLES.CANDIDATE}/dashboard`,
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [USER_ROLES.CANDIDATE],
    isTourStep: true,
    tourStepId: 'candidate-dashboard',
    tourText: 'Welcome to your dashboard! Here you can see an overview of your job applications and interviews.'
  },
  {
    href: `/dashboard/${USER_ROLES.CANDIDATE}/applications`,
    label: 'My Applications',
    icon: Briefcase,
    roles: [USER_ROLES.CANDIDATE],
    isTourStep: true,
    tourStepId: 'candidate-applications',
    tourText: 'Track all your job applications and their statuses here.'
  },
  {
    href: `/dashboard/${USER_ROLES.CANDIDATE}/interviews`,
    label: 'My Interviews',
    icon: CalendarDays,
    roles: [USER_ROLES.CANDIDATE],
    isTourStep: true,
    tourStepId: 'candidate-interviews',
    tourText: 'Manage your scheduled interviews and view past interview details.'
  },
  {
    href: `/dashboard/${USER_ROLES.CANDIDATE}/ai-interview`,
    label: 'AI Interview Practice',
    icon: BotMessageSquare,
    roles: [USER_ROLES.CANDIDATE],
    isTourStep: true,
    tourStepId: 'candidate-ai-interview',
    tourText: 'Practice your interviewing skills with our AI-powered simulator.'
  },
  {
    href: `/dashboard/${USER_ROLES.CANDIDATE}/profile`,
    label: 'My Profile',
    icon: UserCircle,
    roles: [USER_ROLES.CANDIDATE],
    isTourStep: true,
    tourStepId: 'candidate-profile',
    tourText: 'Manage your personal information, skills, experience, and resume.'
  },

  // Recruiter Links
  {
    href: `/dashboard/${USER_ROLES.RECRUITER}/dashboard`,
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [USER_ROLES.RECRUITER],
    isTourStep: true,
    tourStepId: 'recruiter-dashboard',
    tourText: 'Recruiter dashboard with key metrics and recent activities.'
  },
  {
    href: `/dashboard/${USER_ROLES.RECRUITER}/job-listings`,
    label: 'Job Listings',
    icon: Briefcase,
    roles: [USER_ROLES.RECRUITER],
    isTourStep: true,
    tourStepId: 'recruiter-job-listings',
    tourText: 'Manage all job postings: create, edit, and review.'
  },
  {
    href: `/dashboard/${USER_ROLES.RECRUITER}/candidate-pool`,
    label: 'Candidate Pool',
    icon: Users,
    roles: [USER_ROLES.RECRUITER],
    isTourStep: true,
    tourStepId: 'recruiter-candidate-pool',
    tourText: 'Browse and filter potential candidates for your open roles.'
  },
  // Note: Candidate Screening might be part of job listings or candidate pool, not a separate nav usually.
  // For now, let's add it as per request.
   {
    href: `/dashboard/${USER_ROLES.RECRUITER}/screening`,
    label: 'AI Screening',
    icon: ShieldCheck,
    roles: [USER_ROLES.RECRUITER],
    isTourStep: true,
    tourStepId: 'recruiter-screening',
    tourText: 'Utilize AI tools to screen candidates efficiently.'
  },


  // Hiring Manager Links
  {
    href: `/dashboard/${USER_ROLES.HIRING_MANAGER}/dashboard`,
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [USER_ROLES.HIRING_MANAGER],
    isTourStep: true,
    tourStepId: 'hm-dashboard',
    tourText: 'Hiring Manager dashboard with team statistics and hiring progress.'
  },
  {
    href: `/dashboard/${USER_ROLES.HIRING_MANAGER}/job-approvals`, // Assuming job listings is for approvals
    label: 'Job Approvals',
    icon: Briefcase,
    roles: [USER_ROLES.HIRING_MANAGER],
    isTourStep: true,
    tourStepId: 'hm-job-approvals',
    tourText: 'Review and approve job postings created by recruiters.'
  },
  {
    href: `/dashboard/${USER_ROLES.HIRING_MANAGER}/interviews`,
    label: 'Interview Schedules',
    icon: CalendarDays,
    roles: [USER_ROLES.HIRING_MANAGER],
    isTourStep: true,
    tourStepId: 'hm-interviews',
    tourText: 'Manage interview schedules for your team and provide feedback.'
  },
  {
    href: `/dashboard/${USER_ROLES.HIRING_MANAGER}/analytics`,
    label: 'Hiring Analytics',
    icon: Users, // Placeholder, consider BarChart icon
    roles: [USER_ROLES.HIRING_MANAGER],
    isTourStep: true,
    tourStepId: 'hm-analytics',
    tourText: 'View analytics on hiring performance and team metrics.'
  },

  // Admin Links
  {
    href: `/dashboard/${USER_ROLES.ADMIN}/dashboard`,
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [USER_ROLES.ADMIN],
    isTourStep: true,
    tourStepId: 'admin-dashboard',
    tourText: 'Admin dashboard with system-wide metrics and user statistics.'
  },
  {
    href: `/dashboard/${USER_ROLES.ADMIN}/user-management`,
    label: 'User Management',
    icon: Users,
    roles: [USER_ROLES.ADMIN],
    isTourStep: true,
    tourStepId: 'admin-user-management',
    tourText: 'Manage all user accounts: add, edit, and deactivate.'
  },
  {
    href: `/dashboard/${USER_ROLES.ADMIN}/company-management`,
    label: 'Company Management',
    icon: Building,
    roles: [USER_ROLES.ADMIN],
    isTourStep: true,
    tourStepId: 'admin-company-management',
    tourText: 'Manage company profiles if supporting multi-company setup.'
  },
  {
    href: `/dashboard/${USER_ROLES.ADMIN}/billing`,
    label: 'Billing & Subscriptions',
    icon: CreditCard,
    roles: [USER_ROLES.ADMIN],
    isTourStep: true,
    tourStepId: 'admin-billing',
    tourText: 'Oversee billing information and subscription plans.'
  },
  {
    href: `/dashboard/${USER_ROLES.ADMIN}/settings`,
    label: 'System Settings',
    icon: Settings,
    roles: [USER_ROLES.ADMIN],
    isTourStep: true,
    tourStepId: 'admin-settings',
    tourText: 'Configure system-wide settings and preferences.'
  },
];

export const getNavLinksForRole = (role: UserRole | null): NavLink[] => {
  if (!role) return [];
  return NAV_LINKS.filter(link => link.roles.includes(role));
};

export const getTourStepsForRole = (role: UserRole | null): NavLink[] => {
  if (!role) return [];
  return NAV_LINKS.filter(link => link.roles.includes(role) && link.isTourStep);
}
