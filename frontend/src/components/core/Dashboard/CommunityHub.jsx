import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { FiFlag, FiHeart, FiMessageSquare, FiRefreshCw, FiTrash2 } from "react-icons/fi";

import { ACCOUNT_TYPE } from "../../../utils/constants";
import { formatDate } from "../../../services/formatDate";
import {
  createCommunityPost,
  createPostComment,
  deleteCommunityPost,
  fetchCommunityPosts,
  reportCommunityPost,
  togglePostLike,
} from "../../../services/operations/postAPI";

function getFullName(user = {}) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ");
}

export default function CommunityHub() {
  const { token } = useSelector((state) => state.auth);
  const { user } = useSelector((state) => state.profile);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postForm, setPostForm] = useState({
    title: "",
    topic: "",
    content: "",
  });
  const [commentInputs, setCommentInputs] = useState({});
  const [reportInputs, setReportInputs] = useState({});
  const canCreatePosts =
    user?.accountType === ACCOUNT_TYPE.STUDENT || user?.accountType === ACCOUNT_TYPE.INSTRUCTOR;

  async function loadPosts() {
    if (!token) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetchCommunityPosts(token);
      setPosts(response?.posts || []);
    } catch (error) {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, [token]);

  function updateSinglePost(updatedPost) {
    setPosts((currentPosts) =>
      currentPosts.map((post) => (post._id === updatedPost._id ? updatedPost : post))
    );
  }

  async function handleCreatePost(event) {
    event.preventDefault();

    const response = await createCommunityPost(postForm, token);
    if (!response?.post) {
      return;
    }

    setPosts((currentPosts) => [response.post, ...currentPosts]);
    setPostForm({
      title: "",
      topic: "",
      content: "",
    });
  }

  async function handleLike(postId) {
    const response = await togglePostLike(postId, token);
    if (response?.post) {
      updateSinglePost(response.post);
    }
  }

  async function handleComment(postId) {
    const text = commentInputs[postId]?.trim();
    if (!text) {
      return;
    }

    const response = await createPostComment(postId, text, token);
    if (!response?.comment) {
      return;
    }

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post._id === postId
          ? { ...post, comments: [...(post.comments || []), response.comment] }
          : post
      )
    );
    setCommentInputs((currentInputs) => ({ ...currentInputs, [postId]: "" }));
  }

  async function handleReport(postId) {
    const reason = reportInputs[postId]?.trim();
    if (!reason) {
      return;
    }

    const response = await reportCommunityPost(postId, reason, token);
    if (response?.success) {
      setReportInputs((currentInputs) => ({ ...currentInputs, [postId]: "" }));
    }
  }

  async function handleDelete(postId) {
    const confirmed = window.confirm("Delete this post?");
    if (!confirmed) {
      return;
    }

    const response = await deleteCommunityPost(postId, token);
    if (response?.success) {
      setPosts((currentPosts) => currentPosts.filter((post) => post._id !== postId));
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 text-richblack-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Tech Community</h1>
        <p className="text-sm text-richblack-300">
          Students and instructors can share tech topics, discuss ideas, and help keep the
          space healthy by reporting abusive content.
        </p>
      </div>

      <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Start a discussion</h2>
            <p className="text-sm text-richblack-300">
              Notifications go out to all users when a new post is published.
            </p>
          </div>
          <button
            type="button"
            onClick={loadPosts}
            className="inline-flex items-center gap-2 rounded-lg border border-richblack-600 px-4 py-2 text-sm text-yellow-50 transition hover:border-yellow-50"
          >
            <FiRefreshCw />
            Refresh
          </button>
        </div>

        {canCreatePosts ? (
          <form onSubmit={handleCreatePost} className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <input
                type="text"
                value={postForm.title}
                onChange={(event) =>
                  setPostForm((currentForm) => ({ ...currentForm, title: event.target.value }))
                }
                placeholder="Post title"
                className="rounded-xl border border-richblack-600 bg-richblack-900 px-4 py-3 text-sm outline-none transition focus:border-yellow-50"
              />
              <input
                type="text"
                value={postForm.topic}
                onChange={(event) =>
                  setPostForm((currentForm) => ({ ...currentForm, topic: event.target.value }))
                }
                placeholder="Topic, for example React or AI"
                className="rounded-xl border border-richblack-600 bg-richblack-900 px-4 py-3 text-sm outline-none transition focus:border-yellow-50"
              />
            </div>

            <textarea
              rows="5"
              value={postForm.content}
              onChange={(event) =>
                setPostForm((currentForm) => ({ ...currentForm, content: event.target.value }))
              }
              placeholder="Share your question, tip, bug, project update, or learning note..."
              className="rounded-xl border border-richblack-600 bg-richblack-900 px-4 py-3 text-sm outline-none transition focus:border-yellow-50"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-yellow-50 px-5 py-3 text-sm font-semibold text-richblack-900 transition hover:scale-[1.02]"
              >
                Publish post
              </button>
            </div>
          </form>
        ) : (
          <p className="rounded-xl border border-richblack-700 bg-richblack-900 px-4 py-3 text-sm text-richblack-300">
            Admins can review reports here, but only students and instructors can create posts.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-5">
        {loading ? (
          <div className="rounded-2xl border border-richblack-700 bg-richblack-800 p-6 text-sm text-richblack-300">
            Loading community posts...
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-richblack-700 bg-richblack-800 p-8 text-center text-richblack-300">
            No posts yet. Start the first tech discussion.
          </div>
        ) : (
          posts.map((post) => {
            const isLiked = (post.likes || []).some((likeId) => likeId === user?._id || likeId?._id === user?._id);
            const canDelete = post.author?._id === user?._id || user?.accountType === ACCOUNT_TYPE.ADMIN;

            return (
              <div key={post._id} className="rounded-2xl border border-richblack-700 bg-richblack-800 p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {post.topic && (
                          <span className="rounded-full border border-yellow-100/20 bg-yellow-100/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-yellow-50">
                            {post.topic}
                          </span>
                        )}
                        <span className="text-xs text-richblack-400">{formatDate(post.createdAt)}</span>
                      </div>
                      <h3 className="text-xl font-semibold">{post.title}</h3>
                      <p className="mt-1 text-sm text-richblack-300">
                        By {getFullName(post.author)} • {post.author?.accountType}
                      </p>
                    </div>

                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(post._id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-rose-400/20 px-4 py-2 text-sm text-rose-200 transition hover:border-rose-300"
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    )}
                  </div>

                  <p className="whitespace-pre-wrap text-sm leading-6 text-richblack-100">
                    {post.content}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 border-y border-richblack-700 py-3 text-sm">
                    <button
                      type="button"
                      onClick={() => handleLike(post._id)}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 transition ${
                        isLiked
                          ? "bg-pink-200/10 text-pink-100"
                          : "bg-richblack-900 text-richblack-200 hover:bg-richblack-700"
                      }`}
                    >
                      <FiHeart />
                      {post.likes?.length || 0} Likes
                    </button>
                    <span className="inline-flex items-center gap-2 rounded-lg bg-richblack-900 px-3 py-2 text-richblack-200">
                      <FiMessageSquare />
                      {post.comments?.length || 0} Comments
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    {(post.comments || []).map((comment) => (
                      <div key={comment._id} className="rounded-xl bg-richblack-900 px-4 py-3">
                        <p className="text-sm font-semibold text-richblack-25">
                          {getFullName(comment.user)}
                        </p>
                        <p className="mt-1 text-sm text-richblack-300">{comment.text}</p>
                      </div>
                    ))}

                    <div className="flex flex-col gap-3 md:flex-row">
                      <input
                        type="text"
                        value={commentInputs[post._id] || ""}
                        onChange={(event) =>
                          setCommentInputs((currentInputs) => ({
                            ...currentInputs,
                            [post._id]: event.target.value,
                          }))
                        }
                        placeholder="Write a comment"
                        className="flex-1 rounded-xl border border-richblack-600 bg-richblack-900 px-4 py-3 text-sm outline-none transition focus:border-yellow-50"
                      />
                      <button
                        type="button"
                        onClick={() => handleComment(post._id)}
                        className="rounded-xl bg-caribbeangreen-300 px-5 py-3 text-sm font-semibold text-richblack-900"
                      >
                        Comment
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-richblack-700 bg-richblack-900 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm font-medium text-richblack-200">
                      <FiFlag />
                      Report abusive or unsafe content
                    </div>
                    <div className="flex flex-col gap-3 md:flex-row">
                      <textarea
                        rows="2"
                        value={reportInputs[post._id] || ""}
                        onChange={(event) =>
                          setReportInputs((currentInputs) => ({
                            ...currentInputs,
                            [post._id]: event.target.value,
                          }))
                        }
                        placeholder="Explain what is wrong with this post"
                        className="flex-1 rounded-xl border border-richblack-600 bg-richblack-800 px-4 py-3 text-sm outline-none transition focus:border-yellow-50"
                      />
                      <button
                        type="button"
                        onClick={() => handleReport(post._id)}
                        className="rounded-xl border border-rose-300/30 px-5 py-3 text-sm font-semibold text-rose-100"
                      >
                        Report
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
