import React, { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { fetchQuizByCourse, submitQuiz } from "../services/operations/quizAPI" // ⭐ changed
import { useSelector } from "react-redux"

function Quiz() {

  // ⭐ now we use courseId
  const { courseId } = useParams()

  const { token } = useSelector((state) => state.auth)

  const [quiz, setQuiz] = useState(null)
  const [answers, setAnswers] = useState([])
  const [score, setScore] = useState(null)


  useEffect(() => {
    loadQuiz()
  }, [])


  const loadQuiz = async () => {

    // ⭐ fetch quiz using courseId
    const result = await fetchQuizByCourse(courseId, token)

    if(result?.quiz){
      setQuiz(result.quiz)
      setAnswers(new Array(result.quiz.questions.length).fill(null))
    }

  }


  const handleOptionSelect = (questionIndex, optionIndex) => {

    const newAnswers = [...answers]
    newAnswers[questionIndex] = optionIndex
    setAnswers(newAnswers)

  }


  const handleSubmit = async () => {

    const data = {
      quizId: quiz._id, // ⭐ use real quizId from database
      answers
    }

    const result = await submitQuiz(data, token)

    if(result?.score !== undefined){
      setScore(result.score)
    }

  }


  if(!quiz) return <div className="text-white p-8">Loading Quiz...</div>


  if(score !== null){
    return (
      <div className="p-8 text-white">
        <h1 className="text-3xl font-bold">Quiz Result</h1>
        <p className="mt-4 text-xl">
          Score: {score} / {quiz.questions.length}
        </p>
      </div>
    )
  }


  return (
    <div className="p-8 text-white">

      <h1 className="text-3xl font-bold mb-6">
        {quiz.title}
      </h1>

      {quiz.questions.map((q, index) => (

        <div key={index} className="mb-6">

          <p className="font-semibold">
            {index + 1}. {q.question}
          </p>

          {q.options.map((opt, i) => (

            <button
              key={i}
              onClick={() => handleOptionSelect(index, i)}
              className={`block mt-2 p-2 border rounded ${
                answers[index] === i
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-700"
              }`}
            >
              {opt}
            </button>

          ))}

        </div>

      ))}

      <button
        onClick={handleSubmit}
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded"
      >
        Submit Quiz
      </button>

    </div>
  )
}

export default Quiz