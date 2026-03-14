import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login:    (payload: { email?: string; regNo?: string; password: string }) => api.post('/auth/login', payload),
  register: (data: any)   => api.post('/auth/register', data),
  verify:   ()            => api.get('/auth/verify'),
  logout:   ()            => api.post('/auth/logout'),
};

export const examAPI = {
  getAll:        ()                          => api.get('/exams'),
  getPublished:  ()                          => api.get('/exams?published=true'),
  getById:       (id: string)                => api.get(`/exams/${id}`),
  create:        (data: any)                 => api.post('/exams', data),
  update:        (id: string, data: any)     => api.put(`/exams/${id}`, data),
  delete:        (id: string)                => api.delete(`/exams/${id}`),
  publish:       (id: string)                => api.put(`/exams/${id}/publish`, {}),
  unpublish:     (id: string)                => api.put(`/exams/${id}/unpublish`, {}),
  addSection:    (id: string, data: any)     => api.post(`/exams/${id}/sections`, data),
  updateSection: (id: string, secId: string, data: any) => api.put(`/exams/${id}/sections/${secId}`, data),
  deleteSection: (id: string, secId: string) => api.delete(`/exams/${id}/sections/${secId}`),
};

export const questionAPI = {
  getByExamAndSection: (examId: string, sectionId: string) =>
    api.get(`/questions/exam/${examId}/section/${sectionId}`),
  getByExam: (examId: string) => api.get(`/questions/exam/${examId}`),

  // Create single question — multipart/form-data so image can be attached
  create: (data: any, imageFile?: File | null) => {
    const form = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null)
        form.append(k, typeof v === 'object' && !Array.isArray(v) ? JSON.stringify(v) : String(typeof v === 'object' ? JSON.stringify(v) : v));
    });
    if (imageFile) form.append('image', imageFile);
    return api.post('/questions', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },

  // Bulk upload from Excel
  bulkUpload: (file: File, examId: string, sectionId: string) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/questions/bulk-upload?examId=${examId}&sectionId=${sectionId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Image URL for a question
  imageUrl: (id: string) => `${api.defaults.baseURL}/questions/${id}/image`,

  update: (id: string, data: any) => api.put(`/questions/${id}`, data),
  delete: (id: string)            => api.delete(`/questions/${id}`),
};

export const attemptAPI = {
  getStudentResults: (studentId: string)       => api.get(`/attempts/student/${studentId}`),
  getById:           (id: string)              => api.get(`/attempts/${id}`),
  getReview:         (id: string)              => api.get(`/attempts/${id}/review`),
  // How many completed attempts does the current student have for an exam?
  getAttemptCount:   (examId: string)          => api.get(`/attempts/count?examId=${examId}`),
  create:            (data: any)               => api.post('/attempts', data),
  update:            (id: string, data: any)   => api.put(`/attempts/${id}`, data),
  submit:            (id: string)              => api.post(`/attempts/${id}/submit`),
  getExamStats:      (examId: string)          => api.get(`/attempts/exam/${examId}/stats`),
};

export const resultsAPI = {
  getAdminResults: (params: { collegeId?: string; course?: string; branch?: string; examId?: string }) =>
    api.get('/attempts/admin/results', { params }),
  deleteResult: (attemptId: string) => api.delete(`/attempts/${attemptId}`),
};

