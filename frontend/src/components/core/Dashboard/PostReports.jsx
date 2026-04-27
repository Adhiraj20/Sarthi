import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiTrash2, FiXCircle } from "react-icons/fi";

import { formatDate } from "../../../services/formatDate";
import {
  deleteCommunityPost,
  fetchPostReports,
  updatePostReportStatus,
} from "../../../services/operations/postAPI";

function getFullName(user = {}) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ");
}

export default function PostReports() {
  const { token } = useSelector((state) => state.auth);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadReports() {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetchPostReports(token);
      setReports(response?.reports || []);
    } catch (error) {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [token]);

  async function handleStatusUpdate(reportId, status) {
    const response = await updatePostReportStatus(reportId, status, token);
    if (!response?.report) {
      return;
    }

    setReports((currentReports) =>
      currentReports.map((report) => (report._id === reportId ? response.report : report))
    );
  }

  async function handleDeletePost(report) {
    const postId = report.post?._id;
    if (!postId) {
      return;
    }

    const confirmed = window.confirm("Delete this reported post?");
    if (!confirmed) {
      return;
    }

    const response = await deleteCommunityPost(postId, token);
    if (!response?.success) {
      return;
    }

    setReports((currentReports) =>
      currentReports.map((currentReport) =>
        currentReport.post?._id === postId
          ? {
              ...currentReport,
              post: null,
              status: "resolved",
              adminNote: "Post removed by admin",
            }
          : currentReport
      )
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 text-richblack-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Post Reports</h1>
          <p className="mt-2 text-sm text-richblack-300">
            Review reports from the community and remove abusive posts when necessary.
          </p>
        </div>

        <button
          type="button"
          onClick={loadReports}
          className="inline-flex items-center gap-2 rounded-lg border border-richblack-600 px-4 py-2 text-sm text-yellow-50 transition hover:border-yellow-50"
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-6 text-sm text-richblack-300">
          Loading reports...
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-richblack-700 bg-richblack-800 p-8 text-center text-richblack-300">
          No reports have been submitted.
        </div>
      ) : (
        reports.map((report) => {
          const postTitle = report.post?.title || report.postSnapshot?.title || "Removed post";
          const postTopic = report.post?.topic || report.postSnapshot?.topic;
          const postContent = report.post?.content || report.postSnapshot?.content;
          const authorName = report.post?.author ? getFullName(report.post.author) : "Unknown author";

          return (
            <div key={report._id} className="rounded-2xl border border-richblack-700 bg-richblack-800 p-6">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-rose-300/30 bg-rose-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-100">
                      {report.status}
                    </span>
                    <span className="text-xs text-richblack-400">{formatDate(report.createdAt)}</span>
                    {postTopic && (
                      <span className="rounded-full border border-yellow-100/20 bg-yellow-100/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-50">
                        {postTopic}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold">{postTitle}</h2>
                  <p className="mt-1 text-sm text-richblack-300">
                    Reported by {getFullName(report.reportedBy)} against {authorName}
                  </p>
                </div>

                <div className="rounded-xl bg-richblack-900 px-4 py-3 text-sm text-richblack-300">
                  <p className="font-medium text-richblack-100">Reason</p>
                  <p className="mt-1">{report.reason}</p>
                </div>
              </div>

              <div className="rounded-xl border border-richblack-700 bg-richblack-900 p-4">
                <p className="mb-2 text-sm font-medium text-richblack-100">Post content</p>
                <p className="whitespace-pre-wrap text-sm leading-6 text-richblack-300">{postContent}</p>
              </div>

              {report.adminNote && (
                <div className="mt-4 rounded-xl border border-caribbeangreen-300/20 bg-caribbeangreen-300/10 p-4 text-sm text-caribbeangreen-100">
                  {report.adminNote}
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleStatusUpdate(report._id, "reviewed")}
                  className="inline-flex items-center gap-2 rounded-xl border border-yellow-100/20 px-4 py-3 text-sm font-semibold text-yellow-50"
                >
                  <FiAlertTriangle />
                  Mark reviewed
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusUpdate(report._id, "dismissed")}
                  className="inline-flex items-center gap-2 rounded-xl border border-richblack-500 px-4 py-3 text-sm font-semibold text-richblack-50"
                >
                  <FiXCircle />
                  Dismiss report
                </button>

                <button
                  type="button"
                  onClick={() => handleStatusUpdate(report._id, "resolved")}
                  className="inline-flex items-center gap-2 rounded-xl border border-caribbeangreen-300/20 px-4 py-3 text-sm font-semibold text-caribbeangreen-200"
                >
                  <FiCheckCircle />
                  Resolve
                </button>

                {report.post?._id && (
                  <button
                    type="button"
                    onClick={() => handleDeletePost(report)}
                    className="inline-flex items-center gap-2 rounded-xl border border-rose-300/30 px-4 py-3 text-sm font-semibold text-rose-100"
                  >
                    <FiTrash2 />
                    Delete post
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
