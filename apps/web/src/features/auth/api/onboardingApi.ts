import type { ModelCreateRequest, UserQuickCreateRequest } from '@tigu/shared';
import { api } from '../../../shared/api/client';

// Registration step 3. These move to features/tech-cards and features/settings
// once those modules are built (stages 2–3).
export const onboardingApi = {
  createModel: (body: ModelCreateRequest) => api.post<{ id: string }>('/models', body),
  importModels: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<{ imported: number }>('/models/import', form);
  },
  createUser: (body: UserQuickCreateRequest) => api.post<{ id: string }>('/users', body),
};
