import React, { useState, useEffect } from 'react';
import ProgressBar from './ProgressBar';
import './Quiz.css';

function Quiz({ tree, collection, setCollection, questions, setCurrentCardIndex }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [showQuiz, setShowQuiz] = useState(true);

  // Reset quiz state when tree changes
  useEffect(() => {
    setCurrentQuestion(0);
    setScore(0);
    setShowQuiz(true);
  }, [tree]);

  // Update collection for successful quiz
  useEffect(() => {
    if (!showQuiz && score === questions.length) {
      setCollection(prev => ({
        ...prev,
        [tree.beginner_designation]: [...(prev[tree.beginner_designation] || []), tree]
      }));
      setCurrentCardIndex(prev => ({
        ...prev,
        [tree.beginner_designation]: (prev[tree.beginner_designation] || 0)
      }));
    }
  }, [showQuiz, score, questions.length, setCollection, tree.beginner_designation, setCurrentCardIndex]);
  // eslint-disable-next-line react-hooks/exhaustive-deps


  // Safeguard for empty questions
  if (!questions || questions.length === 0) {
    return (
      <div className="quiz-container">
        <div className="quiz-result">
          <h3 className="quiz-fail">No questions available for this tree.</h3>
        </div>
      </div>
    );
  }

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