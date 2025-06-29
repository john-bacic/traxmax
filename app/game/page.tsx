'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import '@/styles/game/game.css';

export default function GamePage() {
  // Game state
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(0);
  const [isGameActive, setIsGameActive] = useState(true);
  const [lastGuessedNumber, setLastGuessedNumber] = useState<number | null>(null);
  const [isCircleTimerCleared, setIsCircleTimerCleared] = useState(true);
  const [usedAffirmations, setUsedAffirmations] = useState<string[]>([]);
  const [correctNumber, setCorrectNumber] = useState<number>(0);
  const [guessResults, setGuessResults] = useState<Array<{number: number, isCorrect: boolean}>>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [quadrantNumbers, setQuadrantNumbers] = useState<number[]>([1, 2, 3, 4]);
  const [endGameMessage, setEndGameMessage] = useState('');
  const [affirmationText, setAffirmationText] = useState('');
  const [showAffirmation, setShowAffirmation] = useState(false);

  // Refs
  const lastNumbers = useRef<Array<number[]>>(Array(4).fill([]).map(() => []));
  const affirmationsRef = useRef<string[]>([]);

  // Constants
  const affirmations = ['WELL DONE!', 'CORRECT!', 'BRILLIANT!', 'SPOT ON!', 'YOU GOT IT!', 'SHARP!', 'SUPER DUPER!', 'AMAZING!', 'AWESOME!', 'MAGNIFICENT!', 'NAILED IT!', 'BINGO!', 'SLAYED IT!', 'ROCKSTAR!', 'CRUSHED IT!', 'WIZARDRY!', 'HaHaHa YESSS!', 'EASY!', 'GOLD STAR!', 'ON FIRE!', 'FANTASTIC!', 'PERFECT!', 'SUPERB!', 'TERRIFIC!', 'MARVELOUS!', 'TOP NOTCH!', 'GREAT JOB!', 'YES INDEED!', 'DYNAMITE!', 'EXCEPTIONAL!', 'FABULOUS!', 'GRAND SLAM!', 'VICTORIOUS!', 'WONDERFUL!', 'YOU SHINE!'];

  const funnyNegativeMessages = [
    'Better luck next time!',
    'Try again,<br/> you&#39;ll get there!',
    'Not your day, huh?',
    'Maybe next time,<br/> keep practicing!',
    'Not quite there yet,<br/> but don&#39;t give up!',
    'Keep trying,<br/> it can only get better!',
    'That was a tough one!',
    'What happened?',
  ];

  const colorSpectrum = generateColorSpectrum(50);

  // Initialize game on mount
  useEffect(() => {
    // Load best score from localStorage
    const savedBestScore = localStorage.getItem('bestScore');
    if (savedBestScore) {
      setBestScore(parseInt(savedBestScore));
    }

    // Initialize affirmations
    affirmationsRef.current = [...affirmations];
    shuffleArray(affirmationsRef.current);

    // Initialize game
    updateQuadrants(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Utility functions
  function shuffleArray(array: string[]) {
    for (let i = array.length - 1; i > 0; i--) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      [array[i], array[randomIndex]] = [array[randomIndex], array[i]];
    }
  }

  function generateColorSpectrum(steps: number) {
    const spectrum = [];
    for (let i = 0; i < steps; i++) {
      const hue = Math.floor((i / steps) * 360);
      spectrum.push(`hsl(${hue}, 100%, 65%)`);
    }
    return spectrum;
  }

  function getAffirmation() {
    if (affirmationsRef.current.length === 0) {
      affirmationsRef.current = [...usedAffirmations];
      setUsedAffirmations([]);
      shuffleArray(affirmationsRef.current);
    }
    const affirmation = affirmationsRef.current.pop()!;
    setUsedAffirmations(prev => [...prev, affirmation]);
    return affirmation;
  }

  function generateRandomNumber(exclude: number[] = [], history: number[]) {
    let randomNumber;
    do {
      randomNumber = Math.floor(Math.random() * 50) + 1;
    } while (
      exclude.includes(randomNumber) ||
      exclude.includes(randomNumber + 1) ||
      exclude.includes(randomNumber - 1) ||
      history.includes(randomNumber)
    );
    return randomNumber;
  }

  function safePlay(audioId: string) {
    const audioElement = document.getElementById(audioId) as HTMLAudioElement;
    if (!audioElement) return;

    if (!audioElement.paused) {
      audioElement.pause();
      audioElement.currentTime = 0;
    }

    audioElement.play().catch((error) => {
      console.error('Error playing sound:', error);
    });
  }

  function playCorrectSound() {
    safePlay('correctSound');
  }

  function playIncorrectSound() {
    safePlay('incorrectSound');
  }

  function updateQuadrants(isCorrect: boolean) {
    if (!isGameActive) return;

    const numbers: number[] = [];
    const currentHistory: number[] = [];
    lastNumbers.current.forEach((numArray) => {
      currentHistory.push(...numArray);
    });

    for (let i = 1; i <= 4; i++) {
      const randomNumber = generateRandomNumber(numbers, currentHistory);
      numbers.push(randomNumber);
      lastNumbers.current[i - 1].push(randomNumber);
      if (lastNumbers.current[i - 1].length > 2) lastNumbers.current[i - 1].shift();
    }

    const rotateClockwise = isCorrect;
    const buttonGrid = document.getElementById('buttonGrid');
    if (buttonGrid) {
      buttonGrid.classList.add(
        rotateClockwise ? 'rotate-grid-opposite' : 'rotate-grid'
      );
    }

    document.querySelectorAll('.quadrant').forEach((quad) => {
      quad.classList.add(rotateClockwise ? 'rotate-quad' : 'rotate-quad-opposite');
    });

    setIsAnimating(true);

    setTimeout(() => {
      document.querySelectorAll('.quadrant').forEach((quad) => {
        quad.classList.remove('rotate-quad', 'rotate-quad-opposite');
      });
      if (buttonGrid) {
        buttonGrid.classList.remove('rotate-grid-opposite', 'rotate-grid');
      }

      const quadrantOrder = ['quad1', 'quad2', 'quad3', 'quad4'];
      const rotatedOrder = rotateClockwise
        ? [quadrantOrder[3], ...quadrantOrder.slice(0, 3)]
        : [quadrantOrder[1], quadrantOrder[2], quadrantOrder[3], quadrantOrder[0]];

      const newNumbers: number[] = [];
      rotatedOrder.forEach((_, index) => {
        newNumbers.push(numbers[index]);
      });
      setQuadrantNumbers(newNumbers);

      const newCorrectNumber = numbers[Math.floor(Math.random() * 4)];
      setCorrectNumber(newCorrectNumber);
      setLastGuessedNumber(null);

      setIsAnimating(false);
    }, 600);
  }

  function handleQuadrantClick(index: number) {
    if (!isGameActive || !isCircleTimerCleared || isAnimating) return;

    const guessedNumber = quadrantNumbers[index];
    const isCorrect = guessedNumber === correctNumber;
    setLastGuessedNumber(guessedNumber);

    if (isCorrect) {
      playCorrectSound();
      setScore(prev => prev + 1);
    } else {
      playIncorrectSound();
    }

    setCurrentRound(prev => prev + 1);
    setGuessResults(prev => [...prev, { number: correctNumber, isCorrect }]);
    revealAndDisplayResult(isCorrect);

    setIsCircleTimerCleared(false);
    setIsAnimating(true);
    setTimeout(() => {
      updateQuadrants(isCorrect);
      setIsCircleTimerCleared(true);
      setIsAnimating(false);
    }, 1000);
  }

  function revealAndDisplayResult(isCorrect: boolean) {
    if (isCorrect) {
      const affirmation = getAffirmation();
      setAffirmationText(affirmation);
      setShowAffirmation(true);
      setTimeout(() => setShowAffirmation(false), 1000);
    }

    if (currentRound >= 24) {
      setTimeout(() => endGame(), 1000);
    }
  }

  function endGame() {
    setIsGameActive(false);
    const correctPercentage = (score / 25) * 100;
    
    if (score > bestScore) {
      setBestScore(score);
      localStorage.setItem('bestScore', score.toString());
    }

    let message = '';
    if (correctPercentage === 100) {
      message = '💯 PERFECT GAME!<br/>You\'re a legend!';
    } else if (correctPercentage >= 80) {
      message = `🏆 OUTSTANDING!<br/>Score: ${score}/25`;
    } else if (correctPercentage >= 60) {
      message = `👏 GREAT JOB!<br/>Score: ${score}/25`;
    } else if (correctPercentage >= 40) {
      message = `😊 GOOD EFFORT!<br/>Score: ${score}/25`;
    } else {
      const randomMessage = funnyNegativeMessages[Math.floor(Math.random() * funnyNegativeMessages.length)];
      message = `${randomMessage}<br/>Score: ${score}/25`;
    }

    setEndGameMessage(message);
    
    if (score >= 6) {
      safePlay('above6');
    } else {
      safePlay('below6');
    }
  }

  function resetGame() {
    setScore(0);
    setCurrentRound(0);
    setIsGameActive(true);
    setLastGuessedNumber(null);
    setIsCircleTimerCleared(true);
    setUsedAffirmations([]);
    setGuessResults([]);
    setIsAnimating(false);
    setEndGameMessage('');
    setAffirmationText('');
    setShowAffirmation(false);
    lastNumbers.current = Array(4).fill([]).map(() => []);

    updateQuadrants(true);
  }

  return (
    <>
      {/* Audio elements */}
      <audio id="correctSound" src="https://raw.githubusercontent.com/john-bacic/max-code/main/sfxR05_YES_trimmed.wav" preload="auto"></audio>
      <audio id="incorrectSound" src="https://raw.githubusercontent.com/john-bacic/max-code/main/sfxR05_NO_trimmed.wav" preload="auto"></audio>
      <audio id="below6" src="https://raw.githubusercontent.com/john-bacic/max-code/main/GAME_MENU_SCORE_SFX001423_below6_trimmed.wav" preload="auto"></audio>
      <audio id="above6" src="https://raw.githubusercontent.com/john-bacic/max-code/main/GAME_MENU_SCORE_SFX001143_trimmed.wav" preload="auto"></audio>

      <div id="gameGrid">
        <Link href="/">
          <button className="closeBTN">
            <svg width="11" height="10" viewBox="0 0 11 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M1.51478 0.485215C1.12426 0.875739 1.12426 1.5089 1.51478 1.89943L4.3934 4.77805L1.10045 8.071C0.709925 8.46153 0.709925 9.09469 1.10045 9.48522C1.49097 9.87574 2.12414 9.87574 2.51466 9.48522L5.80762 6.19226L9.29296 9.6776C9.68348 10.0681 10.3166 10.0681 10.7072 9.6776C11.0977 9.28708 11.0977 8.65391 10.7072 8.26339L7.22183 4.77805L10.2928 1.70704C10.6834 1.31652 10.6834 0.683352 10.2928 0.292827C9.90231 -0.097697 9.26915 -0.0976973 8.87862 0.292827L5.80762 3.36383L2.929 0.485215C2.53847 0.0946909 1.90531 0.0946909 1.51478 0.485215Z" fill="#CCFF00"/>
            </svg>
          </button>
        </Link>

        <div id="topfeedback">
          <div id="scoreboard">score: {score}/{currentRound}</div>
          <div id="best">Best: {bestScore}</div>
        </div>

        <div id="timeline-container">
          <div id="timeline">
            {Array.from({ length: 25 }, (_, i) => (
              <div key={i} className="timeline-segment" style={
                i < guessResults.length 
                  ? guessResults[i].isCorrect 
                    ? { backgroundColor: colorSpectrum[guessResults[i].number - 1] }
                    : { backgroundColor: '#242424' }
                  : {}
              }></div>
            ))}
          </div>
          <div id="timeline-numbers">
            {Array.from({ length: 25 }, (_, i) => (
              <div key={i} className={`timeline-number ${i >= guessResults.length || !guessResults[i].isCorrect ? 'number-spacer' : ''}`} style={
                i < guessResults.length && guessResults[i].isCorrect 
                  ? { color: colorSpectrum[guessResults[i].number - 1] }
                  : {}
              }>
                {i < guessResults.length && guessResults[i].isCorrect ? guessResults[i].number : ''}
              </div>
            ))}
          </div>
          <div id="numbers"></div>
        </div>

        <div id="gameArea">
          <div id="affirmation">
            <div className={`affirmation-text ${showAffirmation ? 'show' : ''}`}>
              {affirmationText}
            </div>
            <div className="bounce-animation"></div>
          </div>

          <div id="quads">
            <div id="buttonGrid">
              {quadrantNumbers.map((num, index) => (
                <button
                  key={index}
                  className="quadrant"
                  id={`quad${index + 1}`}
                  onClick={() => handleQuadrantClick(index)}
                  disabled={!isGameActive || !isCircleTimerCleared || isAnimating}
                  style={{
                    backgroundColor: lastGuessedNumber === num && !isAnimating
                      ? colorSpectrum[num - 1]
                      : '#242424',
                    color: lastGuessedNumber === num && lastGuessedNumber === correctNumber && !isAnimating
                      ? 'white'
                      : lastGuessedNumber === num && !isAnimating
                      ? 'black'
                      : '#cf0',
                    filter: lastGuessedNumber === num && lastGuessedNumber !== correctNumber && !isAnimating
                      ? 'brightness(50%)'
                      : 'brightness(100%)',
                    textShadow: lastGuessedNumber === num && lastGuessedNumber === correctNumber && !isAnimating
                      ? '0px 5px 8px rgba(0, 0, 0, 0.5), 1px -1px 3px rgba(0, 0, 0, 0.25), -1px 1px 3px rgba(0, 0, 0, 0.5)'
                      : 'none'
                  }}
                >
                  {num}
                </button>
              ))}
            </div>
            <div className="circle" style={{
              backgroundColor: lastGuessedNumber !== null && !isAnimating ? colorSpectrum[correctNumber - 1] : '#242424',
              color: lastGuessedNumber !== null && !isAnimating ? 'white' : '#cf0',
              textShadow: lastGuessedNumber !== null && !isAnimating ? '0px 4px 8px rgba(0, 0, 0, 0.5), 1px -1px 1px rgba(0, 0, 0, 0.25), -1px 1px 3px rgba(0, 0, 0, 0.5)' : ''
            }}>
              {lastGuessedNumber !== null && !isAnimating ? correctNumber : '?'}
            </div>
            <div className="blackCircle"></div>
          </div>

          <div id="endGameMessage" dangerouslySetInnerHTML={{ __html: endGameMessage }}></div>
        </div>

        <div id="bottom">
          <div id="controls">
            <button id="reset" className="flip" onClick={resetGame}>
              <svg id="rotate-svg" width="24" height="24" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M35.725 35.7248C51.275 20.1748 76.4 20.0998 92.05 35.4748L81.75 45.7498C80.025 47.4748 79.525 50.0498 80.45 52.2998C81.375 54.5498 83.575 55.9998 86 55.9998H115.875H118C121.325 55.9998 124 53.3248 124 49.9998V17.9998C124 15.5748 122.55 13.3748 120.3 12.4498C118.05 11.5248 115.475 12.0248 113.75 13.7498L103.35 24.1498C81.45 2.52484 46.175 2.59984 24.4 24.3998C18.3 30.4998 13.9 37.6748 11.2 45.3498C9.725 49.5248 11.925 54.0748 16.075 55.5498C20.225 57.0248 24.8 54.8248 26.275 50.6748C28.2 45.2248 31.325 40.0998 35.725 35.7248ZM4 77.9998V79.8998V80.0748V110C4 112.425 5.45 114.625 7.7 115.55C9.95 116.475 12.525 115.975 14.25 114.25L24.65 103.85C46.55 125.475 81.825 125.4 103.6 103.6C109.7 97.4998 114.125 90.3248 116.825 82.6748C118.3 78.4998 116.1 73.9498 111.95 72.4748C107.8 70.9998 103.225 73.1998 101.75 77.3498C99.825 82.7998 96.7 87.9248 92.3 92.2998C76.75 107.85 51.625 107.925 35.975 92.5498L46.25 82.2498C47.975 80.5248 48.475 77.9498 47.55 75.6998C46.625 73.4498 44.425 71.9998 42 71.9998H12.1H11.925H10C6.675 71.9998 4 74.6748 4 77.9998Z" fill="#CCFF00"/>
              </svg>
            </button>

            <button id="pass" onClick={() => {
              if (!isGameActive || !isCircleTimerCleared || isAnimating) return;
              playIncorrectSound();
              setCurrentRound(prev => prev + 1);
              setGuessResults(prev => [...prev, { number: correctNumber, isCorrect: false }]);
              if (currentRound >= 24) {
                setTimeout(() => endGame(), 1000);
              }
              setIsCircleTimerCleared(false);
              setIsAnimating(true);
              setTimeout(() => {
                updateQuadrants(false);
                setIsCircleTimerCleared(true);
                setIsAnimating(false);
              }, 1000);
            }}>
              <svg id="rotate-svg-pass" width="24" height="24" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M96.575 40.0004H84C79.575 40.0004 76 43.5754 76 48.0004C76 52.4254 79.575 56.0004 84 56.0004H116C120.425 56.0004 124 52.4254 124 48.0004V16.0004C124 11.5754 120.425 8.00039 116 8.00039C111.575 8.00039 108 11.5754 108 16.0004V28.8004L103.6 24.4004C81.725 2.52539 46.275 2.52539 24.4 24.4004C2.52502 46.2754 2.52502 81.7254 24.4 103.6C46.275 125.475 81.725 125.475 103.6 103.6C106.725 100.475 106.725 95.4004 103.6 92.2754C100.475 89.1504 95.4 89.1504 92.275 92.2754C76.65 107.9 51.325 107.9 35.7 92.2754C20.075 76.6504 20.075 51.3254 35.7 35.7004C51.325 20.0754 76.65 20.0754 92.275 35.7004L96.575 40.0004Z" fill="#CCFF00"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}