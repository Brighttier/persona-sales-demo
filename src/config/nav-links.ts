
import type { UserRole } from '@/config/roles';
import { USER_ROLES } from '@/config/roles';
import { LayoutDashboard, Briefcase, Users, CalendarDays, UserCircle, Settings, Building, CreditCard, BotMessageSquare, ShieldCheck, BarChart3, CheckSquare, UserCheck, Search, FileText, BarChartHorizontalBig } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: UserRole[];
  subLinks?: NavLink[];
  isTourStep?: boolean;
  tourStepId?: string; // This should be unique across all tourable elements
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
    tourStepId: 'candidate-dashboard-link',
    tourText: "Welcome! This is your personalized dashboard. Get an overview of your job search, upcoming interviews, and profile status."
  },
  {
    href: `/dashboard/${USER_ROLES.CANDIDATE}/applications`,
    label: 'My Applications',
    icon: Briefcase,
    roles: [USER_ROLES.CANDIDATE],
    isTourStep: true,
    tourStepId: 'candidate-applications-link',
    tourText: 'Track all your job applications and their statuses here. Stay updated on your progress with each company.'
  },
  {
    href: `/dashboard/${USER_ROLES.CANDIDATE}/interviews`,
    label: 'My Interviews',
    icon: CalendarDays,
    roles: [USER_ROLES.CANDIDATE],
    isTourStep: true,
    tourStepId: 'candidate-interviews-link',
    tourText: 'Manage your scheduled interviews, view details, and see records of past interviews.'
  },
  {
    href: `/dashboard/${USER_ROLES.CANDIDATE}/ai-interview`,
    label: 'AI Interview Simulation',
    icon: BotMessageSquare,
    roles: [USER_ROLES.CANDIDATE],
    isTourStep: true,
    tourStepId: 'candidate-ai-interview-link',
    tourText: 'Engage in a real interview with our conversational AI. Record your responses and get instant, insightful feedback to improve your skills.'
  },
  {
    href: `/dashboard/${USER_ROLES.CANDIDATE}/profile`,
    label: 'My Profile',
    icon: UserCircle,
    roles: [USER_ROLES.CANDIDATE],
    isTourStep: true,
    tourStepId: 'candidate-profile-link',
    tourText: 'Keep your profile up-to-date. Manage your personal information, skills, experience, education, and upload your latest resume.'
  },

  // Recruiter Links
  {
    href: `/dashboard/${USER_ROLES.RECRUITER}/dashboard`,
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [USER_ROLES.RECRUITER],
    isTourStep: true,
    tourStepId: 'recruiter-dashboard-link',
    tourText: "Recruiter central! View key metrics, recent activities, and manage your hiring pipeline efficiently."
  },
  {
    href: `/dashboard/${USER_ROLES.RECRUITER}/job-listings`,
    label: 'Job Listings',
    icon: Briefcase,
    roles: [USER_ROLES.RECRUITER],
    isTourStep: true,
    tourStepId: 'recruiter-job-listings-link',
    tourText: 'Manage all your job postings. Create new listings, edit existing ones, view applicants, and track status.'
  },
  {
    href: `/dashboard/${USER_ROLES.RECRUITER}/candidate-pool`,
    label: 'Candidate Pool',
    icon: Search, // Changed from Users for better differentiation
    roles: [USER_ROLES.RECRUITER],
    isTourStep: true,
    tourStepId: 'recruiter-candidate-pool-link',
    tourText: 'Discover talent! Browse and filter through the candidate pool to find the perfect match for your open roles.'
  },
   {
    href: `/dashboard/${USER_ROLES.RECRUITER}/screening`,
    label: 'AI Screening',
    icon: ShieldCheck,
    roles: [USER_ROLES.RECRUITER],
    isTourStep: true,
    tourStepId: 'recruiter-screening-link',
    tourText: 'Leverage AI to screen candidates quickly. Input job and candidate details for an instant analysis.'
  },

  // Hiring Manager Links
  {
    href: `/dashboard/${USER_ROLES.HIRING_MANAGER}/dashboard`,
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [USER_ROLES.HIRING_MANAGER],
    isTourStep: true,
    tourStepId: 'hm-dashboard-link',
    tourText: "Hiring Manager's hub. Get an overview of your team's hiring activities, open positions, and key metrics."
  },
  {
    href: `/dashboard/${USER_ROLES.HIRING_MANAGER}/job-approvals`,
    label: 'Job Approvals',
    icon: CheckSquare, // Changed from Briefcase
    roles: [USER_ROLES.HIRING_MANAGER],
    isTourStep: true,
    tourStepId: 'hm-job-approvals-link',
    tourText: 'Review job postings submitted by recruiters. Approve or reject them to keep the hiring process moving.'
  },
  {
    href: `/dashboard/${USER_ROLES.HIRING_MANAGER}/interviews`,
    label: 'Team Interviews',
    icon: CalendarDays,
    roles: [USER_ROLES.HIRING_MANAGER],
    isTourStep: true,
    tourStepId: 'hm-interviews-link',
    tourText: "Oversee your team's interview schedule. View upcoming interviews and provide timely feedback on candidates."
  },
  {
    href: `/dashboard/${USER_ROLES.HIRING_MANAGER}/analytics`,
    label: 'Hiring Analytics',
    icon: BarChart3, // More specific for analytics
    roles: [USER_ROLES.HIRING_MANAGER],
    isTourStep: true,
    tourStepId: 'hm-analytics-link',
    tourText: 'Dive into data! View analytics on hiring funnels, time-to-hire, offer acceptance rates, and more.'
  },

  // Admin Links
  {
    href: `/dashboard/${USER_ROLES.ADMIN}/dashboard`,
    label: 'Dashboard',
    icon: LayoutDashboard,
    roles: [USER_ROLES.ADMIN],
    isTourStep: true,
    tourStepId: 'admin-dashboard-link',
    tourText: 'System administrator overview. Monitor platform-wide metrics, user statistics, and system health.'
  },
  {
    href: `/dashboard/${USER_ROLES.ADMIN}/user-management`,
    label: 'User Management',
    icon: Users,
    roles: [USER_ROLES.ADMIN],
    isTourStep: true,
    tourStepId: 'admin-user-management-link',
    tourText: 'Manage all user accounts on the platform. Add, edit, change roles, or deactivate users.'
  },
  {
    href: `/dashboard/${USER_ROLES.ADMIN}/company-management`,
    label: 'Company Management',
    icon: Building,
    roles: [USER_ROLES.ADMIN],
    isTourStep: true,
    tourStepId: 'admin-company-management-link',
    tourText: 'Manage company profiles (if your platform supports multiple client companies or departments as separate entities).'
  },
  {
    href: `/dashboard/${USER_ROLES.ADMIN}/billing`,
    label: 'Billing & Subscriptions',
    icon: CreditCard,
    roles: [USER_ROLES.ADMIN],
    isTourStep: true,
    tourStepId: 'admin-billing-link',
    tourText: 'Oversee all billing information, manage subscription plans, and view revenue metrics.'
  },
  {
    href: `/dashboard/${USER_ROLES.ADMIN}/reports`,
    label: 'Reports & Analytics',
    icon: BarChartHorizontalBig, 
    roles: [USER_ROLES.ADMIN],
    isTourStep: true,
    tourStepId: 'admin-reports-link',
    tourText: 'Generate and view various system-wide reports and analytics, from user activity to financial summaries.'
  },
  {
    href: `/dashboard/${USER_ROLES.ADMIN}/settings`,
    label: 'System Settings',
    icon: Settings,
    roles: [USER_ROLES.ADMIN],
    isTourStep: true,
    tourStepId: 'admin-settings-link',
    tourText: 'Configure global settings for the application, including general preferences, notifications, security, and integrations.'
  },
];

export const getNavLinksForRole = (role: UserRole | null): NavLink[] => {
  if (!role) return [];
  return NAV_LINKS.filter(link => link.roles.includes(role));
};

export const getTourStepsForRole = (role: UserRole | null): NavLink[] => {
  if (!role) return [];
  // Filter for links that are explicitly marked as tour steps and belong to the current user's role.
  return NAV_LINKS.filter(link => link.isTourStep && link.roles.includes(role) && link.tourStepId);
}

    