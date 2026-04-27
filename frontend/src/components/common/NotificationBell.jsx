import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoNotificationsOutline } from "react-icons/io5";
import {
  MdOutlineNotificationsNone,
  MdMenuBook,
  MdQuiz,
  MdCampaign,
  MdForum,
  MdGppBad,
  MdShield,
} from "react-icons/md";
import { FiCheck } from "react-icons/fi";

import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../services/operations/notificationAPI";

const POLLING_INTERVAL = 30000;

function getRelativeTime(dateString) {
  const notificationDate = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.max(Math.floor((now - notificationDate) / 1000), 0);

  if (diffInSeconds < 60) {
    return "Just now";
  }

  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} min${minutes > 1 ? "s" : ""} ago`;
  }

  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  }

  const days = Math.floor(diffInSeconds / 86400);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

function getNotificationMeta(type) {
  switch (type) {
    case "course":
      return {
        icon: <MdMenuBook className="text-lg text-yellow-50" />,
        chipClass: "bg-yellow-100/10 text-yellow-50 border-yellow-100/20",
        label: "Course",
      };
    case "test":
      return {
        icon: <MdQuiz className="text-lg text-pink-200" />,
        chipClass: "bg-pink-200/10 text-pink-100 border-pink-200/20",
        label: "Test",
      };
    case "post":
      return {
        icon: <MdForum className="text-lg text-caribbeangreen-200" />,
        chipClass: "bg-caribbeangreen-300/10 text-caribbeangreen-100 border-caribbeangreen-300/20",
        label: "Community",
      };
    case "report":
      return {
        icon: <MdGppBad className="text-lg text-rose-200" />,
        chipClass: "bg-rose-300/10 text-rose-100 border-rose-300/20",
        label: "Report",
      };
    case "moderation":
      return {
        icon: <MdShield className="text-lg text-orange-200" />,
        chipClass: "bg-orange-200/10 text-orange-100 border-orange-200/20",
        label: "Moderation",
      };
    default:
      return {
        icon: <MdCampaign className="text-lg text-blue-200" />,
        chipClass: "bg-blue-200/10 text-blue-100 border-blue-200/20",
        label: "General",
      };
  }
}

export default function NotificationBell({ token }) {
  const navigate = useNavigate();
  const wrapperRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const unreadNotifications = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  async function loadNotifications(showLoader = false) {
    if (!token) {
      return;
    }

    try {
      if (showLoader) {
        setLoading(true);
      }

      const data = await fetchNotifications(token);
      setNotifications(data?.data || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch (error) {
      console.error("FETCH NOTIFICATIONS ERROR:", error);
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadNotifications(true);

    const intervalId = setInterval(() => {
      loadNotifications(false);
    }, POLLING_INTERVAL);

    return () => clearInterval(intervalId);
  }, [token]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  async function handleNotificationClick(notification) {
    try {
      if (!notification.isRead) {
        await markNotificationAsRead(notification._id, token);
        setNotifications((currentNotifications) =>
          currentNotifications.map((item) =>
            item._id === notification._id ? { ...item, isRead: true } : item
          )
        );
        setUnreadCount((count) => Math.max(count - 1, 0));
      }
    } catch (error) {
      console.error("MARK NOTIFICATION READ ERROR:", error);
    } finally {
      setOpen(false);
      if (notification.link) {
        navigate(notification.link);
      }
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsAsRead(token);
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          isRead: true,
        }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error("MARK ALL NOTIFICATIONS READ ERROR:", error);
    }
  }

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((state) => !state)}
        className="relative rounded-full p-2 text-richblack-5 transition duration-200 hover:bg-richblack-700"
        aria-label="Open notifications"
      >
        <IoNotificationsOutline className="text-[1.9rem]" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-pink-200 px-1 text-[10px] font-bold text-richblack-900">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <div
        className={`absolute right-0 top-14 z-50 w-[340px] origin-top-right rounded-2xl border border-richblack-700 bg-richblack-800 shadow-[0_16px_40px_rgba(0,0,0,0.35)] transition-all duration-200 ${
          open
            ? "visible translate-y-0 opacity-100"
            : "invisible -translate-y-2 opacity-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-richblack-700 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-richblack-5">Notifications</p>
            <p className="text-xs text-richblack-300">
              {unreadNotifications} unread
            </p>
          </div>

          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadNotifications === 0}
            className="rounded-lg border border-richblack-600 px-3 py-1 text-xs font-medium text-yellow-50 transition hover:border-yellow-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Mark all read
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {loading ? (
            <div className="flex items-center justify-center py-10 text-sm text-richblack-300">
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <MdOutlineNotificationsNone className="text-4xl text-richblack-400" />
              <p className="text-sm font-medium text-richblack-100">No notifications yet</p>
              <p className="text-xs text-richblack-400">
                You&apos;ll see new updates from Sarthi here.
              </p>
            </div>
          ) : (
            notifications.map((notification) => {
              const meta = getNotificationMeta(notification.type);

              return (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`mb-2 flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition duration-200 hover:border-richblack-500 hover:bg-richblack-700/60 ${
                    notification.isRead
                      ? "border-richblack-700 bg-richblack-800"
                      : "border-yellow-100/20 bg-richblack-700/70"
                  }`}
                >
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-richblack-900">
                    {meta.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.chipClass}`}
                      >
                        {meta.label}
                      </span>
                      {!notification.isRead && (
                        <span className="h-2 w-2 rounded-full bg-caribbeangreen-300" />
                      )}
                    </div>

                    <p className="text-sm leading-5 text-richblack-5">
                      {notification.message}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-xs text-richblack-300">
                        {getRelativeTime(notification.createdAt)}
                      </span>

                      {!notification.isRead && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-caribbeangreen-200">
                          <FiCheck />
                          New
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
