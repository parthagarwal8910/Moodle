import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: async (collegeId, password) => {
    return api.post('/auth/login', { collegeId, password });
  },
  register: async (name, collegeId, email, password, role) => {
    return api.post('/auth/register', { name, collegeId, email, password, role });
  },
  verifyOTP: async (email, otp) => {
    return api.post('/auth/verify-otp', { email, otp });
  }
};

export const coursesAPI = {
  getMyCourses: async () => {
    return api.get('/courses/my');
  },
  getCourse: async (id) => {
    return api.get(`/courses/${id}`);
  },
  searchStudents: async (id, query) => {
    return api.get(`/courses/${id}/students/search?q=${query}`);
  },
  globalSearch: async (query) => {
    return api.get(`/courses/global/search?q=${encodeURIComponent(query)}`);
  },
  createCourse: async (courseData) => {
    return api.post('/courses', courseData);
  },
  getAllCourses: async () => {
    return api.get('/courses');
  },
  enrollInCourse: async (id) => {
    return api.post(`/courses/${id}/enroll`);
  },
  deleteCourse: async (id) => {
    return api.delete(`/courses/${id}`);
  }
};

export const assignmentsAPI = {
  getAssignments: async (courseId) => {
    return api.get(`/courses/${courseId}/lessons`);
  },
  createAssignment: async (courseId, formData) => {
    return api.post(`/courses/${courseId}/lessons`, formData);
  },
  submitAssignment: async (courseId, formData) => {
    return api.post(`/courses/${courseId}/submissions`, formData);
  },
  getSubmissions: async (courseId) => {
    return api.get(`/courses/${courseId}/submissions`);
  }
};

export const userAPI = {
  getAllUsers: async () => {
    return api.get('/users');
  },
  getMe: async () => {
    return api.get('/users/me');
  },
  updateProfile: async (profileData) => {
    return api.put('/users/me', profileData);
  },
  updatePassword: async (oldPassword, newPassword) => {
    return api.put('/users/me/password', { oldPassword, newPassword });
  },
  getTranscript: async () => {
    return api.get('/users/me/transcript');
  }
};

export default api;
