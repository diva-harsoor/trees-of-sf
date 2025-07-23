import React,{useState} from 'react';
import ProgressBar from './ProgressBar';

function Quiz({ questions }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showQuiz, setShowQuiz] = useState(true);

  const handleAnswer = (option) => {
    console.log("option: ", option);
    console.log("correct_answer: ", questions[currentQuestion].correct_answer);
    if (option === questions[currentQuestion].correct_answer) {
      setScore(score + 1);
    }
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowQuiz(false);
    }
  };

  return (
    <>
      <ProgressBar progress={(currentQuestion + 1)/questions.length*100} />
      {showQuiz ? (
        <>
          <h3 style={{ color: 'black' }}>{questions[currentQuestion].text}</h3>
          <p>
            {questions[currentQuestion].options.map((option, i) => (
              <button onClick={() => handleAnswer(i)} key={i}>{option}</button>
            ))}
          </p>
        </>
      ) : (
        <h3 style={{ color: 'black' }}>You scored {score} out of {questions.length}</h3>
      )}
    </>
  );
}

export default Quiz; 