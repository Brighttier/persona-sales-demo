
export const USER_ROLES = {
  CANDIDATE: 'candidate',
  RECRUITER: 'recruiter',
  HIRING_MANAGER: 'hiring-manager',
  ADMIN: 'admin',
  INTERVIEWER: 'interviewer', // New role
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// Demo users
export const DEMO_USERS: Record<UserRole, User> = {
  [USER_ROLES.CANDIDATE]: {
    id: 'candidate1',
    name: 'Alex Johnson',
    email: 'alex.johnson@example.com',
    role: USER_ROLES.CANDIDATE,
    avatar: 'https://placehold.co/100x100.png',
  },
  [USER_ROLES.RECRUITER]: {
    id: 'recruiter1',
    name: 'Brenda Smith',
    email: 'brenda.smith@example.com',
    role: USER_ROLES.RECRUITER,
    avatar: 'https://placehold.co/100x100.png',
  },
  [USER_ROLES.HIRING_MANAGER]: {
    id: 'manager1',
    name: 'Charles Brown',
    email: 'charles.brown@example.com',
    role: USER_ROLES.HIRING_MANAGER,
    avatar: 'https://placehold.co/100x100.png',
  },
  [USER_ROLES.ADMIN]: {
    id: 'admin1',
    name: 'Diana Green',
    email: 'diana.green@example.com',
    role: USER_ROLES.ADMIN,
    avatar: 'https://placehold.co/100x100.png',
  },
  [USER_ROLES.INTERVIEWER]: { // New demo interviewer
    id: 'interviewer1',
    name: 'Ian Reviewer',
    email: 'ian.reviewer@example.com',
    role: USER_ROLES.INTERVIEWER,
    avatar: 'https://placehold.co/100x100.png',
  },
};
