'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { lottoMaxWinningNumbers2023 } from '../../LOTTO 2_1/data.js';
import '../../styles/lotto/lotto.css';

export default function TraxMaxV2() {
  // Core state - matching the original app
  const [activeNumbers, setActiveNumbers] = useState<Set<number>>(new Set());
  const [firstSevenToggled, setFirstSevenToggled] = useState<number[]>([]);
  const [additionalToggled, setAdditionalToggled] = useState<number[]>([]);
  const [notYetToggled, setNotYetToggled] = useState<number[]>(
    Array.from({ length: 50 }, (_, i) => i + 1)
  );
  
  // Manual toggle state for cascade/lock feature
  const [manuallyToggledNumbers, setManuallyToggledNumbers] = useState<Set<number>>(new Set());
  
  // Data and display state
  const [dataToShow, setDataToShow] = useState(lottoMaxWinningNumbers2023);
  const [activeLinkId, setActiveLinkId] = useState<string | null>(null);
  const [showBelowToggled, setShowBelowToggled] = useState(false);
  
  // UI state
  const [isAnimating, setIsAnimating] = useState(false);
  const [cascadeDisabled, setCascadeDisabled] = useState(false);
  const [cascadeButtonContent, setCascadeButtonContent] = useState<React.ReactNode>(null);
  const [currentRowIndex, setCurrentRowIndex] = useState(-1);
  const [savedNumbers, setSavedNumbers] = useState<string[]>([]);
  const [saveButtonEnabled, setSaveButtonEnabled] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  
  // Visibility states
  const [showVertical, setShowVertical] = useState(false);
  const [showHorizontal, setShowHorizontal] = useState(true);
  const [showBottomSelectors, setShowBottomSelectors] = useState(false);
  const [selectedBottomIndex, setSelectedBottomIndex] = useState(-1);
  
  // Color cache
  const colors: { [key: number]: string } = {};
  
  // Helper function to get color for a number
  const getColor = (number: number): string => {
    if (colors[number]) return colors[number];
    const hue = 360 - (number - 1) * (360 / 50);
    colors[number] = `hsl(${hue}, 100%, 69%)`;
    return colors[number];
  };

  // Initialize on mount
  useEffect(() => {
    // Load saved numbers from localStorage
    populateSavedNumbersFromLocalStorage();
    
    // Set initial UI state
    const timer = setTimeout(() => {
      // Toggle numbers from the latest draw
      if (lottoMaxWinningNumbers2023.length > 0) {
        toggleNumbersFromDraw(0);
        setSelectedBottomIndex(0);
      }
      
      // Update UI elements
      updateAllOffButtonOpacity();
      greyedCascadeButton();
      
      // Update the "all" link text
      const allLink = document.querySelector('#allLink');
      if (allLink) {
        allLink.textContent = lottoMaxWinningNumbers2023.length + 'd';
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Function implementations will be added in subsequent steps...
  const toggleNumbersFromDraw = (index: number) => {
    const draw = lottoMaxWinningNumbers2023[index];
    if (!draw) return;
    
    // Clear current selections
    setFirstSevenToggled([]);
    setAdditionalToggled([]);
    setActiveNumbers(new Set());
    
    const numbersToToggle = draw.numbers;
    const newFirstSeven: number[] = [];
    const newAdditional: number[] = [];
    const newActive = new Set<number>();
    
    numbersToToggle.forEach((number, idx) => {
      if (idx < 7) {
        newFirstSeven.push(number);
      } else {
        newAdditional.push(number);
      }
      newActive.add(number);
    });
    
    setFirstSevenToggled(newFirstSeven);
    setAdditionalToggled(newAdditional);
    setActiveNumbers(newActive);
  };

  const handleBottomSelectorClick = (index: number) => {
    if (selectedBottomIndex === index) {
      // Toggle off
      setSelectedBottomIndex(-1);
      toggleOffAllButtons();
    } else {
      // Toggle on
      setSelectedBottomIndex(index);
      toggleNumbersFromDraw(index);
      greyedCascadeButton();
    }
  };

  const handleDownButton = () => {
    const nextIndex = selectedBottomIndex < 14 ? selectedBottomIndex + 1 : 0;
    setSelectedBottomIndex(nextIndex);
    toggleNumbersFromDraw(nextIndex);
  };

  const handleUpButton = () => {
    const prevIndex = selectedBottomIndex > 0 ? selectedBottomIndex - 1 : 14;
    setSelectedBottomIndex(prevIndex);
    toggleNumbersFromDraw(prevIndex);
  };

  const updateAllOffButtonOpacity = () => {
    const allOffButton = document.getElementById('allOff');
    if (!allOffButton) return;
    
    if (activeNumbers.size === 0) {
      allOffButton.style.opacity = '0.25';
      allOffButton.style.filter = 'grayscale(1)';
    } else {
      allOffButton.style.opacity = '1';
      allOffButton.style.filter = 'grayscale(0)';
    }
  };

  const toggleOffAllButtons = () => {
    // Clear all selections
    setActiveNumbers(new Set());
    setFirstSevenToggled([]);
    setAdditionalToggled([]);
    setNotYetToggled(Array.from({ length: 50 }, (_, i) => i + 1));
    setManuallyToggledNumbers(new Set());
    
    // Reset bottom selectors
    setSelectedBottomIndex(-1);
    
    // Reset cascade button
    setCascadeDisabled(false);
    setCascadeButtonContent(null);
    
    // Update UI
    updateAllOffButtonOpacity();
  };

  const greyedCascadeButton = () => {
    setCascadeDisabled(true);
    setCascadeButtonContent(
      <svg width="25" height="25" viewBox="0 0 25 25" fill="rgb(138, 138, 138)" xmlns="http://www.w3.org/2000/svg">
        <path d="M0.15957 17.3803C0.159569 19.3614 1.60684 21.1139 3.43497 21.5711C3.81583 23.476 5.72014 24.9237 7.62444 24.8475C8.8432 24.8475 9.90961 24.3903 10.6713 23.6284C11.4331 22.8664 11.9663 21.7235 11.8901 20.5805V14.1801C11.8901 13.8753 11.8139 13.6467 11.5854 13.4182C11.3569 13.1896 11.1284 13.1134 10.8237 13.1134H4.42521C3.20646 13.1134 2.14005 13.5706 1.37833 14.3325C0.616603 15.0945 0.0833975 16.2374 0.15957 17.3803Z" />
        <path d="M13.2611 4.27517V10.6756C13.2611 11.2851 13.7181 11.7423 14.3275 11.7423H20.7259C21.9447 11.7423 23.0111 11.2851 23.7728 10.5232C24.5346 9.76124 25.0678 8.61831 24.9916 7.47538C24.9916 5.49429 23.5443 3.7418 21.7162 3.28463C21.5638 2.52267 21.1068 1.76072 20.5736 1.22735C19.7357 0.389197 18.6693 -0.0679753 17.5267 0.0082202C16.308 0.0082202 15.2416 0.465393 14.4798 1.22735C13.7181 1.9893 13.1849 3.13223 13.2611 4.27517Z" />
        <path d="M13.1851 14.2564V20.6569C13.1851 22.9427 15.1656 24.9238 17.5269 25C18.7457 25 19.8121 24.5428 20.5738 23.7809C21.1832 23.1713 21.564 22.4855 21.7164 21.7236C22.4781 21.5712 23.2398 21.114 23.773 20.5807C24.6109 19.7425 25.068 18.6758 24.9918 17.5328C24.9918 16.3137 24.5347 15.247 23.773 14.485C23.0113 13.7231 21.8687 13.1897 20.7261 13.2659H14.3277C14.023 13.2659 13.7945 13.3421 13.566 13.5707C13.3374 13.7993 13.1851 13.9517 13.1851 14.2564Z" />
        <path d="M1.22697 4.42795C0.389079 5.2661 -0.0679545 6.33283 0.0082177 7.47576C0.0082178 9.91402 1.91252 11.8189 4.35003 11.8189H10.7485C11.3579 11.8189 11.8149 11.3617 11.8149 10.7522V4.35175C11.8149 3.13262 11.3579 2.06588 10.5962 1.30393C9.83443 0.541976 8.76802 0.084804 7.54926 0.084804C6.33051 0.0848039 5.2641 0.541977 4.50238 1.30393C3.893 1.9135 3.51214 2.59925 3.35979 3.36121C2.5219 3.4374 1.76018 3.89458 1.22697 4.42795Z" />
      </svg>
    );
  };
  
  const resetCascadeButton = () => {
    setCascadeDisabled(false);
    setCascadeButtonContent(null);
  };

  const populateSavedNumbersFromLocalStorage = () => {
    const saved = localStorage.getItem('savedNumbers');
    if (saved) {
      setSavedNumbers(JSON.parse(saved));
    }
  };
  
  // Save numbers functionality
  const saveNumbers = () => {
    if (firstSevenToggled.length === 7) {
      const sortedNumbers = [...firstSevenToggled].sort((a, b) => a - b);
      const sequence = sortedNumbers.join('-');
      
      // Check if already saved
      if (!savedNumbers.includes(sequence)) {
        const newSaved = [...savedNumbers, sequence];
        setSavedNumbers(newSaved);
        localStorage.setItem('savedNumbers', JSON.stringify(newSaved));
      }
    }
  };
  
  // Check if current selection can be saved
  const checkAndToggleSaveButtonState = () => {
    if (firstSevenToggled.length === 7) {
      const sortedNumbers = [...firstSevenToggled].sort((a, b) => a - b);
      const sequence = sortedNumbers.join('-');
      setSaveButtonEnabled(!savedNumbers.includes(sequence));
    } else {
      setSaveButtonEnabled(false);
    }
  };
  
  // Update save button state when selections change
  useEffect(() => {
    checkAndToggleSaveButtonState();
  }, [firstSevenToggled, savedNumbers]);
  
  // Cascade button (random number generator) functionality
  const handleCascadeClick = () => {
    if (cascadeDisabled || isAnimating) return;
    
    setIsAnimating(true);
    setCascadeDisabled(true);
    
    // Clear all except manually toggled
    const manuallyToggledArray = Array.from(manuallyToggledNumbers);
    toggleOffAllButtons();
    
    // Re-toggle manually toggled numbers
    manuallyToggledArray.forEach(num => {
      setManuallyToggledNumbers(prev => new Set(prev).add(num));
      setActiveNumbers(prev => new Set(prev).add(num));
    });
    
    // Show spinner
    const randomHue = Math.floor(Math.random() * 360);
    const fillColor = `hsl(${randomHue}, 100%, 15%)`;
    setCascadeButtonContent(
      <svg data-role="spinner" width="25" height="25" viewBox="0 0 25 25" fill={fillColor} xmlns="http://www.w3.org/2000/svg">
        <path d="M0.15957 17.3803C0.159569 19.3614 1.60684 21.1139 3.43497 21.5711C3.81583 23.476 5.72014 24.9237 7.62444 24.8475C8.8432 24.8475 9.90961 24.3903 10.6713 23.6284C11.4331 22.8664 11.9663 21.7235 11.8901 20.5805V14.1801C11.8901 13.8753 11.8139 13.6467 11.5854 13.4182C11.3569 13.1896 11.1284 13.1134 10.8237 13.1134H4.42521C3.20646 13.1134 2.14005 13.5706 1.37833 14.3325C0.616603 15.0945 0.0833975 16.2374 0.15957 17.3803Z" />
        <path d="M13.2611 4.27517V10.6756C13.2611 11.2851 13.7181 11.7423 14.3275 11.7423H20.7259C21.9447 11.7423 23.0111 11.2851 23.7728 10.5232C24.5346 9.76124 25.0678 8.61831 24.9916 7.47538C24.9916 5.49429 23.5443 3.7418 21.7162 3.28463C21.5638 2.52267 21.1068 1.76072 20.5736 1.22735C19.7357 0.389197 18.6693 -0.0679753 17.5267 0.0082202C16.308 0.0082202 15.2416 0.465393 14.4798 1.22735C13.7181 1.9893 13.1849 3.13223 13.2611 4.27517Z" />
        <path d="M13.1851 14.2564V20.6569C13.1851 22.9427 15.1656 24.9238 17.5269 25C18.7457 25 19.8121 24.5428 20.5738 23.7809C21.1832 23.1713 21.564 22.4855 21.7164 21.7236C22.4781 21.5712 23.2398 21.114 23.773 20.5807C24.6109 19.7425 25.068 18.6758 24.9918 17.5328C24.9918 16.3137 24.5347 15.247 23.773 14.485C23.0113 13.7231 21.8687 13.1897 20.7261 13.2659H14.3277C14.023 13.2659 13.7945 13.3421 13.566 13.5707C13.3374 13.7993 13.1851 13.9517 13.1851 14.2564Z" />
        <path d="M1.22697 4.42795C0.389079 5.2661 -0.0679545 6.33283 0.0082177 7.47576C0.0082178 9.91402 1.91252 11.8189 4.35003 11.8189H10.7485C11.3579 11.8189 11.8149 11.3617 11.8149 10.7522V4.35175C11.8149 3.13262 11.3579 2.06588 10.5962 1.30393C9.83443 0.541976 8.76802 0.084804 7.54926 0.084804C6.33051 0.0848039 5.2641 0.541977 4.50238 1.30393C3.893 1.9135 3.51214 2.59925 3.35979 3.36121C2.5219 3.4374 1.76018 3.89458 1.22697 4.42795Z" />
      </svg>
    );
    
    // Animate random numbers then select 7
    setTimeout(() => {
      // Select 7 random numbers (excluding manually toggled)
      const availableNumbers = Array.from({ length: 50 }, (_, i) => i + 1)
        .filter(n => !manuallyToggledNumbers.has(n));
      
      const selectedNumbers = new Set(manuallyToggledArray);
      while (selectedNumbers.size < 7 && availableNumbers.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableNumbers.length);
        const number = availableNumbers.splice(randomIndex, 1)[0];
        selectedNumbers.add(number);
      }
      
      // Toggle the selected numbers
      Array.from(selectedNumbers).forEach((number, index) => {
        if (!manuallyToggledNumbers.has(number)) {
          setTimeout(() => {
            toggleColor(number);
          }, index * 100);
        }
      });
      
      // Reset cascade button after animation
      setTimeout(() => {
        setCascadeButtonContent(null);
        setCascadeDisabled(false);
        setIsAnimating(false);
      }, selectedNumbers.size * 100 + 500);
    }, 1000);
  };

  // Core toggle logic - matching original app exactly
  const toggleColor = (number: number) => {
    const isActivated = activeNumbers.has(number);
    
    // Toggle active state - but note the original behavior:
    // If number is in additionalToggled and we're activating, it stays active
    const newActiveNumbers = new Set(activeNumbers);
    if (isActivated) {
      newActiveNumbers.delete(number);
    } else {
      newActiveNumbers.add(number);
    }
    setActiveNumbers(newActiveNumbers);
    
    // Update toggle sequences
    updateToggleSequence(number, !isActivated);
    
    // Update UI
    updateAllOffButtonOpacity();
  };

  const updateToggleSequence = (number: number, isActive: boolean) => {
    const wasInFirstSeven = firstSevenToggled.includes(number);
    const wasInAdditional = additionalToggled.includes(number);
    const indexInNotYetToggled = notYetToggled.indexOf(number);

    if (isActive) {
      if (firstSevenToggled.length < 7 && !wasInFirstSeven) {
        // Add to first seven
        setFirstSevenToggled(prev => [...prev, number]);
        if (indexInNotYetToggled > -1) {
          setNotYetToggled(prev => {
            const newArr = [...prev];
            newArr.splice(indexInNotYetToggled, 1);
            return newArr;
          });
        }
      } else if (!wasInFirstSeven && !wasInAdditional) {
        // Add to additional (beyond 7) - EXACT match to original
        setAdditionalToggled(prev => [...prev, number]);
        if (indexInNotYetToggled > -1) {
          setNotYetToggled(prev => {
            const newArr = [...prev];
            newArr.splice(indexInNotYetToggled, 1);
            return newArr;
          });
        }
      }
      // Note: If already in additional, do nothing (matching original behavior)
    } else {
      const indexInFirstSeven = firstSevenToggled.indexOf(number);
      if (indexInFirstSeven > -1) {
        // Remove from first seven
        const newFirstSeven = [...firstSevenToggled];
        newFirstSeven.splice(indexInFirstSeven, 1);
        
        // Move from additional if exists
        let newAdditional = [...additionalToggled];
        if (newAdditional.length > 0) {
          const movedNumber = newAdditional.shift()!;
          newFirstSeven.push(movedNumber);
        }
        
        setFirstSevenToggled(newFirstSeven);
        setAdditionalToggled(newAdditional);
        setNotYetToggled(prev => [...prev, number]);
      } else {
        // Remove from additional
        const indexInAdditional = additionalToggled.indexOf(number);
        if (indexInAdditional > -1) {
          const newAdditional = [...additionalToggled];
          newAdditional.splice(indexInAdditional, 1);
          setAdditionalToggled(newAdditional);
          setNotYetToggled(prev => [...prev, number]);
        }
      }
    }
  };

  // Main grid toggle with manual lock feature
  const handleMainGridClick = (number: number) => {
    // Check if this number is already active
    if (activeNumbers.has(number)) {
      // If already active and not manually toggled, add to manually toggled (lock it)
      if (!manuallyToggledNumbers.has(number)) {
        setManuallyToggledNumbers(prev => new Set(prev).add(number));
      } else {
        // If already manually toggled, remove the lock
        setManuallyToggledNumbers(prev => {
          const newSet = new Set(prev);
          newSet.delete(number);
          return newSet;
        });
      }
    } else {
      // Normal toggle behavior
      toggleColor(number);
    }
  };

  // Render number buttons for main grid
  const renderNumberButton = (number: number) => {
    const isActive = activeNumbers.has(number);
    const isManuallyToggled = manuallyToggledNumbers.has(number);
    const isInFirstSeven = firstSevenToggled.includes(number);
    const isInAdditional = additionalToggled.includes(number);
    const isBonus = false; // Main grid buttons are never bonus
    
    let backgroundColor = '';
    let color = '';
    let textShadow = '';
    let outline = '';
    let outlineOffset = '';
    
    if (isActive) {
      backgroundColor = getColor(number);
      if (isInFirstSeven) {
        color = '#fff';
        textShadow = '';
      } else if (isInAdditional) {
        color = 'black';
        textShadow = 'none';
      }
      
      // Apply black outline if manually toggled (locked)
      if (isManuallyToggled) {
        outline = '3px solid #000';
        outlineOffset = '-5px';
      }
    } else if (firstSevenToggled.length === 7) {
      backgroundColor = '#1C1C1C';
      color = '#8A8A8A';
    } else {
      backgroundColor = 'rgb(36, 36, 36)';
    }
    
    return (
      <button
        key={number}
        data-number={number}
        className={`number-button ${isActive ? 'toggled-on' : ''}`}
        style={{
          backgroundColor: backgroundColor || undefined,
          color: color || undefined,
          textShadow: textShadow || undefined,
          opacity: isBonus ? '0.5' : '1',
          outline: outline || undefined,
          outlineOffset: outlineOffset || undefined
        }}
        onClick={() => handleMainGridClick(number)}
      >
        {number}
      </button>
    );
  };

  // Toggle visibility of elements
  const toggleVisibility = () => {
    setShowVertical(!showVertical);
    setShowHorizontal(!showHorizontal);
  };

  // Frequency link handler
  const handleFrequencyClick = (e: React.MouseEvent<HTMLAnchorElement>, linkId: string) => {
    e.preventDefault();
    
    // Toggle logic - if already active, turn off
    if (activeLinkId === linkId) {
      setActiveLinkId(null);
      setDataToShow(lottoMaxWinningNumbers2023);
    } else {
      setActiveLinkId(linkId);
      
      // Update data based on selection
      if (linkId !== 'pairs') {
        const rows = linkId === 'allLink' ? lottoMaxWinningNumbers2023.length : 
                     parseInt(linkId.replace('d', ''));
        setDataToShow(lottoMaxWinningNumbers2023.slice(0, rows));
      }
    }
  };

  return (
    <>
      {/* Loader - hidden by default */}
      {/* <div className="loader"></div> */}

      {/* Next Jackpot */}
      <div role="presentation" className="easter-egg">
        Tuesday 01.07.25
        <span className="flip" role="img" style={{ fontSize: '1.25em', top: '0.15em', position: 'relative' }}>
          🍀
        </span>
        <strong>$55 million</strong>
        <span role="img" style={{ fontSize: '1.25em', top: '0.15em', position: 'relative' }}>
          🍀
        </span>
        <div><span style={{ fontSize: '.75em', marginLeft: 164 }}>+ 4 MaxMillions</span></div>
      </div>

      {/* TOP NAV */}
      <div className="topNav">
        <button 
          className="allOff" 
          id="allOff"
          onClick={toggleOffAllButtons}
          style={{
            opacity: activeNumbers.size === 0 ? '0.25' : '1',
            filter: activeNumbers.size === 0 ? 'grayscale(1)' : 'grayscale(0)'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" height="16" width="14" viewBox="0 0 448 512">
            <path fill="#cf0" d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"/>
          </svg>
        </button>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            className="noBorder" 
            id="vertical"
            style={{ display: showVertical ? 'block' : 'none' }}
            onClick={toggleVisibility}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="10" viewBox="0 0 320 512">
              <path fill="#cf0" d="M40 352l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zm192 0l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zM40 320c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0zM232 192l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zM40 160c-22.1 0-40-17.9-40-40L0 72C0 49.9 17.9 32 40 32l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0zM232 32l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40z"/>
            </svg>
          </button>

          <button 
            className="noBorder" 
            id="horizontal"
            style={{ display: showHorizontal ? 'block' : 'none' }}
            onClick={toggleVisibility}
          >
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="14" viewBox="0 0 448 512">
              <path fill="#cf0" d="M128 136c0-22.1-17.9-40-40-40L40 96C17.9 96 0 113.9 0 136l0 48c0 22.1 17.9 40 40 40H88c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40H40c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40H88c22.1 0 40-17.9 40-40V328zm32-192v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V136c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM288 328c0-22.1-17.9-40-40-40H200c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V328zm32-192v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V136c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM448 328c0-22.1-17.9-40-40-40H360c-22.1 0-40 17.9-40 40v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V328z"/>
            </svg>
          </button>
        </div>

        <a href="../game" target="_self">
          <button className="spin">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.75 12.5H6.25C6.94063 12.5 7.5 11.9406 7.5 11.25V9.75C7.5 9.05937 6.94063 8.5 6.25 8.5H4.75C4.05937 8.5 3.5 9.05937 3.5 9.75V11.25C3.5 11.9406 4.05937 12.5 4.75 12.5ZM9.75 8.5C9.05937 8.5 8.5 9.05937 8.5 9.75V11.25C8.5 11.9406 9.05937 12.5 9.75 12.5H11.25C11.9406 12.5 12.5 11.9406 12.5 11.25V9.75C12.5 9.05937 11.9406 8.5 11.25 8.5H9.75ZM4.75 7.5H6.25C6.94063 7.5 7.5 6.94063 7.5 6.25L7.5 4.75C7.5 4.05937 6.94063 3.5 6.25 3.5H4.75C4.05937 3.5 3.5 4.05937 3.5 4.75V6.25C3.5 6.94063 4.05937 7.5 4.75 7.5ZM9.75 3.5C9.05937 3.5 8.5 4.05937 8.5 4.75V6.25C8.5 6.94063 9.05937 7.5 9.75 7.5L11.25 7.5C11.9406 7.5 12.5 6.94063 12.5 6.25V4.75C12.5 4.05937 11.9406 3.5 11.25 3.5H9.75Z" fill="#CCFF00"/>
            </svg>
          </button>
        </a>
      </div>

      <div className="spacer" id="winningNumberSpacer" style={{ height: '65px' }}></div>

      {/* NUMBERS SELECTOR */}
      <div className="selectorContainer" id="selectorContainerID" style={{ display: showHorizontal ? 'flex' : 'none' }}>
        <div className="sumText">
          {(() => {
            const combinedArray = [...firstSevenToggled, ...additionalToggled];
            if (combinedArray.length >= 2) {
              const sum = combinedArray.reduce((acc, val) => acc + val, 0);
              const numerologySum = (() => {
                let num = sum;
                while (num > 9) {
                  num = num.toString().split('').reduce((acc, digit) => acc + parseInt(digit), 0);
                }
                return num;
              })();
              return `sum: ${sum} :${numerologySum}`;
            }
            return '';
          })()}
        </div>
        <table>
          <tbody>
            {Array.from({ length: 10 }).map((_, row) => (
              <tr key={row}>
                {Array.from({ length: 5 }).map((_, col) => {
                  const number = row * 5 + col + 1;
                  return (
                    <td key={col}>
                      {renderNumberButton(number)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RANDOM NUMBER GENERATOR BUTTON */}
      <div className="randNumberBox" data-role="interactive-randNumberBox" id="randNumberBox" style={{ display: showHorizontal ? 'block' : 'none' }}>
        <button 
          className="cascadeButton" 
          data-role="interactive-cascadeButton" 
          id="cascadeButton"
          disabled={cascadeDisabled || isAnimating}
          onClick={handleCascadeClick}
          style={{
            backgroundColor: cascadeDisabled ? 'rgb(28, 28, 28)' : undefined
          }}
        >
          {cascadeButtonContent || (
            <svg width="25" height="25" viewBox="0 0 25 25" fill="#cf0" xmlns="http://www.w3.org/2000/svg">
              <path d="M0.15957 17.3803C0.159569 19.3614 1.60684 21.1139 3.43497 21.5711C3.81583 23.476 5.72014 24.9237 7.62444 24.8475C8.8432 24.8475 9.90961 24.3903 10.6713 23.6284C11.4331 22.8664 11.9663 21.7235 11.8901 20.5805V14.1801C11.8901 13.8753 11.8139 13.6467 11.5854 13.4182C11.3569 13.1896 11.1284 13.1134 10.8237 13.1134H4.42521C3.20646 13.1134 2.14005 13.5706 1.37833 14.3325C0.616603 15.0945 0.0833975 16.2374 0.15957 17.3803Z" />
              <path d="M13.2611 4.27517V10.6756C13.2611 11.2851 13.7181 11.7423 14.3275 11.7423H20.7259C21.9447 11.7423 23.0111 11.2851 23.7728 10.5232C24.5346 9.76124 25.0678 8.61831 24.9916 7.47538C24.9916 5.49429 23.5443 3.7418 21.7162 3.28463C21.5638 2.52267 21.1068 1.76072 20.5736 1.22735C19.7357 0.389197 18.6693 -0.0679753 17.5267 0.0082202C16.308 0.0082202 15.2416 0.465393 14.4798 1.22735C13.7181 1.9893 13.1849 3.13223 13.2611 4.27517Z" />
              <path d="M13.1851 14.2564V20.6569C13.1851 22.9427 15.1656 24.9238 17.5269 25C18.7457 25 19.8121 24.5428 20.5738 23.7809C21.1832 23.1713 21.564 22.4855 21.7164 21.7236C22.4781 21.5712 23.2398 21.114 23.773 20.5807C24.6109 19.7425 25.068 18.6758 24.9918 17.5328C24.9918 16.3137 24.5347 15.247 23.773 14.485C23.0113 13.7231 21.8687 13.1897 20.7261 13.2659H14.3277C14.023 13.2659 13.7945 13.3421 13.566 13.5707C13.3374 13.7993 13.1851 13.9517 13.1851 14.2564Z" />
              <path d="M1.22697 4.42795C0.389079 5.2661 -0.0679545 6.33283 0.0082177 7.47576C0.0082178 9.91402 1.91252 11.8189 4.35003 11.8189H10.7485C11.3579 11.8189 11.8149 11.3617 11.8149 10.7522V4.35175C11.8149 3.13262 11.3579 2.06588 10.5962 1.30393C9.83443 0.541976 8.76802 0.084804 7.54926 0.084804C6.33051 0.0848039 5.2641 0.541977 4.50238 1.30393C3.893 1.9135 3.51214 2.59925 3.35979 3.36121C2.5219 3.4374 1.76018 3.89458 1.22697 4.42795Z" />
            </svg>
          )}
        </button>
      </div>

      {/* NUMBERS DISPLAY */}
      <div id="selectedNumbersRowID" className="selectedNumbersRow" tabIndex={0} style={{ display: showHorizontal ? 'flex' : 'none' }}>
        {Array.from({ length: 7 }).map((_, i) => {
          const sortedFirstSeven = [...firstSevenToggled].sort((a, b) => a - b);
          const number = sortedFirstSeven[i];
          return (
            <div 
              key={i} 
              className="chosen_number_box"
              style={{
                borderColor: number ? getColor(number) : '#242424'
              }}
            >
              <div 
                className="chosen_number"
                style={{ color: number ? '#fff' : '#242424' }}
              >
                {number || '•'}
              </div>
              <div className="frequency">
                {activeLinkId && number ? 'x' : '  '}
              </div>
            </div>
          );
        })}
      </div>

      <div className="forRandSpacer"></div>

      {/* FREQUENCY NAV */}
      <div id="linkList" style={{ display: showHorizontal ? 'flex' : 'none' }}>
        <a 
          href="#" 
          data-rows="8" 
          className={`link-button ${activeLinkId === '8d' ? 'on' : ''}`}
          onClick={(e) => handleFrequencyClick(e, '8d')}
        >
          8d
        </a>
        <a 
          href="#" 
          data-rows="13" 
          className={`link-button ${activeLinkId === '13d' ? 'on' : ''}`}
          onClick={(e) => handleFrequencyClick(e, '13d')}
        >
          13d
        </a>
        <a 
          href="#" 
          data-rows="21" 
          className={`link-button ${activeLinkId === '21d' ? 'on' : ''}`}
          onClick={(e) => handleFrequencyClick(e, '21d')}
        >
          21d
        </a>
        <a 
          href="#" 
          data-rows="34" 
          className={`link-button ${activeLinkId === '34d' ? 'on' : ''}`}
          onClick={(e) => handleFrequencyClick(e, '34d')}
        >
          34d
        </a>
        <a 
          href="#" 
          data-rows="55" 
          className={`link-button ${activeLinkId === '55d' ? 'on' : ''}`}
          onClick={(e) => handleFrequencyClick(e, '55d')}
        >
          55d
        </a>
        <a 
          href="#" 
          data-rows="all" 
          className={`link-button ${activeLinkId === 'allLink' ? 'on' : ''}`}
          id="allLink"
          onClick={(e) => handleFrequencyClick(e, 'allLink')}
        >
          all
        </a>
        <a 
          href="#" 
          data-rows="all" 
          className={`link-button ${activeLinkId === 'pairs' ? 'on' : ''}`}
          id="pairs"
          onClick={(e) => handleFrequencyClick(e, 'pairs')}
        >
          x+y
        </a>
      </div>

      {/* FREQUENCY DISPLAYS */}
      <div id="frequencyContainer" style={{ display: activeLinkId ? 'flex' : 'none' }}>
        <div id="frequencyResults" style={{ display: activeLinkId && activeLinkId !== 'pairs' ? 'block' : 'none' }}></div>
        <div id="pairFrequency" style={{ display: activeLinkId === 'pairs' ? 'block' : 'none' }}></div>
      </div>

      {/* WINNING NUMBERS TABLE */}
      <div className="winningNumbersContainer">
        <div id="winningNumbersTable">
          <table>
            <tbody>
              {dataToShow.map((draw, index) => (
                <tr key={index}>
                  {draw.numbers.concat(draw.bonus).map((number, numIndex) => (
                    <td key={numIndex} className="winningNumCell">
                      <button
                        data-number={number}
                        className={`saved-number-button ${activeNumbers.has(number) ? 'toggled-on' : ''} ${numIndex === draw.numbers.length ? 'bonus' : ''}`}
                        style={{
                          backgroundColor: activeNumbers.has(number) ? getColor(number) : undefined,
                          color: firstSevenToggled.includes(number) ? '#fff' : 
                                 additionalToggled.includes(number) ? 'black' : undefined,
                          textShadow: additionalToggled.includes(number) ? 'none' : undefined,
                          opacity: numIndex === draw.numbers.length ? '0.5' : '1'
                        }}
                        onClick={() => toggleColor(number)}
                      >
                        {number}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div id="lastDrawDateDisplay" className="till_when_text">
          {dataToShow.length} draws since {dataToShow.length > 0 ? dataToShow[dataToShow.length - 1].date : 'N/A'}
        </div>
      </div>

      {/* BOTTOM CONTAINER */}
      <div className="bottomContainer">
        <div className="drawDetails" id="drawDetails" style={{ display: selectedBottomIndex >= 0 ? 'block' : 'none' }}>
          {selectedBottomIndex >= 0 && (() => {
            const draw = lottoMaxWinningNumbers2023[selectedBottomIndex];
            if (!draw) return 'details';
            
            const monthMap: { [key: string]: number } = {
              January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
              July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
            };
            
            const dateParts = draw.date.split(' ');
            const month = monthMap[dateParts[0]].toString().padStart(2, '0');
            const day = dateParts[1].slice(0, -1).padStart(2, '0');
            const year = dateParts[2].slice(-2);
            const formattedDate = `${day}.${month}.${year}`;
            const jackpot = `$${draw.jackpot / 1000000} million`;
            
            return `${formattedDate} ~ ${jackpot}`;
          })()}
        </div>

        <div className="bottomSelectorsContainer" id="bottomSelectorsContainer" style={{ display: showBottomSelectors ? 'grid' : 'none' }}>
          {['Latest', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', '13th', '14th', '15th'].map((label, index) => (
            <div
              key={index}
              className={`bottomSelector ${selectedBottomIndex === index ? 'on' : 'off'}`}
              onClick={() => handleBottomSelectorClick(index)}
            >
              {label}
            </div>
          ))}
        </div>

        {/* BOTTOM NAV CONTROLS */}
        <div className="controls">
          <button className="downSaved" id="downSaved" style={{ display: savedNumbers.length > 0 ? 'block' : 'none' }}>
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512">
              <path fill="#009eba" d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/>
            </svg>
          </button>

          <button className="downButton" id="downButton" onClick={handleDownButton} style={{ display: selectedBottomIndex >= 0 ? 'block' : 'none' }}>
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512">
              <path fill="currentColor" style={{ color: 'var(--main-color)' }} d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/>
            </svg>
          </button>

          <button className="lockSaved" id="lockSaved" style={{ display: isLocked ? 'block' : 'none' }}>
            <svg width="20" height="20" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 34.2549C17 31.1316 19.6043 28.5996 22.8169 28.5996H47.1831C50.3957 28.5996 53 31.1316 53 34.2549V57.9443C53 61.0676 50.3957 63.5996 47.1831 63.5996H22.8169C19.6043 63.5996 17 61.0676 17 57.9443V34.2549Z" fill="#009eba"/>
              <path d="M35.0169 6C27.8662 6 22.0693 11.7968 22.0693 18.9476V26H28.5916V18.9476C28.5916 15.399 31.4683 12.5222 35.0169 12.5222C38.5655 12.5222 41.4423 15.399 41.4423 18.9476V26H47.9645V18.9476C47.9645 11.7968 42.1677 6 35.0169 6Z" fill="#009eba"/>
            </svg>
          </button>

          <button className="unLockSaved" id="unLockSaved" style={{ display: !isLocked ? 'block' : 'none' }}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.85742 9.78712C4.85742 8.89474 5.60151 8.17131 6.51939 8.17131H13.4812C14.3991 8.17131 15.1431 8.89474 15.1431 9.78712V16.5555C15.1431 17.4479 14.3991 18.1713 13.4812 18.1713H6.51939C5.60151 18.1713 4.85742 17.4479 4.85742 16.5555V9.78712Z" fill="#009EBA"/>
              <path d="M15.6996 1.71387C13.6565 1.71387 12.0003 3.3701 12.0003 5.41318V7.42815H13.8638V5.41318C13.8638 4.3993 14.6857 3.57735 15.6996 3.57735C16.7135 3.57735 17.5354 4.3993 17.5354 5.41318V7.42815H19.3989V5.41318C19.3989 3.3701 17.7427 1.71387 15.6996 1.71387Z" fill="#009EBA"/>
            </svg>
          </button>

          <button className="bottomTrigger" id="bottomTrigger" onClick={() => setShowBottomSelectors(!showBottomSelectors)}>
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" style={{ color: 'var(--main-color)' }} d="M4 1.25C4 0.559375 3.44063 0 2.75 0H1.25C0.559375 0 0 0.559375 0 1.25V2.75C0 3.44063 0.559375 4 1.25 4H2.75C3.44063 4 4 3.44063 4 2.75V1.25ZM4 7.25C4 6.55937 3.44063 6 2.75 6H1.25C0.559375 6 0 6.55937 0 7.25V8.75C0 9.44063 0.559375 10 1.25 10H2.75C3.44063 10 4 9.44063 4 8.75V7.25ZM5 1.25V2.75C5 3.44063 5.55937 4 6.25 4H7.75C8.44063 4 9 3.44063 9 2.75V1.25C9 0.559375 8.44063 0 7.75 0H6.25C5.55937 0 5 0.559375 5 1.25ZM9 7.25C9 6.55937 8.44063 6 7.75 6H6.25C5.55937 6 5 6.55937 5 7.25V8.75C5 9.44063 5.55937 10 6.25 10H7.75C8.44063 10 9 9.44063 9 8.75V7.25ZM10 1.25V2.75C10 3.44063 10.5594 4 11.25 4H12.75C13.4406 4 14 3.44063 14 2.75V1.25C14 0.559375 13.4406 0 12.75 0H11.25C10.5594 0 10 0.559375 10 1.25ZM14 7.25C14 6.55937 13.4406 6 12.75 6H11.25C10.5594 6 10 6.55937 10 7.25V8.75C10 9.44063 10.5594 10 11.25 10H12.75C13.4406 10 14 9.44063 14 8.75V7.25Z"/>
            </svg>
          </button>

          <button className="upButton" id="upButton" onClick={handleUpButton} style={{ display: selectedBottomIndex >= 0 ? 'block' : 'none' }}>
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512">
              <path fill="currentColor" style={{ color: 'var(--main-color)' }} d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/>
            </svg>
          </button>

          <button className="upSaved" id="upSaved" style={{ display: savedNumbers.length > 0 ? 'block' : 'none' }}>
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512">
              <path fill="#009eba" d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* SAVED NUMBERS TABLE */}
      <div id="savedUmbersID" style={{ display: savedNumbers.length > 0 ? 'block' : 'none' }}>
        <table>
          <tbody>
            {savedNumbers.map((sequence, index) => (
              <tr key={index}>
                {sequence.split('-').map((num, numIndex) => (
                  <td key={numIndex}>
                    <button
                      data-number={num}
                      className={`saved-number-button ${activeNumbers.has(parseInt(num)) ? 'toggled-on' : ''}`}
                      style={{
                        backgroundColor: activeNumbers.has(parseInt(num)) ? getColor(parseInt(num)) : undefined,
                        color: firstSevenToggled.includes(parseInt(num)) ? '#fff' : 
                               additionalToggled.includes(parseInt(num)) ? 'black' : undefined
                      }}
                      onClick={() => toggleColor(parseInt(num))}
                    >
                      {num}
                    </button>
                  </td>
                ))}
                <td>
                  <button 
                    className="remove-saved"
                    onClick={() => {
                      const newSaved = savedNumbers.filter((_, i) => i !== index);
                      setSavedNumbers(newSaved);
                      localStorage.setItem('savedNumbers', JSON.stringify(newSaved));
                    }}
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SAVE BUTTON */}
      <div className="saveButtonContainer" style={{ display: showHorizontal ? 'block' : 'none' }}>
        <button 
          id="saveBtnDefaultID"
          className="saveBtnDefault"
          disabled={!saveButtonEnabled}
          onClick={() => {
            saveNumbers();
            // Add animation class
            const btn = document.getElementById('saveBtnDefaultID');
            if (btn) {
              btn.classList.add('saveBtnBackgroundAnimate');
              setTimeout(() => {
                btn.classList.remove('saveBtnBackgroundAnimate');
              }, 1000);
            }
          }}
          style={{
            opacity: saveButtonEnabled ? '1' : '0.25',
            filter: saveButtonEnabled ? 'grayscale(0)' : 'grayscale(1)'
          }}
        >
          Save
        </button>
      </div>
    </>
  );
} 