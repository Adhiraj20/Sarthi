import React, { useEffect, useRef, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useLocation, useNavigate, useParams } from "react-router-dom"

import "video-react/dist/video-react.css"
import { BigPlayButton, Player } from "video-react"

import { markLectureAsComplete } from "../../../services/operations/courseDetailsAPI"
import { updateCompletedLectures } from "../../../slices/viewCourseSlice"
import { setCourseViewSidebar } from "../../../slices/sidebarSlice"

import IconBtn from "../../common/IconBtn"
import { HiMenuAlt1 } from 'react-icons/hi'
import { saveAs } from "file-saver" // ✅ NEW

const VideoDetails = () => {
  const { courseId, sectionId, subSectionId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const playerRef = useRef(null)
  const dispatch = useDispatch()

  const { token } = useSelector((state) => state.auth)
  const { courseSectionData, courseEntireData, completedLectures } = useSelector((state) => state.viewCourse)

  const [videoData, setVideoData] = useState([])
  const [previewSource, setPreviewSource] = useState("")
  const [videoEnded, setVideoEnded] = useState(false)
  const [loading, setLoading] = useState(false)

  // 🧠 NEW STATES
  const [notes, setNotes] = useState("")
  const [notesLoading, setNotesLoading] = useState(false)

  useEffect(() => {
    ; (async () => {
      if (!courseSectionData.length) return
      if (!courseId && !sectionId && !subSectionId) {
        navigate(`/dashboard/enrolled-courses`)
      } else {
        const filteredData = courseSectionData.filter(
          (course) => course._id === sectionId
        )
        const filteredVideoData = filteredData?.[0]?.subSection.filter(
          (data) => data._id === subSectionId
        )
        if (filteredVideoData) setVideoData(filteredVideoData[0])
        setPreviewSource(courseEntireData.thumbnail)
        setVideoEnded(false)
        setNotes("") // reset notes when video changes
      }
    })()
  }, [courseSectionData, courseEntireData, location.pathname])

  // 🧠 GENERATE NOTES FUNCTION
  const handleGenerateNotes = async () => {
    try {
      setNotesLoading(true)

      const res = await fetch("http://localhost:5000/api/v1/ai/generate-notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          videoUrl: videoData?.videoUrl,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setNotes(data.notes)
      } else {
        alert("Failed to generate notes")
      }

    } catch (err) {
      console.error(err)
    } finally {
      setNotesLoading(false)
    }
  }

  // 📥 DOWNLOAD NOTES
  const downloadNotes = () => {
    const blob = new Blob([notes], { type: "text/plain;charset=utf-8" })
    saveAs(blob, "lecture-notes.txt")
  }

  const handleLectureCompletion = async () => {
    setLoading(true)
    const res = await markLectureAsComplete(
      { courseId: courseId, subsectionId: subSectionId },
      token
    )
    if (res) {
      dispatch(updateCompletedLectures(subSectionId))
    }
    setLoading(false)
  }

  const { courseViewSidebar } = useSelector(state => state.sidebar)

  if (courseViewSidebar && window.innerWidth <= 640) return

  return (
    <div className="flex flex-col gap-5 text-white">

      {/* Sidebar toggle */}
      <div className="sm:hidden absolute left-7 top-3 cursor-pointer">
        {!courseViewSidebar && (
          <HiMenuAlt1 size={33} onClick={() => dispatch(setCourseViewSidebar(!courseViewSidebar))} />
        )}
      </div>

      {!videoData ? (
        <img src={previewSource} alt="Preview" className="h-full w-full rounded-md object-cover" />
      ) : (
        <Player
          ref={playerRef}
          aspectRatio="16:9"
          playsInline
          autoPlay
          onEnded={() => setVideoEnded(true)}
          src={videoData?.videoUrl}
        >
          <BigPlayButton position="center" />
        </Player>
      )}

      {/* 🧠 GENERATE NOTES BUTTON */}
      <button
        onClick={handleGenerateNotes}
        disabled={notesLoading}
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded-lg"
      >
        {notesLoading ? "Generating..." : "Generate Notes 🧠"}
      </button>

      {/* ⏳ LOADING */}
      {notesLoading && <p className="text-yellow-400">Generating notes... 🤖</p>}

      {/* 📄 NOTES DISPLAY */}
      {notes && (
        <div className="mt-4 p-4 bg-richblack-800 rounded-lg whitespace-pre-wrap max-h-[300px] overflow-y-auto">
          {notes}
        </div>
      )}

      {/* 📥 DOWNLOAD */}
      {notes && (
        <button
          onClick={downloadNotes}
          className="mt-2 px-3 py-2 bg-blue-500 rounded-lg"
        >
          Download Notes 📄
        </button>
      )}

      <h1 className="mt-4 text-3xl font-semibold">{videoData?.title}</h1>
      <p className="pt-2 pb-6">{videoData?.description}</p>
    </div>
  )
}

export default VideoDetails