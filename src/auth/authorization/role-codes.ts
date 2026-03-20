export const ROLE_CODES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  SOCIO: 'socio',
  USER: 'user',
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];
