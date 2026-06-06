import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the browser set multipart boundary (required for crewSubRole, teamName, files)
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }
  return config;
});

export const authApi = {
  register: (formData) => api.post("/api/auth/register", formData),
  login: (data) => api.post("/api/auth/login", data),
  me: () => api.get("/api/auth/me"),
  updateProfile: (formData) => api.patch("/api/auth/profile", formData),
  forgotPassword: (data) => api.post("/api/auth/forgot-password", data),
  validateResetToken: (token) =>
    api.get("/api/auth/reset-password/validate", { params: { token } }),
  resetPassword: (data) => api.post("/api/auth/reset-password", data),
  registerIdPreview: (params) => api.get("/api/auth/register-id-preview", { params }),
  adminEnrollTeam: (data) => api.post("/api/auth/admin-enroll-team", data),
};

export const notificationsApi = {
  list: () => api.get("/api/notifications"),
  unreadCount: () => api.get("/api/notifications/unread-count"),
  markRead: () => api.post("/api/notifications/mark-read"),
};

export const reportsApi = {
  list: () => api.get("/api/reports"),
  get: (id) => api.get(`/api/reports/${id}`),
  create: (formData) => api.post("/api/reports", formData),
  update: (id, formData) => api.patch(`/api/reports/${id}`, formData),
  updateStatus: (id, status) => api.patch(`/api/reports/${id}/status`, { status }),
  remove: (id) => api.delete(`/api/reports/${id}`),
};

export const teamsApi = {
  registerOptions: () => api.get("/api/teams/register-options"),
  overview: () => api.get("/api/teams/overview"),
  enroll: (data) => api.post("/api/teams/enroll", data),
  assignmentTable: (reportId) =>
    api.get("/api/teams/assignment-table", { params: reportId ? { reportId } : {} }),
  members: (teamName) => api.get(`/api/teams/${encodeURIComponent(teamName)}/members`),
  crewUser: (userId) => api.get(`/api/teams/crew-user/${userId}`),
  assign: (reportId, teamName) =>
    api.post(`/api/teams/reports/${reportId}/assign`, { teamName }),
  pendingApprovals: (filter = "pending") =>
    api.get("/api/teams/pending-approvals", { params: { filter } }),
  setApproval: (reportId, approval) =>
    api.patch(`/api/teams/reports/${reportId}/approval`, { approval }),
  updateUpdatedTaskReportImage: (reportId, formData) =>
    api.patch(`/api/teams/reports/${reportId}/updated-task-image`, formData),
  locations: () => api.get("/api/teams/locations"),
  updateLocation: (id, data) => api.patch(`/api/teams/locations/${id}`, data),
};

export const crewApi = {
  reports: () => api.get("/api/crew/reports"),
  getReport: (id) => api.get(`/api/crew/reports/${id}`),
  myTeam: () => api.get("/api/crew/team"),
  vehicles: () => api.get("/api/crew/vehicles"),
  setReportTransport: (id, data) => api.patch(`/api/crew/reports/${id}/transport`, data),
  setDisposal: (id, active) => api.patch(`/api/crew/reports/${id}/disposal`, { active }),
  submitUpdatedTask: (id, formData) =>
    api.post(`/api/crew/reports/${id}/updated-task`, formData),
  unsubmitUpdatedTask: (id) =>
    api.post(`/api/crew/reports/${id}/updated-task/unsubmit`),
};

export const statisticsApi = {
  heatmap: (params) => api.get("/api/statistics/heatmap", { params }),
};

export const contactApi = {
  submit: (data) => api.post("/api/contact", data),
  mine: () => api.get("/api/contact/mine"),
  adminList: () => api.get("/api/contact/admin"),
  adminReply: (id, data) => api.patch(`/api/contact/admin/${id}/reply`, data),
};

export const chatApi = {
  list: () => api.get("/api/chat"),
  send: (formData) => api.post("/api/chat", formData),
  like: (id) => api.post(`/api/chat/${id}/like`),
};

export const leadershipChatApi = {
  list: () => api.get("/api/leadership-chat"),
  send: (formData) => api.post("/api/leadership-chat", formData),
  like: (id) => api.post(`/api/leadership-chat/${id}/like`),
};

export const teamChatApi = {
  list: () => api.get("/api/team-chat"),
  send: (formData) => api.post("/api/team-chat", formData),
  like: (id) => api.post(`/api/team-chat/${id}/like`),
};

export const feedbackApi = {
  list: () => api.get("/api/feedback"),
  submit: (id, formData) => api.post(`/api/feedback/${id}`, formData),
  update: (id, formData) => api.patch(`/api/feedback/${id}`, formData),
  remove: (id) => api.delete(`/api/feedback/${id}`),
};

export const communityFeedApi = {
  list: () => api.get("/api/community-feed"),
  getThread: (reportId) => api.get(`/api/community-feed/${reportId}/thread`),
  getComments: (reportId) => api.get(`/api/community-feed/${reportId}/comments`),
  sendReply: (reportId, formData) =>
    api.post(`/api/community-feed/${reportId}/comments`, formData),
  likeReview: (reportId) => api.post(`/api/community-feed/${reportId}/review/like`),
  likeComment: (commentId) => api.post(`/api/community-feed/comments/${commentId}/like`),
};

export const adminApi = {
  listResidentActivities: () => api.get("/api/admin/resident-activities"),
  setResidentBlocked: (userId, blocked) =>
    api.patch(`/api/admin/residents/${userId}/block`, { blocked }),
};
