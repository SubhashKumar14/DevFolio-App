const ROLE_DEFAULT_ROUTES = {
  developer: '/dashboard',
  recruiter: '/dashboard/recruiter',
  mentor: '/dashboard',
  admin: '/dashboard/admin',
};

export function getDefaultRouteForRole(role) {
  return ROLE_DEFAULT_ROUTES[role] || '/dashboard';
}
