import { apiConnector } from "../apiConnector";
import { notificationEndpoints } from "../apis";

const {
  GET_NOTIFICATIONS_API,
  MARK_NOTIFICATION_READ_API,
  MARK_ALL_NOTIFICATIONS_READ_API,
} = notificationEndpoints;

const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export async function fetchNotifications(token) {
  const response = await apiConnector(
    "GET",
    GET_NOTIFICATIONS_API,
    null,
    getAuthHeaders(token)
  );

  return response.data;
}

export async function markNotificationAsRead(notificationId, token) {
  const response = await apiConnector(
    "PATCH",
    `${MARK_NOTIFICATION_READ_API}/${notificationId}/read`,
    {},
    getAuthHeaders(token)
  );

  return response.data;
}

export async function markAllNotificationsAsRead(token) {
  const response = await apiConnector(
    "PATCH",
    MARK_ALL_NOTIFICATIONS_READ_API,
    {},
    getAuthHeaders(token)
  );

  return response.data;
}
