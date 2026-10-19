import {
  AuditLogEntrySchema,
  BrigadeSchema,
  TenantSchema,
  UserSchema,
  paginated,
  type AuditLogQuery,
  type BrigadeCreateRequest,
  type TenantUpdateRequest,
  type UserCreateRequest,
  type UserListQuery,
  type UserUpdateRequest,
} from '@tigu/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '../../../shared/api/client';

const UserPageSchema = paginated(UserSchema);
const AuditPageSchema = paginated(AuditLogEntrySchema);

function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export const settingsKeys = {
  users: (query: UserListQuery) => ['users', query] as const,
  allUsers: ['users'] as const,
  brigades: ['brigades'] as const,
  tenant: ['tenant'] as const,
  audit: (query: AuditLogQuery) => ['audit-log', query] as const,
};

export function useUsers(query: UserListQuery) {
  return useQuery({
    queryKey: settingsKeys.users(query),
    queryFn: ({ signal }) =>
      api.get(`/users${toQuery({ ...query })}`, { schema: UserPageSchema, signal }),
    placeholderData: keepPreviousData,
  });
}

/** All users of one role (e.g. foremen for the brigade form). */
export function useUsersByRole(role: UserListQuery['role']) {
  return useUsers({ role, pageSize: 100 });
}

export function useCreateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: UserCreateRequest) => api.post('/users', body, { schema: UserSchema }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: settingsKeys.allUsers });
      void client.invalidateQueries({ queryKey: settingsKeys.brigades });
    },
  });
}

export function useUpdateUser() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UserUpdateRequest }) =>
      api.patch(`/users/${id}`, body, { schema: UserSchema }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: settingsKeys.allUsers });
      void client.invalidateQueries({ queryKey: settingsKeys.brigades });
    },
  });
}

export function useResetPin() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/users/${id}/reset-pin`, undefined, { schema: UserSchema }),
    onSuccess: () => void client.invalidateQueries({ queryKey: settingsKeys.allUsers }),
  });
}

export function useBrigades() {
  return useQuery({
    queryKey: settingsKeys.brigades,
    queryFn: ({ signal }) => api.get('/brigades', { schema: z.array(BrigadeSchema), signal }),
  });
}

export function useCreateBrigade() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: BrigadeCreateRequest) =>
      api.post('/brigades', body, { schema: BrigadeSchema }),
    onSuccess: () => void client.invalidateQueries({ queryKey: settingsKeys.brigades }),
  });
}

export function useTenant() {
  return useQuery({
    queryKey: settingsKeys.tenant,
    queryFn: ({ signal }) => api.get('/tenant', { schema: TenantSchema, signal }),
  });
}

export function useUpdateTenant() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: TenantUpdateRequest) => api.patch('/tenant', body, { schema: TenantSchema }),
    onSuccess: (tenant) => client.setQueryData(settingsKeys.tenant, tenant),
  });
}

export function useAuditLog(query: AuditLogQuery) {
  return useQuery({
    queryKey: settingsKeys.audit(query),
    queryFn: ({ signal }) =>
      api.get(`/audit-log${toQuery({ ...query })}`, { schema: AuditPageSchema, signal }),
    placeholderData: keepPreviousData,
  });
}
