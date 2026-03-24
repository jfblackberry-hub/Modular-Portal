export const DEMO_ACCESS_COOKIE = 'modular_portal_demo_access';

export const demoUsers = [
  { id: 'anorth', username: 'Anorth', password: 'Anorth123' },
  { id: 'cgallagher', username: 'Cgallagher', password: 'Cgallagher123' },
  { id: 'mshuster', username: 'Mshuster', password: 'Mshuster123' },
  { id: 'jfrank', username: 'Jfrank', password: 'Jfrank123' }
] as const;

export type DemoUserId = (typeof demoUsers)[number]['id'];

export function findDemoUser(username: string) {
  const normalizedUsername = username.trim().toLowerCase();

  return demoUsers.find((user) => user.id === normalizedUsername);
}

export function validateDemoCredentials(username: string, password: string) {
  const matchedUser = findDemoUser(username);

  if (!matchedUser) {
    return null;
  }

  const acceptedPasswords = new Set([
    matchedUser.password,
    `${matchedUser.id}123`
  ]);

  if (!acceptedPasswords.has(password.trim())) {
    return null;
  }

  return matchedUser;
}
