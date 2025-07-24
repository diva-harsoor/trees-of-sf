import React, { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';
import './Quiz.css';

function Quiz({ tree, collection, setCollection, questions }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showQuiz, setShowQuiz] = useState(true);

  // Progress quiz & update score
  const handleAnswer = (option) => {
    const isCorrect = option === questions[currentQuestion].correct_answer;
    setScore(prevScore => isCorrect ? prevScore + 1 : prevScore);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      setShowQuiz(false);
    }
  };

  // Update collection for successful quiz
  useEffect(() => {
    if (!showQuiz && score === questions.length) {
      setCollection(prev => [...prev, tree]);
    }
  }, [showQuiz, score, questions.length, setCollection, tree]);

  return (
    <div className="quiz-container">
      <ProgressBar progress={(currentQuestion + 1)/questions.length*100} />
      {showQuiz ? (
        <>
          <h3 className="quiz-question">{questions[currentQuestion].text}</h3>
          <div className="quiz-options">
            {questions[currentQuestion].options.map((option, i) => (
              <button className="quiz-option-btn" onClick={() => handleAnswer(i)} key={i}>{option}</button>
            ))}
          </div>
        </>
      ) : (
        <div className="quiz-result">
          <h3 className="quiz-score">You scored {score} out of {questions.length}</h3>
          {score === questions.length ? ( 
            <h3 className="quiz-success">You've collected a {tree.common_name}!</h3>
          ) : ( 
            <h3 className="quiz-fail">Worry not, you'll have more chances to collect a {tree.common_name}.</h3>
          )}
        </div>
      )}
    </div>
  );
}

export default Quiz; 