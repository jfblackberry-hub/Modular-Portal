export type CurrentUser = {
  id: string;
  tenantId: string;
  email: string;
  roles: string[];
  permissions: string[];
};

export type GatewayJwtClaims = {
  sub: string;
  email: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
  iss: string;
};

export type AuthenticatedRequestContext = {
  currentUser: CurrentUser;
  tenantId: string;
  token: GatewayJwtClaims;
};

declare module 'fastify' {
  interface FastifyRequest {
    gatewayAuth?: AuthenticatedRequestContext;
  }
}