export const userAPI = {
  getAll:              ()                                    => api.get('/users'),
  getByCollege:        (collegeId: string)                   => api.get(`/users/college/${collegeId}`),
  create:              (data: any)                           => api.post('/users', data),
  update:              (id: string, data: any)               => api.put(`/users/${id}`, data),
  delete:              (id: string)                          => api.delete(`/users/${id}`),
  getAllColleges:       ()                                    => api.get('/users/colleges/all'),
  getCoursesBranches:  ()                                    => api.get('/users/students/courses-branches'),
  createCollege:       (data: any)                           => api.post('/users/colleges', data),
  deleteCollege:       (id: string)                          => api.delete(`/users/colleges/${id}`),
  toggleCollegeAccess: (id: string, isAccessGranted: boolean) => api.patch(`/users/colleges/${id}/access`, { isAccessGranted }),
  getCollegeStats:     (id: string)                          => api.get(`/users/stats/${id}`),
  bulkUploadStudents:  (file: File, collegeId: string)       => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/users/students/bulk-upload?collegeId=${collegeId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const materialAPI = {
  getAll:   (type?: 'pdf' | 'ppt') => api.get('/materials', { params: type ? { type } : {} }),
  getById:  (id: string)           => api.get(`/materials/${id}`),
  upload:   (data: any)            => api.post('/materials', data),
  update:   (id: string, data: any) => api.put(`/materials/${id}`, data),
  delete:   (id: string)           => api.delete(`/materials/${id}`),
};

export default api;

export const mediaCategoryAPI = {
  getAll:  (params?: { active?: boolean }) => api.get('/media-categories', { params }),
  getById: (id: string) => api.get(`/media-categories/${id}`),
  create:  (data: { name: string; description?: string }) => api.post('/media-categories', data),
  update:  (id: string, data: any) => api.put(`/media-categories/${id}`, data),
  delete:  (id: string) => api.delete(`/media-categories/${id}`),
};

export const mediaGalleryAPI = {
  getAll:   (params?: { active?: boolean; type?: string; categoryId?: string }) =>
    api.get('/media-gallery', { params }),
  getById:  (id: string) => api.get(`/media-gallery/${id}`),
  mediaUrl: (id: string) => `${api.defaults.baseURL}/media-gallery/${id}/media`,
  // Upload multiple files to a category at once
  bulkCreate: (
    files: File[],
    meta: { categoryId: string; description?: string },
    onProgress?: (pct: number) => void
  ) => {
    const form = new FormData();
    files.forEach(f => form.append('files', f));
    form.append('categoryId',   meta.categoryId);
    form.append('description',  meta.description || '');
    return api.post('/media-gallery/bulk', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    });
  },
  update: (id: string, data: any) => api.put(`/media-gallery/${id}`, data),
  delete: (id: string) => api.delete(`/media-gallery/${id}`),
};

export const magazineAPI = {
  getAll:   (params?: { active?: boolean }) => api.get('/magazines', { params }),
  fileUrl:  (id: string) => `${api.defaults.baseURL}/magazines/${id}/file`,
  create: (file: File, meta: { title: string; description?: string; edition?: string; order?: number; category?: string; accessColleges?: string[]; accessCourses?: string[]; accessBranches?: string[] }) => {
    const form = new FormData();
    form.append('file',           file);
    form.append('title',          meta.title);
    form.append('description',    meta.description || '');
    form.append('edition',        meta.edition || '');
    form.append('order',          String(meta.order ?? 0));
    form.append('category',       meta.category || '');
    form.append('accessColleges', JSON.stringify(meta.accessColleges || []));
    form.append('accessCourses',  JSON.stringify(meta.accessCourses  || []));
    form.append('accessBranches', JSON.stringify(meta.accessBranches || []));
    return api.post('/magazines', form, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  update: (id: string, data: any) => api.put(`/magazines/${id}`, data),
  delete: (id: string) => api.delete(`/magazines/${id}`),
};

export const adAPI = {
  getAll:  (params?: { active?: boolean; type?: 'image' | 'video' }) =>
    api.get('/ads', { params }),

  getById: (id: string) => api.get(`/ads/${id}`),

  // mediaUrl — build the streaming URL for an ad's file
  mediaUrl: (id: string) => `${api.defaults.baseURL}/ads/${id}/media`,

  // create — send as multipart/form-data so the backend can use multer disk storage.
  // This bypasses MongoDB's 16 MB document limit that broke large video uploads.
  create: (file: File, meta: { title: string; description?: string; order?: number; displayMinutes?: number }) => {
    const form = new FormData();
    form.append('file',           file);
    form.append('title',          meta.title);
    form.append('description',    meta.description || '');
    form.append('order',          String(meta.order ?? 0));
    form.append('displayMinutes', String(meta.displayMinutes ?? 30));
    return api.post('/ads', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  update: (id: string, data: any) => api.put(`/ads/${id}`, data),
  delete: (id: string) => api.delete(`/ads/${id}`),
};
