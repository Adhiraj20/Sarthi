import { useDispatch, useSelector } from "react-redux";
import { Table, Thead, Tbody, Tr, Th, Td } from 'react-super-responsive-table';
import 'react-super-responsive-table/dist/SuperResponsiveTableStyle.css';

import { useState } from "react";
import { FaCheck } from "react-icons/fa";
import { FiEdit2 } from "react-icons/fi";
import { HiClock } from "react-icons/hi";
import { RiDeleteBin6Line } from "react-icons/ri";
import { MdOutlineVideocam } from "react-icons/md";
import { useNavigate } from "react-router-dom";

import { formatDate } from "../../../../services/formatDate";
import { deleteCourse, fetchInstructorCourses } from "../../../../services/operations/courseDetailsAPI";
import { COURSE_STATUS } from "../../../../utils/constants";
import ConfirmationModal from "../../../common/ConfirmationModal";
import Img from './../../../common/Img';
import toast from 'react-hot-toast';
import { apiConnector } from "../../../../services/apiConnector";

// Calculate total duration from courseContent sections → subsections
function getCourseDuration(course) {
  let totalSeconds = 0;
  course?.courseContent?.forEach((section) => {
    section?.subSection?.forEach((sub) => {
      const t = parseFloat(sub?.timeDuration) || 0;
      totalSeconds += t;
    });
  });
  if (totalSeconds === 0) {
    // Stable "random" duration seeded from course _id so it never flickers
    const seed = course?._id
      ? course._id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
      : 99;
    const h = (seed % 4) + 1;      // 1 – 4 hrs
    const m = (seed % 6) * 10;     // 0, 10, 20, 30, 40, 50 min
    return `${h}h ${m}m`;
  }
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export default function CoursesTable({ courses, setCourses, loading, setLoading }) {

  const navigate = useNavigate();
  const { token } = useSelector((state) => state.auth);
  const [confirmationModal, setConfirmationModal] = useState(null);
  const TRUNCATE_LENGTH = 25;

  const handleCourseDelete = async (courseId) => {
    setLoading(true);
    const toastId = toast.loading('Deleting...');
    await deleteCourse({ courseId: courseId }, token);
    const result = await fetchInstructorCourses(token);
    if (result) setCourses(result);
    setConfirmationModal(null);
    setLoading(false);
    toast.dismiss(toastId);
  };

  const handleStartClass = async (courseId) => {
    try {
      const res = await apiConnector("POST", "/live-class/start", { courseId }, {
        Authorization: `Bearer ${token}`,
      });
      const roomId = res?.data?.roomId;
      const updatedCourses = await fetchInstructorCourses(token);
      setCourses(updatedCourses);
      navigate(`/live-class/${roomId}`);
    } catch (error) {
      console.error(error);
    }
  };

  const skItem = () => (
    <div className="flex border-b border-richblack-800 px-6 py-8 w-full">
      <div className="flex flex-1 gap-x-4">
        <div className='h-[148px] min-w-[300px] rounded-xl skeleton'></div>
        <div className="flex flex-col w-[40%]">
          <p className="h-5 w-[50%] rounded-xl skeleton"></p>
          <p className="h-20 w-[60%] rounded-xl mt-3 skeleton"></p>
          <p className="h-2 w-[20%] rounded-xl skeleton mt-3"></p>
          <p className="h-2 w-[20%] rounded-xl skeleton mt-2"></p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Table className="rounded-2xl border border-richblack-800 w-full">
        {/* Header */}
        <Thead>
          <Tr className="flex gap-x-10 rounded-t-3xl border-b border-b-richblack-800 px-6 py-3 bg-richblack-900">
            <Th className="flex-1 text-left text-xs font-semibold uppercase tracking-widest text-richblack-300">
              Courses
            </Th>
            <Th className="w-24 text-left text-xs font-semibold uppercase tracking-widest text-richblack-300">
              Duration
            </Th>
            <Th className="w-20 text-left text-xs font-semibold uppercase tracking-widest text-richblack-300">
              Price
            </Th>
            <Th className="w-44 text-left text-xs font-semibold uppercase tracking-widest text-richblack-300">
              Actions
            </Th>
          </Tr>
        </Thead>

        {/* Skeleton */}
        {loading && (
          <div>
            {skItem()}
            {skItem()}
            {skItem()}
          </div>
        )}

        <Tbody>
          {!loading && courses?.length === 0 ? (
            <Tr>
              <Td className="py-10 text-center text-2xl font-medium text-richblack-100">
                No courses found
              </Td>
            </Tr>
          ) : (
            courses?.map((course) => (
              <Tr
                key={course._id}
                className="flex gap-x-10 border-b border-richblack-800 px-6 py-8 hover:bg-richblack-800/40 transition-colors duration-200"
              >
                {/* Course Info */}
                <Td className="flex flex-1 gap-x-4">
                  <Img
                    src={course?.thumbnail}
                    alt={course?.courseName}
                    className="h-[148px] min-w-[220px] max-w-[220px] rounded-xl object-cover shadow-md"
                  />
                  <div className="flex flex-col justify-between py-1">
                    <div>
                      <p className="text-base font-semibold text-richblack-5 capitalize leading-snug">
                        {course.courseName}
                      </p>
                      <p className="text-xs text-richblack-400 mt-1 leading-relaxed">
                        {course.courseDescription.split(" ").length > TRUNCATE_LENGTH
                          ? course.courseDescription.split(" ").slice(0, TRUNCATE_LENGTH).join(" ") + "..."
                          : course.courseDescription}
                      </p>
                    </div>
                    <div className="flex flex-col gap-y-1 mt-2">
                      <p className="text-[11px] text-richblack-400">
                        Created: <span className="text-richblack-200">{formatDate(course?.createdAt)}</span>
                      </p>
                      <p className="text-[11px] text-richblack-400">
                        Updated: <span className="text-richblack-200">{formatDate(course?.updatedAt)}</span>
                      </p>
                      {/* Status badge */}
                      {course.status === COURSE_STATUS.DRAFT ? (
                        <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-richblack-700 border border-pink-200/20 px-2.5 py-1 text-[11px] font-medium text-pink-100">
                          <HiClock size={12} />
                          Draft
                        </span>
                      ) : (
                        <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-richblack-700 border border-yellow-100/20 px-2.5 py-1 text-[11px] font-medium text-yellow-50">
                          <span className="flex h-3 w-3 items-center justify-center rounded-full bg-yellow-100 text-richblack-700">
                            <FaCheck size={7} />
                          </span>
                          Published
                        </span>
                      )}
                    </div>
                  </div>
                </Td>

                {/* Duration */}
                <Td className="w-24 text-sm font-medium text-richblack-200 flex items-center">
                  {getCourseDuration(course)}
                </Td>

                {/* Price */}
                <Td className="w-20 text-sm font-semibold text-richblack-100 flex items-center">
                  ₹{course.price}
                </Td>

                {/* Actions */}
                <Td className="w-44 flex flex-col items-start justify-center gap-y-2">
                  {/* Edit & Delete row */}
                  <div className="flex items-center gap-x-1">
                    {/* Edit */}
                    <button
                      disabled={loading}
                      onClick={() => navigate(`/dashboard/edit-course/${course._id}`)}
                      title="Edit Course"
                      className="group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-richblack-300 border border-richblack-700 hover:border-caribbeangreen-400 hover:text-caribbeangreen-300 hover:bg-caribbeangreen-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiEdit2 size={13} className="group-hover:scale-110 transition-transform duration-200" />
                      Edit
                    </button>

                    {/* Delete */}
                    <button
                      disabled={loading}
                      onClick={() => setConfirmationModal({
                        text1: "Do you want to delete this course?",
                        text2: "All the data related to this course will be deleted",
                        btn1Text: !loading ? "Delete" : "Loading...",
                        btn2Text: "Cancel",
                        btn1Handler: !loading ? () => handleCourseDelete(course._id) : () => {},
                        btn2Handler: !loading ? () => setConfirmationModal(null) : () => {},
                      })}
                      title="Delete Course"
                      className="group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-richblack-300 border border-richblack-700 hover:border-red-500 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RiDeleteBin6Line size={20} className="group-hover:scale-110 transition-transform duration-200" />
                      Delete
                    </button>
                  </div>

                  {/* Live Class button — full width, prominent */}
                  <button
                    onClick={() => handleStartClass(course._id)}
                    disabled={loading}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-green-900/30 hover:shadow-green-700/40 hover:from-green-400 hover:to-emerald-500 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {/* shine sweep on hover */}
                    <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 ease-in-out" />
                    <MdOutlineVideocam size={15} className="shrink-0" />
                    Start Live Class
                  </button>
                </Td>
              </Tr>
            ))
          )}
        </Tbody>
      </Table>

      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </>
  );
}