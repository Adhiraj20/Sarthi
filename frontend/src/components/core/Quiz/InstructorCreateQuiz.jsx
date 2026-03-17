import { useState } from "react"
import { useSelector } from "react-redux"
import toast from "react-hot-toast"
import { createQuiz } from "../../../services/operations/quizAPI"
import { generateQuizAI } from "../../../services/operations/quizAPI" // ⭐ NEW

export default function InstructorCreateQuiz({ courseId }) {

  const { token } = useSelector((state) => state.auth)

  const [title, setTitle] = useState("")
  const [questions, setQuestions] = useState([])

  // ⭐ NEW: AI inputs
  const [topic, setTopic] = useState("")
  const [count, setCount] = useState(5)
  const [loadingAI, setLoadingAI] = useState(false)


  // ⭐ AI GENERATE FUNCTION
  const handleGenerateAI = async () => {

    if(!topic){
      toast.error("Enter topic first")
      return
    }

    try {

      setLoadingAI(true)

      const result = await generateQuizAI(
        { topic, count },
        token
      )

      if(result?.questions){
        setQuestions(result.questions)
        toast.success("AI Quiz Generated 🚀")
      }

    } catch(err){
      toast.error("AI generation failed")
    } finally {
      setLoadingAI(false)
    }

  }


  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", options: ["", "", "", ""], correctAnswer: 0 }
    ])
  }

  const handleQuestionChange = (index, value) => {
    const updated = [...questions]
    updated[index].question = value
    setQuestions(updated)
  }

  const handleOptionChange = (qIndex, oIndex, value) => {
    const updated = [...questions]
    updated[qIndex].options[oIndex] = value
    setQuestions(updated)
  }

  const handleCorrectAnswer = (qIndex, value) => {
    const updated = [...questions]
    updated[qIndex].correctAnswer = Number(value)
    setQuestions(updated)
  }

  const handleSubmit = async () => {

    const quizData = {
      title,
      courseId,
      questions
    }

    await createQuiz(quizData, token)

    toast.success("Quiz Created Successfully 🎉")
  }


  return (
    <div className="p-6 text-white max-w-3xl mx-auto">

      <h2 className="text-2xl mb-4 font-bold">Create Quiz</h2>

      {/* TITLE */}
      <input
        type="text"
        placeholder="Quiz Title"
        className="p-2 text-black w-full mb-4"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      {/* ⭐ AI SECTION */}
      <div className="bg-richblack-800 p-4 rounded mb-6">

        <h3 className="mb-3 font-semibold">🤖 Generate with AI</h3>

        <input
          type="text"
          placeholder="Topic (e.g. React Hooks)"
          className="p-2 text-black w-full mb-2"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <input
          type="number"
          placeholder="Number of Questions"
          className="p-2 text-black w-full mb-3"
          value={count}
          onChange={(e) => setCount(e.target.value)}
        />

        <button
          onClick={handleGenerateAI}
          className="bg-green-500 px-4 py-2 rounded"
        >
          {loadingAI ? "Generating..." : "Generate Questions"}
        </button>

      </div>


      <button
        className="bg-yellow-400 px-4 py-2 mb-4"
        onClick={addQuestion}
      >
        Add Question Manually
      </button>


      {questions.map((q, qIndex) => (
        <div key={qIndex} className="mt-6 border p-4 rounded">

          <input
            type="text"
            placeholder="Question"
            className="p-2 text-black w-full"
            value={q.question}
            onChange={(e) =>
              handleQuestionChange(qIndex, e.target.value)
            }
          />

          {q.options.map((opt, oIndex) => (
            <input
              key={oIndex}
              type="text"
              placeholder={`Option ${oIndex + 1}`}
              className="p-2 text-black block mt-2 w-full"
              value={opt}
              onChange={(e) =>
                handleOptionChange(qIndex, oIndex, e.target.value)
              }
            />
          ))}

          <select
            className="mt-2 text-black"
            onChange={(e) =>
              handleCorrectAnswer(qIndex, e.target.value)
            }
          >
            <option value={0}>Correct: Option 1</option>
            <option value={1}>Correct: Option 2</option>
            <option value={2}>Correct: Option 3</option>
            <option value={3}>Correct: Option 4</option>
          </select>

        </div>
      ))}

      <button
        onClick={handleSubmit}
        className="mt-6 bg-blue-600 px-4 py-2 rounded"
      >
        Save Quiz
      </button>

    </div>
  )
}