import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { Outlet, useParams, useNavigate } from "react-router-dom"

import CourseReviewModal from "../components/core/ViewCourse/CourseReviewModal"
import VideoDetailsSidebar from "../components/core/ViewCourse/VideoDetailsSidebar"
import { getFullDetailsOfCourse } from "../services/operations/courseDetailsAPI"

import {
  setCompletedLectures,
  setCourseSectionData,
  setTotalNoOfLectures,
} from "../slices/viewCourseSlice"

import { setCourseViewSidebar } from "../slices/sidebarSlice"
import { fetchQuizByCourse } from "../services/operations/quizAPI"

export default function ViewCourse() {

  const { courseId } = useParams()
  const { token } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [reviewModal, setReviewModal] = useState(false)
  const [quizAvailable, setQuizAvailable] = useState(false)

  // 🔥 FINAL: local state only
  const [course, setCourse] = useState(null)

  // 🔥 DIRECT FETCH FUNCTION
  const fetchCourse = async () => {
    try {
      const res = await getFullDetailsOfCourse(courseId, token)

      console.log("🔥 RAW RESPONSE:", res)

      // ⚠️ VERY IMPORTANT: your API shape
      const courseData =
        res?.courseDetails ||
        res?.data?.courseDetails ||
        res?.data?.data?.courseDetails

      console.log("📦 Extracted Course:", courseData)

      if (!courseData) {
        console.log("❌ Course still undefined")
        return
      }

      setCourse(courseData)

      // optional redux for sidebar only
      dispatch(setCourseSectionData(courseData.courseContent || []))
      dispatch(setCompletedLectures(res?.completedVideos || []))

      let lectures = 0
      courseData?.courseContent?.forEach((sec) => {
        lectures += sec.subSection.length
      })

      dispatch(setTotalNoOfLectures(lectures))

    } catch (err) {
      console.error(err)
    }
  }

  // 🔁 INITIAL LOAD
  useEffect(() => {
    fetchCourse()
  }, [courseId])

  // 🔁 POLLING (REALTIME UPDATE)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCourse()
    }, 3000)

    return () => clearInterval(interval)
  }, [courseId])


  // sidebar logic
  const { courseViewSidebar } = useSelector(state => state.sidebar)
  const [screenSize, setScreenSize] = useState(undefined)

  useEffect(() => {
    const handleScreenSize = () => setScreenSize(window.innerWidth)
    window.addEventListener('resize', handleScreenSize)
    handleScreenSize()
    return () => window.removeEventListener('resize', handleScreenSize)
  })

  useEffect(() => {
    if (screenSize <= 640) {
      dispatch(setCourseViewSidebar(false))
    } else {
      dispatch(setCourseViewSidebar(true))
    }
  }, [screenSize])


  return (
    <>
      <div className="relative flex min-h-[calc(100vh-3.5rem)] ">

        {courseViewSidebar && (
          <VideoDetailsSidebar setReviewModal={setReviewModal} />
        )}

        <div className="h-[calc(100vh-3.5rem)] flex-1 overflow-auto mt-14">

          {/* 🎥 LIVE CLASS BUTTON */}
          <div className="flex justify-end mr-6 mt-4">

            {console.log("🧠 FINAL CHECK:", course?.isLive)}

            {course?.isLive === true || course?.isLive === "true" ? (
              <button
                onClick={() => {
                  console.log("🚀 Joining room:", course?.liveRoomId)
                  navigate(`/live-class/${course?.liveRoomId}`)
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              >
                Join Live Class 🎥
              </button>
            ) : (
              <p className="text-yellow-400 font-medium">
                Instructor has not started the class ⏳
              </p>
            )}

          </div>

          <div className="mx-6 mt-6">
            <Outlet />
          </div>

        </div>
      </div>

      {reviewModal && (
        <CourseReviewModal setReviewModal={setReviewModal} />
      )}
    </>
  )
}