import { toast } from "react-hot-toast";
import { apiConnector } from "../apiConnector";
import { postEndpoints } from "../apis";

const {
  GET_ALL_POSTS_API,
  CREATE_POST_API,
  LIKE_POST_API,
  COMMENT_POST_API,
  DELETE_POST_API,
  REPORT_POST_API,
  GET_POST_REPORTS_API,
  UPDATE_POST_REPORT_STATUS_API,
} = postEndpoints;

const getAuthHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
});

export async function fetchCommunityPosts(token) {
  const response = await apiConnector("GET", GET_ALL_POSTS_API, null, getAuthHeaders(token));
  return response.data;
}

export async function createCommunityPost(payload, token) {
  const toastId = toast.loading("Posting...");

  try {
    const response = await apiConnector("POST", CREATE_POST_API, payload, getAuthHeaders(token));
    toast.success("Post created");
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Could not create post");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
}

export async function togglePostLike(postId, token) {
  try {
    const response = await apiConnector("POST", LIKE_POST_API, { postId }, getAuthHeaders(token));
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Could not update like");
    return null;
  }
}

export async function createPostComment(postId, text, token) {
  try {
    const response = await apiConnector(
      "POST",
      COMMENT_POST_API,
      { postId, text },
      getAuthHeaders(token)
    );
    toast.success("Comment added");
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Could not add comment");
    return null;
  }
}

export async function deleteCommunityPost(postId, token) {
  const toastId = toast.loading("Deleting...");

  try {
    const response = await apiConnector(
      "POST",
      DELETE_POST_API,
      { postId },
      getAuthHeaders(token)
    );
    toast.success(response.data?.message || "Post deleted");
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Could not delete post");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
}

export async function reportCommunityPost(postId, reason, token) {
  const toastId = toast.loading("Submitting report...");

  try {
    const response = await apiConnector(
      "POST",
      REPORT_POST_API,
      { postId, reason },
      getAuthHeaders(token)
    );
    toast.success(response.data?.message || "Reported to admin");
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Could not report post");
    return null;
  } finally {
    toast.dismiss(toastId);
  }
}

export async function fetchPostReports(token) {
  const response = await apiConnector("GET", GET_POST_REPORTS_API, null, getAuthHeaders(token));
  return response.data;
}

export async function updatePostReportStatus(reportId, status, token, adminNote = "") {
  try {
    const response = await apiConnector(
      "PATCH",
      `${UPDATE_POST_REPORT_STATUS_API}/${reportId}/status`,
      { status, adminNote },
      getAuthHeaders(token)
    );
    toast.success(response.data?.message || "Report updated");
    return response.data;
  } catch (error) {
    toast.error(error.response?.data?.message || "Could not update report");
    return null;
  }
}
