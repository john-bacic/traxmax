'use client';

import { useState, useEffect } from 'react';
import '@/styles/lotto/lotto.css';
import { lottoService } from '@/lib/supabase/lotto-service';
import { lottoMaxWinningNumbers2023 } from './data';

export default function LottoPage() {
  // State management exactly matching standalone
  const [activeNumbers, setActiveNumbers] = useState<Set<number>>(new Set());
  const [firstSevenToggled, setFirstSevenToggled] = useState<number[]>([]);
  const [additionalToggled, setAdditionalToggled] = useState<number[]>([]);
  const [notYetToggled, setNotYetToggled] = useState<number[]>(Array.from({ length: 50 }, (_, i) => i + 1));
  const [dataToShow, setDataToShow] = useState<any[]>([]);
  const [allDrawings, setAllDrawings] = useState<any[]>([]);
  const [activeLinkId, setActiveLinkId] = useState<string | null>('all');
  const [loading, setLoading] = useState(true);
  const [bottomSelectorsVisible, setBottomSelectorsVisible] = useState(false);
  const [showBelowToggled, setShowBelowToggled] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [frequencyData, setFrequencyData] = useState<any[]>([]);
  const [cascadeDisabled, setCascadeDisabled] = useState(false);
  const [manuallyToggledNumbers, setManuallyToggledNumbers] = useState<Set<number>>(new Set());
  const [specificNumbers, setSpecificNumbers] = useState<number[]>([]);
  const [isVerticalView, setIsVerticalView] = useState(false);
  const [previousDataToShow, setPreviousDataToShow] = useState<any[]>([]);
  const [wasActiveBeforeVertical, setWasActiveBeforeVertical] = useState(false);

  const colors: {[key: number]: string} = {};

  // Initialize colors for numbers 1-50 exactly like standalone
  const getColor = (number: number) => {
    if (colors[number]) return colors[number];
    const hue = 360 - (number - 1) * (360 / 50);
    colors[number] = `hsl(${hue}, 100%, 69%)`;
    return colors[number];
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Always use local data for consistency
        setAllDrawings(lottoMaxWinningNumbers2023);
        setDataToShow(lottoMaxWinningNumbers2023);
        
        // Initialize with latest draw selected
        setTimeout(() => {
            const bottomSelectors = document.querySelectorAll('.bottomSelector');
          if (bottomSelectors.length > 0 && lottoMaxWinningNumbers2023.length > 0) {
            // Toggle numbers from the latest draw
            const numbersToToggle = lottoMaxWinningNumbers2023[0].numbers;
            const newFirstSeven: number[] = [];
            const newAdditional: number[] = [];
            const newActiveNumbers = new Set<number>();
            
            numbersToToggle.forEach((number, idx) => {
              if (idx < 7) {
                newFirstSeven.push(number);
              } else {
                newAdditional.push(number);
              }
              newActiveNumbers.add(number);
            });
            
            setFirstSevenToggled(newFirstSeven);
            setAdditionalToggled(newAdditional);
            setActiveNumbers(newActiveNumbers);
            setNotYetToggled(Array.from({ length: 50 }, (_, i) => i + 1).filter(n => !newActiveNumbers.has(n)));
            
            // Mark first selector as on
            if (bottomSelectors[0]) {
              bottomSelectors[0].classList.add('on');
            }
            
            // Show draw details
            const drawDetails = document.querySelector('.drawDetails') as HTMLElement;
            if (drawDetails) {
              const detailsText = updateDrawDetails(0);
              if (detailsText) {
                drawDetails.innerHTML = detailsText;
                drawDetails.style.display = 'block';
              }
            }
            
            // Update all off button opacity
            updateAllOffButtonOpacity(newActiveNumbers);
            
            // Update draw details for the latest draw
            updateDrawDetails(0);
            setActiveIndex(0);
            
            // Grey out cascade button since 7 numbers are selected
            setTimeout(() => {
              greyedCascadeButton();
            }, 200);
            
            // Update all off button opacity
            updateAllOffButtonOpacity(newActiveNumbers);
          }
          
          // Hide saved navigation buttons
          const downSavedInit = document.getElementById('downSaved');
          const upSavedInit = document.getElementById('upSaved');
          if (downSavedInit) downSavedInit.style.display = 'none';
          if (upSavedInit) upSavedInit.style.display = 'none';
          
        }, 100);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);
  
  // Update button styles when activeNumbers changes
  useEffect(() => {
    // Update button appearances for all number buttons
    document.querySelectorAll('button[data-number]').forEach((button) => {
      const number = parseInt(button.getAttribute('data-number') || '0');
      const style = getButtonStyle(number);
      Object.assign((button as HTMLButtonElement).style, style);
    });
    
    // Update cascade button state based on number of selected numbers
    if (firstSevenToggled.length === 7) {
      greyedCascadeButton();
    } else if (firstSevenToggled.length < 7) {
      resetCascadeButton();
    }
    
    // Update save button state
    checkAndToggleSaveButtonState();
  }, [activeNumbers, firstSevenToggled, additionalToggled]);

  // Update frequency display when relevant state changes
  useEffect(() => {
    const activeLink = document.querySelector('#linkList a.on');
    if (activeLink && activeLink.id !== 'pairs') {
      const frequencyResults = document.getElementById('frequencyResults');
      if (frequencyResults && frequencyResults.style.display !== 'none') {
        displayMostFrequentNumbers();
      }
    }
  }, [dataToShow, activeNumbers]); // Removed showBelowToggled to prevent double render

  // Call updateSavedRowCount after component mounts
  useEffect(() => {
    if (!loading) {
      // Wait a bit to ensure DOM is ready
      setTimeout(() => {
        populateSavedNumbersFromLocalStorage();
        updateSavedRowCount();
        checkAndToggleSaveButtonState();
        
        // Add save button click handler
        // Save button click handler is now handled directly in JSX with onClick prop
        
        // Add lock/unlock button event listeners exactly like standalone
        const lockSavedButton = document.querySelector('.lockSaved') as HTMLElement;
        const unLockSavedButton = document.querySelector('.unLockSaved') as HTMLElement;
        
        if (lockSavedButton) {
          lockSavedButton.onclick = () => {
            saveLockSavedState(true);
            // Only update lock state, don't add more numbers
          };
        }
        
        if (unLockSavedButton) {
          unLockSavedButton.onclick = () => {
            saveLockSavedState(false);
            // Only update lock state, don't add more numbers
          };
        }
        
        // Set initial lock/unlock button visibility and bottom trigger state
        const isLocked = getLockSavedState();
        const savedNumbersDiv = document.getElementById('savedUmbersID');
        const table = savedNumbersDiv?.querySelector('table');
        const hasRows = table && table.rows.length > 0;
        
        // Get the actual container state - check if it was initialized as hidden
        const isContainerInitiallyHidden = savedNumbersDiv?.getAttribute('data-initialized') === 'true';
        const isContainerOpen = !isContainerInitiallyHidden && savedNumbersDiv?.style.display === 'flex';
        
        // Set initial bottom trigger (red grip icon) state - always visible by default unless container is explicitly open
        const bottomTrigger = document.querySelector('.bottomTrigger') as HTMLElement;
        if (bottomTrigger) {
          // Always show red grip icon by default (container should be closed on load)
          bottomTrigger.style.display = 'block';
        }
        
        // Green arrows for saved number navigation are handled by addEventListener below
        
        // Set initial red up/down button visibility
        const upButton = document.querySelector('.upButton') as HTMLElement;
        const downButton = document.querySelector('.downButton') as HTMLElement;
        
        // Bottom trigger (red grip) is already set to visible above
        
        // Red arrows are for winning number row navigation - show by default
        if (upButton) upButton.style.display = 'block';
        if (downButton) downButton.style.display = 'block';
        
        // Add event listeners for red arrows (winning number row navigation) exactly like standalone
        if (upButton) {
          upButton.addEventListener('click', toggleNumbersAndReverse);
        }
        
        if (downButton) {
          downButton.addEventListener('click', toggleNumbersAndAdvance);
        }
        
        // Add event listeners for green arrows (saved number navigation)
        // Use existing upSaved and downSaved variables declared at the top
        
        const upSavedElement = document.getElementById('upSaved');
        const downSavedElement = document.getElementById('downSaved');
        
        if (upSavedElement) {
          upSavedElement.addEventListener('click', () => {
            navigateSavedNumbers('up');
          });
        }
        
        if (downSavedElement) {
          downSavedElement.addEventListener('click', () => {
            navigateSavedNumbers('down');
          });
        }
        
        // Add event listeners for lock/unlock buttons
        const lockBtn = document.querySelector('.lockSaved') as HTMLElement;
        const unLockBtn = document.querySelector('.unLockSaved') as HTMLElement;
        
        if (lockBtn) {
          lockBtn.addEventListener('click', () => {
            // Clicking locked icon unlocks the numbers
            saveLockSavedState(false); // Unlock the saved numbers
            animateSavedNumbersTable('rightToLeft', 3); // Animate right to left when unlocking
          });
        }
        
        if (unLockBtn) {
          unLockBtn.addEventListener('click', () => {
            // Clicking unlocked icon locks the numbers
            saveLockSavedState(true); // Lock the saved numbers
            animateSavedNumbersTable('leftToRight', 3); // Animate left to right when locking
          });
        }
        
        // Lock/unlock buttons should NEVER be visible when container is closed
        // Only show them when container is open
        if (lockSavedButton) lockSavedButton.style.display = 'none';
        if (unLockSavedButton) unLockSavedButton.style.display = 'none';
      }, 150);
    }
  }, [loading]);

  // Generate 10x5 number grid exactly like standalone
  const generateNumberGrid = () => {
    const grid = [];
    for (let i = 0; i < 10; i++) {
      const row = [];
      for (let j = 1; j <= 5; j++) {
        const number = i * 5 + j;
        row.push(number);
      }
      grid.push(row);
    }
    return grid;
  };

  const numberGrid = generateNumberGrid();

  // Toggle number function exactly like standalone
  const toggleColor = (number: number) => {
    const newActiveNumbers = new Set(activeNumbers);
    const newFirstSeven = [...firstSevenToggled];
    const newAdditional = [...additionalToggled];
    const newNotYet = [...notYetToggled];
    
    const isActivated = newActiveNumbers.has(number);
    
    if (isActivated) {
      newActiveNumbers.delete(number);
    } else {
      newActiveNumbers.add(number);
    }
    
    updateToggleSequence(number, !isActivated, newFirstSeven, newAdditional, newNotYet);
    
    setActiveNumbers(newActiveNumbers);
    setFirstSevenToggled(newFirstSeven);
    setAdditionalToggled(newAdditional);
    setNotYetToggled(newNotYet);
    
    updateAllOffButtonOpacity(newActiveNumbers);
    
    // Check if manually toggled numbers match any complete draw
    checkForMatchingDrawIndex(newActiveNumbers);
    
    // Update red arrow visibility when numbers are toggled
    setTimeout(() => updateButtonVisibility(newActiveNumbers), 0);
  };

  // Update toggle sequence exactly like standalone
  const updateToggleSequence = (number: number, isActive: boolean, firstSeven: number[], additional: number[], notYet: number[]) => {
    const wasInFirstSeven = firstSeven.includes(number);
    const wasInAdditional = additional.includes(number);
    const indexInNotYetToggled = notYet.indexOf(number);

    if (isActive) {
      if (firstSeven.length < 7 && !wasInFirstSeven) {
        firstSeven.push(number);
        if (indexInNotYetToggled > -1) {
          notYet.splice(indexInNotYetToggled, 1);
        }
      } else if (!wasInFirstSeven && !wasInAdditional) {
        additional.push(number);
        if (indexInNotYetToggled > -1) {
          notYet.splice(indexInNotYetToggled, 1);
        }
      }
    } else {
      const indexInFirstSeven = firstSeven.indexOf(number);
      if (indexInFirstSeven > -1) {
        firstSeven.splice(indexInFirstSeven, 1);
        notYet.push(number);
        if (additional.length > 0) {
          const movedNumber = additional.shift();
          if (movedNumber) firstSeven.push(movedNumber);
        }
      } else {
        const indexInAdditional = additional.indexOf(number);
        if (indexInAdditional > -1) {
          additional.splice(indexInAdditional, 1);
          notYet.push(number);
        }
      }
    }
  };

  // Get button styling exactly like standalone
  const getButtonStyle = (number: number) => {
    if (firstSevenToggled.includes(number)) {
      return {
        backgroundColor: getColor(number),
        color: '#fff',
        textShadow: ''
      };
    } else if (additionalToggled.includes(number)) {
      return {
        backgroundColor: getColor(number),
        color: 'black',
        textShadow: 'none'
      };
    } else {
      if (firstSevenToggled.length === 7) {
        return {
          backgroundColor: '#1C1C1C',
          color: '#8A8A8A',
          textShadow: ''
        };
      } else {
        return {
          backgroundColor: 'rgb(36, 36, 36)',
          color: '',
          textShadow: ''
        };
      }
    }
  };

  // Toggle off all buttons exactly like standalone
  const toggleOffAllButtons = () => {
    setActiveNumbers(new Set());
    setFirstSevenToggled([]);
    setAdditionalToggled([]);
    setNotYetToggled(Array.from({ length: 50 }, (_, i) => i + 1));
    setActiveIndex(-1);
    setShowBelowToggled(false);
    
    // Turn off all bottom selectors
    document.querySelectorAll('.bottomSelector').forEach((selector) => {
      selector.classList.remove('on');
      selector.classList.add('off');
    });
    
    // Hide draw details when all buttons are turned off
    updateDrawDetails(-1);
    
    updateAllOffButtonOpacity(new Set());
    
    // Update red arrow visibility when all buttons are turned off
    setTimeout(() => updateButtonVisibility(new Set()), 0);
  };

  // Update all off button opacity exactly like standalone
  const updateAllOffButtonOpacity = (activeNums: Set<number>) => {
    const allOffButton = document.getElementById('allOff');
    if (allOffButton) {
      console.log(`Updating allOff button - activeNums.size: ${activeNums.size}`);
      // Always keep the button in enabled state - it should always be available
      allOffButton.style.setProperty('opacity', '1', 'important');
      allOffButton.style.setProperty('filter', 'grayscale(0)', 'important');
      console.log('AllOff button kept in enabled state');
    } else {
      console.log('AllOff button element not found');
    }
  };

  // Get frequency of each number for a given subset of draws
  const getNumberFrequencies = (drawsSubset: any[]) => {
    const frequencies: {[key: number]: number} = {};
    drawsSubset.forEach((draw) => {
      // Handle both database format (numbers array) and local format (numbers array)
      const numbers = draw.numbers || [];
      numbers.forEach((number: number) => {
        frequencies[number] = (frequencies[number] || 0) + 1;
      });
    });
    return frequencies;
  };

  // Display selected numbers in the 7 boxes exactly like standalone
  const displaySelectedNumbers = () => {
    const sortedFirstSeven = [...firstSevenToggled].sort((a, b) => a - b);
    const frequencies = getNumberFrequencies(dataToShow);
    const isLinkActive = document.querySelector('#linkList a.on') !== null;
    
    return Array.from({length: 7}, (_, i) => {
      const number = sortedFirstSeven[i];
      const frequency = number && isLinkActive ? frequencies[number] || 0 : 0;
      
      return (
        <div 
          key={i} 
          className="chosen_number_box"
          style={{
            borderColor: number ? getColor(number) : ''
          }}
        >
          <div 
            className="chosen_number"
            style={{
              color: number ? '#fff' : '#242424'
            }}
          >
            {number || '•'}
          </div> 
          <div className="frequency">
            {number && isLinkActive ? `${frequency}x` : '  '}
          </div>
        </div>
      );
    });
  };

  // Handle link list clicks exactly like standalone
  const handleLinkClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const clickedLink = event.currentTarget;
    const isActive = clickedLink.classList.contains('on');
    
    // Remove 'on' class from all links
    document.querySelectorAll('#linkList a').forEach(link => {
      link.classList.remove('on');
    });
    
    const frequencyResults = document.getElementById('frequencyResults');
    const pairFrequency = document.getElementById('pairFrequency');
    
    if (isActive) {
      // If clicking on already active link, turn it off
      if (frequencyResults) frequencyResults.style.display = 'none';
      if (pairFrequency) pairFrequency.style.display = 'none';
      
      // Show all data when no link is active
      setDataToShow([...lottoMaxWinningNumbers2023]);
      setActiveLinkId(null);
      
    } else {
      clickedLink.classList.add('on');
      
      // Get data-rows value exactly like standalone
      const dataRows = clickedLink.getAttribute('data-rows');
      const linkText = clickedLink.textContent || '';
      
      let rowCount: number;
      if (dataRows === 'all') {
        rowCount = lottoMaxWinningNumbers2023.length;
      } else {
        rowCount = parseInt(dataRows || '0', 10);
      }
      
      // Slice data exactly like standalone: slice(0, rowCount)
      const newDataToShow = lottoMaxWinningNumbers2023.slice(0, rowCount);
      
      console.log(`Selected ${linkText} tab, showing ${rowCount} rows`);
      
      setDataToShow(newDataToShow);
      setActiveLinkId(linkText);
      
      // Show/hide frequency displays based on link
      if (clickedLink.id === 'pairs') {
        if (pairFrequency) {
          pairFrequency.style.display = 'block';
          // Call displayPairsInDifferentDraws immediately
          displayPairsInDifferentDraws();
        }
        if (frequencyResults) frequencyResults.style.display = 'none';
      } else {
        if (frequencyResults) {
          frequencyResults.style.display = 'block';
          // Call displayMostFrequentNumbers immediately
          displayMostFrequentNumbers();
        }
        if (pairFrequency) pairFrequency.style.display = 'none';
      }
    }
    
    // Update frequency display in the 7 boxes
    const frequencies = getNumberFrequencies(dataToShow);
    const chosenNumberElements = document.querySelectorAll('.selectedNumbersRow .frequency');
    firstSevenToggled.forEach((num, index) => {
      if (chosenNumberElements[index]) {
        const freq = frequencies[num] || 0;
        (chosenNumberElements[index] as HTMLElement).textContent = clickedLink && !isActive ? `${freq}x` : '  ';
      }
    });
  };
  
  // Display most frequent numbers exactly like standalone
  const displayMostFrequentNumbers = () => {
    // Get currently selected tab
    const activeTimeLink = document.querySelector('#linkList a.on');
    
    // Get the tab name and rows for the active tab (8d, 13d, 21d, etc.)
    const activeTabName = activeTimeLink ? activeTimeLink.textContent : '';
    const activeTabRows = activeTimeLink
      ? activeTimeLink.getAttribute('data-rows') === 'all'
        ? lottoMaxWinningNumbers2023.length
        : parseInt(activeTimeLink.getAttribute('data-rows') || '0', 10)
      : lottoMaxWinningNumbers2023.length;
    
    // Find if a specific row is toggled on in the winning numbers
    const activeSelector = document.querySelector('.bottomSelector.on');
    const activeIndex = activeSelector
      ? Array.from(document.querySelectorAll('.bottomSelector')).indexOf(activeSelector)
      : -1;
    
    // Create a separate variable for frequency calculation
    let frequencyData: any[] = [];
    
    // If no row is toggled (activeIndex === -1), ignore the checkbox state and use all data
    if (activeIndex === -1) {
      frequencyData = [...dataToShow];
      console.log(`No row toggled: Using all ${frequencyData.length} draws from ${activeTabName} tab regardless of checkbox`);
    } else if (!showBelowToggled) {
      // When checkbox is NOT checked, use all data from the current tab view
      frequencyData = [...dataToShow];
      console.log(`Checkbox OFF: Using all ${frequencyData.length} draws from ${activeTabName} tab`);
    } else if (showBelowToggled && activeIndex !== -1) {
      // When checkbox IS checked, calculate draws below the selected row
      const bottomSelectorTitle = activeSelector?.textContent;
      const bottomSelectors = document.querySelectorAll('.bottomSelector');
      const numBottomSelectors = bottomSelectors.length;
      
      // Get the total number of rows for each tab
      let totalRows = 0;
      switch (activeTabName) {
        case '8d':
          totalRows = 8;
          break;
        case '13d':
          totalRows = 13;
          break;
        case '21d':
          totalRows = 21;
          break;
        case '34d':
          totalRows = 34;
          break;
        case '55d':
          totalRows = 55;
          break;
        case 'all':
        case '245d':
          totalRows = lottoMaxWinningNumbers2023.length;
          break;
        default:
          totalRows = 21; // Default to 21 if no tab selected
      }
      
      // If we're in 21d tab, handle calculation specifically
      if (activeTabName === '21d') {
        console.log(`21d TAB - DETAILED DEBUG: Row ${activeIndex + 1} selected, data length=${totalRows}, numBottomSelectors=${numBottomSelectors}`);
        
        // SPECIFIC HANDLING FOR 15TH ROW (LAST VISIBLE SELECTOR)
        if (activeIndex === numBottomSelectors - 1) {
          // If 15th row (index 14) is selected
          console.log(`21d TAB - 15TH ROW SPECIFIC HANDLING`);
          
          // When 15th selector is selected, we should have 6 draws below it (21 - 15 = 6)
          frequencyData = [];
          
          // Manually copy the draws to ensure we get exactly what we need
          for (let i = 15; i < 21; i++) {
            if (i < lottoMaxWinningNumbers2023.length) {
              frequencyData.push(lottoMaxWinningNumbers2023[i]);
            }
          }
          
          console.log(`21d TAB - 15TH ROW: Using exactly ${frequencyData.length} draws below (should be 6)`);
    } else {
          // For other rows in 21d tab
          const drawsBelow = totalRows - (activeIndex + 1);
          console.log(`21d TAB - Expected draws below: ${drawsBelow}`);
          
          if (drawsBelow <= 0) {
            frequencyData = [];
            console.log(`21d TAB - ROW ${activeIndex + 1}: NO DRAWS BELOW`);
          } else {
            // CRITICAL FIX: For 5 or fewer rows remaining, use a different approach
            if (drawsBelow <= 5) {
              console.log(`21d TAB - SPECIAL HANDLING FOR ≤5 DRAWS: Using hardcoded range`);
              
              frequencyData = [];
              const startDrawIndex = activeIndex + 1;
              
              for (let i = startDrawIndex; i < totalRows && i < lottoMaxWinningNumbers2023.length; i++) {
                frequencyData.push(lottoMaxWinningNumbers2023[i]);
              }
              
              console.log(`21d TAB - ROW ${activeIndex + 1}: DIRECT COPY - ${frequencyData.length} draws (should be ${drawsBelow})`);
            } else {
              // For more than 5 draws, use the normal approach
              const tabData = lottoMaxWinningNumbers2023.slice(0, totalRows);
              frequencyData = tabData.slice(activeIndex + 1);
              console.log(`21d TAB - ROW ${activeIndex + 1}: Using ${frequencyData.length} draws below (normal method)`);
            }
          }
        }
      } else {
        // For other tabs, calculate draws below normally
        const drawsBelow = totalRows - (activeIndex + 1);
        
        if (drawsBelow <= 0) {
          frequencyData = [];
          console.log(`${activeTabName} TAB - ROW ${activeIndex + 1}: NO DRAWS BELOW`);
        } else {
          // Get data for this tab and take draws below selected row
          const tabData = lottoMaxWinningNumbers2023.slice(0, totalRows);
          frequencyData = tabData.slice(activeIndex + 1);
          console.log(`${activeTabName} TAB - ROW ${activeIndex + 1}: Using ${frequencyData.length} draws below (should be ${drawsBelow})`);
        }
      }
    }
    
    // Calculate frequencies using our frequency data
    const frequencies = getNumberFrequencies(frequencyData);
    const frequencyThreshold = getFrequencyThresholdForDisplay();
    
    // Update specificNumbers for cascade button
    const newSpecificNumbers: number[] = [];
    
    // Group numbers by frequency
    const frequencyGroups: {[key: number]: number[]} = {};
    for (let number = 1; number <= 50; number++) {
      const freq = frequencies[number] || 0;
      if (!frequencyGroups[freq]) {
        frequencyGroups[freq] = [];
      }
      frequencyGroups[freq].push(number);
    }
    
    // When Below Toggled is enabled, fill specificNumbers with all numbers
    if (showBelowToggled) {
      // Fill specificNumbers with all numbers that have a frequency > 0
      for (const freq in frequencyGroups) {
        const numbers = frequencyGroups[freq];
        const frequency = parseInt(freq, 10);
        
        // Add each number to specificNumbers multiple times according to its frequency
        numbers.forEach((num) => {
          for (let i = 0; i < frequency; i++) {
            newSpecificNumbers.push(num);
          }
        });
      }
      
      // Find numbers with 0 frequency and add them to specificNumbers
      const allNumbers = Array.from({ length: 50 }, (_, i) => i + 1);
      const zeroFrequencyNumbers = allNumbers.filter((num) => !frequencies[num]);
      newSpecificNumbers.push(...zeroFrequencyNumbers);
      
      // Ensures specificNumbers always has all 50 numbers
      if (newSpecificNumbers.length === 0) {
        newSpecificNumbers.push(...Array.from({ length: 50 }, (_, i) => i + 1));
      }
    }
    
    // Build the title section with checkbox and count indicator
    let titleHTML = '<div style="display: flex; align-items: flex-end; margin-bottom: 5px; justify-content: space-between;">' +
      '<div style="display: flex; align-items: center;">' +
      '<span style="margin-right: 8px;">number frequency</span>';
    
    // Only show "below toggled" checkbox when a row is toggled
    if (activeIndex !== -1) {
      titleHTML += '<div style="display: flex; align-items: center;">' +
        '<input type="checkbox" id="frequencyCheckbox" style="cursor: pointer; margin: 0 4px 0 0;">' +
        '<label for="frequencyCheckbox" style="cursor: pointer; font-size: 0.8em; display: flex; align-items: center;">below toggled';
      
      // Add count indicator right after "below toggled" text
      if (showBelowToggled) {
        const tabName = activeTimeLink ? activeTimeLink.textContent : '';
        titleHTML += `<span style="margin-left: 4px; font-size: 1em; color: #009EBA;" title="Using ${frequencyData.length} draws below the selected row in the ${tabName} view">(${frequencyData.length} draws)</span>`;
      }
      
      titleHTML += '</label></div>';
    }
    
    titleHTML += '</div>' +
      '<span></span>' + // Keep empty span for layout stability
      '</div>';
    
    // Update the results container
    const resultsContainer = document.getElementById('frequencyResults');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = titleHTML + '<table class="frequency-table"></table>';
    const table = resultsContainer.querySelector('table');
    if (!table) return;
    
    // Add event listener to the checkbox and set its initial state
    const frequencyCheckbox = document.getElementById('frequencyCheckbox') as HTMLInputElement;
    if (frequencyCheckbox) {
      frequencyCheckbox.checked = showBelowToggled;
      frequencyCheckbox.addEventListener('change', function () {
        setShowBelowToggled(this.checked);
        // Preserve the current active row selection when toggling the checkbox
        displayMostFrequentNumbers();
      });
    }
    
    // Sort groups by frequency and then display
    Object.keys(frequencyGroups)
      .sort((a, b) => parseInt(b) - parseInt(a))
      .forEach((freq) => {
        const freqNum = parseInt(freq);
        const row = table.insertRow();
        const frequencyCell = row.insertCell();
        frequencyCell.textContent = `${freq}x: `;
        
        const numbersCell = row.insertCell();
        
        // Add numbers with frequency equal to or more than the threshold to specificNumbers array
        if (!showBelowToggled && freqNum >= frequencyThreshold) {
          newSpecificNumbers.push(...frequencyGroups[freqNum].map(Number));
        }
        
        // Create spans for each number exactly like standalone
        const numberSpans = frequencyGroups[freqNum].map(number => {
          const isActive = activeNumbers.has(number);
          const paddingStyle = number <= 9 ? '2px 8px' : '2px 4px';
          const textColor = 'black';
          
          if (isActive) {
            return `<span style="background-color: ${getColor(number)}; color: ${textColor}; padding: ${paddingStyle}; border-radius: 25%;">${number}</span>`;
          } else {
            return `<span>${number}</span>`;
          }
        });
        
        numbersCell.innerHTML = numberSpans.join(' ∘ ');
    });
    
    // Find numbers with 0 frequency
    const allNumbers = Array.from({ length: 50 }, (_, i) => i + 1);
    const zeroFrequencyNumbers = allNumbers.filter((num) => !frequencies[num]);
    
    // Only show the 0x row if there are numbers with 0 frequency
    if (zeroFrequencyNumbers.length > 0) {
      const row = table.insertRow();
      const frequencyCell = row.insertCell();
      frequencyCell.textContent = '0x: ';
      const numbersCell = row.insertCell();
      
      const zeroSpans = zeroFrequencyNumbers.map(number => {
        const isActive = activeNumbers.has(number);
        const paddingStyle = number <= 9 ? '2px 8px' : '2px 4px';
        const textColor = 'black';
        
        if (isActive) {
          return `<span style="background-color: ${getColor(number)}; color: ${textColor}; padding: ${paddingStyle}; border-radius: 25%;">${number}</span>`;
        } else {
          return `<span style="color:#ff69b4">${number}</span>`;
        }
      });
      
      numbersCell.innerHTML = zeroSpans.join(' ∘ ');
    }
    
    // Update the state with the new specificNumbers
    setSpecificNumbers(newSpecificNumbers);
  };
  
  // Helper function for frequency threshold
  const getFrequencyThresholdForDisplay = () => {
    const linkButtonOnElement = document.querySelector('#linkList a.on');
    const dataRows = linkButtonOnElement
      ? linkButtonOnElement.getAttribute('data-rows')
      : 'all';
    
    // Always return 0 for all tabs when Below Toggled is checked
    if (showBelowToggled) {
      return 0;
    }
    
    // Default behavior for when Below Toggled is not checked
    if (dataRows !== 'all') {
      const rowCount = parseInt(dataRows || '0', 10);
      switch (rowCount) {
        case 8:
        case 13:
        case 21:
          return 0;
        case 34:
          return 3;
        case 55:
          return 5;
        default:
          return 13;
      }
    }
    return 0; // Default to 0 if 'all' is selected
  };
  
  // Display pairs in different draws exactly like standalone
  const displayPairsInDifferentDraws = () => {
    const pairFrequency = document.getElementById('pairFrequency');
    if (!pairFrequency) return;
    
    const combinedToggled = [...firstSevenToggled, ...additionalToggled];
    
    if (combinedToggled.length === 0) {
      pairFrequency.innerHTML = '<div>selected pairs</div>';
      return;
    }
    
    // Calculate pair occurrences
    let pairOccurrences: {[key: string]: Set<string>} = {};
    
    lottoMaxWinningNumbers2023.forEach((draw) => {
      draw.numbers.forEach((num1: number, i: number) => {
        draw.numbers.slice(i + 1).forEach((num2: number) => {
          let pair = [num1, num2].sort((a, b) => a - b).join(' + ');
          if (!pairOccurrences[pair]) {
            pairOccurrences[pair] = new Set();
          }
          pairOccurrences[pair].add(draw.date);
        });
      });
    });
    
    let html = 'selected pairs<table>';
    
    if (combinedToggled.length === 1) {
      // Single number selected - show all pairs with that number
      const selectedNumber = combinedToggled[0];
      let pairFreqs: {[key: number]: number[][]} = {};
      
      for (let pair in pairOccurrences) {
        const [num1, num2] = pair.split(' + ').map(Number);
        if (num1 === selectedNumber || num2 === selectedNumber) {
          const other = num1 === selectedNumber ? num2 : num1;
          const freq = pairOccurrences[pair].size;
          if (!pairFreqs[freq]) pairFreqs[freq] = [];
          pairFreqs[freq].push([selectedNumber, other]);
        }
      }
      
      const sortedFrequencies = Object.keys(pairFreqs).map(Number).sort((a, b) => b - a);
      
      sortedFrequencies.forEach(freq => {
        html += '<tr>';
        html += `<td>${freq}x:</td>`;
        html += '<td>';
        
        pairFreqs[freq].forEach(([num1, num2], index) => {
          if (index > 0) html += ' &nbsp; ';
          const style1 = `background-color: ${getColor(num1)}; color: black; border-radius: 4px; padding: 0 .25rem;`;
          html += `<span style="white-space: nowrap;"><span style="${style1}">${num1}</span> <span style="color:#009eba;">+</span> <span style="color:#009eba;">${num2}</span></span>`;
        });
        
        html += '</td>';
        html += '</tr>';
      });
    } else {
      // Multiple numbers selected
      const toggledPairs = new Set<string>();
      combinedToggled.forEach((num1, i) => {
        combinedToggled.slice(i + 1).forEach(num2 => {
          toggledPairs.add([num1, num2].sort((a, b) => a - b).join(' + '));
        });
      });
      
      let frequencies: {[key: number]: string[]} = {};
      Object.entries(pairOccurrences).forEach(([pair, dates]) => {
        if (toggledPairs.has(pair)) {
          let freq = dates.size;
          if (!frequencies[freq]) frequencies[freq] = [];
          frequencies[freq].push(pair);
        }
      });
      
      const sortedFrequencies = Object.keys(frequencies).map(Number).sort((a, b) => b - a);
      
      sortedFrequencies.forEach(freq => {
        html += '<tr>';
        html += `<td>${freq}x:</td>`;
        html += '<td>';
        
        frequencies[freq].forEach((pair, index) => {
          if (index > 0) html += ' &nbsp; ';
          const [num1, num2] = pair.split(' + ').map(Number);
          html += `<span style="white-space: nowrap;"><span>${num1}</span> + <span>${num2}</span></span>`;
        });
        
        html += '</td>';
        html += '</tr>';
      });
    }
    
    html += '</table>';
    pairFrequency.innerHTML = html;
  };
  
  // Helper function to reduce a number to a single digit
  const reduceToSingleDigit = (num: number): number => {
    while (num > 9) {
      num = num
        .toString()
        .split('')
        .reduce((acc, digit) => acc + parseInt(digit), 0);
    }
    return num;
  };

  // Calculate and display sum exactly like standalone
  const calculateAndDisplaySum = () => {
    const combinedArray = [...firstSevenToggled, ...additionalToggled];
    
    if (combinedArray.length >= 2) {
      const sum = combinedArray.reduce((acc, val) => acc + val, 0);
      const numerologySum = reduceToSingleDigit(sum);
      return `sum: ${sum} :${numerologySum}`;
    }
    
    return '';
  };
  
  // Update draw details exactly like standalone  
  const updateDrawDetails = (drawIndex: number) => {
    const drawDetailsElement = document.querySelector('.drawDetails') as HTMLElement;
    if (!drawDetailsElement) return null;
    
    if (drawIndex < 0 || drawIndex >= lottoMaxWinningNumbers2023.length) {
      drawDetailsElement.style.display = 'none';
      return null;
    }
    
    const drawDetails = lottoMaxWinningNumbers2023[drawIndex];
    let drawDate = drawDetails.date;
    
    // Process the date exactly like standalone
    const monthMap: {[key: string]: number} = {
      January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
      July: 7, August: 8, September: 9, October: 10, November: 11, December: 12
    };
    
    const dateParts = drawDate.split(' ');
    const month = monthMap[dateParts[0]].toString().padStart(2, '0');
    const day = dateParts[1].slice(0, -1).padStart(2, '0');
    const year = dateParts[2].slice(-2);
    
    drawDate = `${day}.${month}.${year}`;
    const jackpot = `$${drawDetails.jackpot / 1000000} million`;
    
    const formattedDetails = `${drawDate} ~ ${jackpot}`;
    drawDetailsElement.textContent = formattedDetails;
    drawDetailsElement.style.display = 'block';
    
    return formattedDetails;
  };
  
  // Check if all numbers from a draw are toggled
  const areAllNumbersFromDrawToggledOn = (drawIndex: number) => {
    if (drawIndex < 0 || drawIndex >= lottoMaxWinningNumbers2023.length) {
      return false;
    }
    
    const drawNumbers = lottoMaxWinningNumbers2023[drawIndex].numbers;
    return drawNumbers.every((number: number) => activeNumbers.has(number));
  };
  
  // Handle bottom selector clicks exactly like standalone
  const handleBottomSelectorClick = (index: number) => {
    const clickedSelector = document.querySelectorAll('.bottomSelector')[index];
    const isCurrentlyOn = clickedSelector?.classList.contains('on');
    
    if (isCurrentlyOn) {
      // If currently on, turn off
      clickedSelector.classList.remove('on');
      clickedSelector.classList.add('off');
      
      // Clear selections
      setFirstSevenToggled([]);
      setAdditionalToggled([]);
      setActiveNumbers(new Set());
      setNotYetToggled(Array.from({ length: 50 }, (_, i) => i + 1));
      setActiveIndex(-1);
      setShowBelowToggled(false);
      
      // Update allOff button to disabled state when row is toggled off
      updateAllOffButtonOpacity(new Set());
      
      // Hide draw details
      updateDrawDetails(-1);
      
      // Update button visibility after hiding draw details
      setTimeout(() => updateButtonVisibility(), 0);
      
    } else {
      // Turn off all other selectors
      document.querySelectorAll('.bottomSelector').forEach((el) => el.classList.remove('on'));
      
      // Turn on clicked selector
      clickedSelector.classList.remove('off');
      clickedSelector.classList.add('on');
      
      // Set active index for frequency calculations
      setActiveIndex(index);
      // Don't automatically set showBelowToggled - let the checkbox control it
      
      // Toggle numbers from this draw
      toggleNumbersFromDraw(index);
      updateDrawDetails(index);
      
      // Grey out cascade button when a bottom selector is active
      greyedCascadeButton();
      
      // Update button visibility after showing draw details
      setTimeout(() => updateButtonVisibility(), 0);
    }
  };
  
  // Toggle numbers from a specific draw
  const toggleNumbersFromDraw = (drawIndex: number) => {
    if (drawIndex < 0 || drawIndex >= dataToShow.length) {
      return;
    }
    
    const numbersToToggle = dataToShow[drawIndex].numbers;
    const newFirstSeven: number[] = [];
    const newAdditional: number[] = [];
    const newActiveNumbers = new Set<number>();
    
    numbersToToggle.forEach((number: number, idx: number) => {
      if (idx < 7) {
        newFirstSeven.push(number);
      } else {
        newAdditional.push(number);
      }
      newActiveNumbers.add(number);
    });
    
    setFirstSevenToggled(newFirstSeven);
    setAdditionalToggled(newAdditional);
    setActiveNumbers(newActiveNumbers);
    setNotYetToggled(Array.from({ length: 50 }, (_, i) => i + 1).filter(n => !newActiveNumbers.has(n)));
    
    // Update allOff button state when numbers are toggled from a draw
    updateAllOffButtonOpacity(newActiveNumbers);
  };

  // Function to check if manually toggled numbers match any draw exactly like standalone
  const checkForMatchingDrawIndex = (numbersToCheck: Set<number> = activeNumbers) => {
    console.log(`Checking for matches with numbers: [${Array.from(numbersToCheck).sort((a,b) => a-b).join(', ')}]`);
    
    // Check each draw to see if all of its first 7 numbers are toggled on
    for (let index = 0; index < dataToShow.length; index++) {
      // Get only the first 7 numbers from the draw (exclude bonus number)
      const drawNumbers = dataToShow[index].numbers.slice(0, 7);
      
      // Check if ALL of the draw's first 7 numbers are in the numbersToCheck set
      const isMatch = drawNumbers.every((number: number) => numbersToCheck.has(number));
      
      if (index < 3) { // Log first few draws for debugging
        console.log(`Draw ${index}: [${drawNumbers.join(', ')}] - Match: ${isMatch}`);
      }

      if (isMatch && drawNumbers.length === 7) {
        console.log(`Matching draw found for index: ${index} (all first 7 numbers are toggled)`);
        
        // Update draw details for the matched index
        updateDrawDetails(index);
        
        // Set the active index state
        setActiveIndex(index);
        
        // Turn on the corresponding bottom selector if it exists (first 15)
        if (index < 15) {
          document.querySelectorAll('.bottomSelector').forEach((el, i) => {
            if (i === index) {
              el.classList.add('on');
              el.classList.remove('off');
            } else {
              el.classList.remove('on');
              el.classList.add('off');
            }
          });
        } else {
          // For draws beyond first 15, turn off all bottom selectors
          document.querySelectorAll('.bottomSelector').forEach((el) => {
            el.classList.remove('on');
            el.classList.add('off');
          });
        }
        
        // Update button visibility to show red arrows
        setTimeout(() => updateButtonVisibility(), 50);
        return;
      }
    }
    
    // No match found - hide draw details and turn off selectors
    console.log('No matching draw found (no draw has all first 7 numbers toggled).');
    updateDrawDetails(-1);
    setActiveIndex(-1);
    
    // Turn off all bottom selectors
    document.querySelectorAll('.bottomSelector').forEach((el) => {
      el.classList.remove('on');
      el.classList.add('off');
    });
    
    // Update button visibility to hide red arrows
    setTimeout(() => updateButtonVisibility(), 50);
  };
  
  // Enhanced cascade button functionality exactly like standalone
  const handleCascadeClick = () => {
    if (firstSevenToggled.length >= 7 || cascadeDisabled) return;
    
    setCascadeDisabled(true);
    
    // Clear all numbers first
    toggleOffAllButtons();
    
    // Re-toggle manually toggled numbers
    reToggleManuallyToggledNumbers();
    
    // Show spinner animation
    displaySpinnerAndChangeText();
    
    // Generate random color
    const colorSpectrum = generateColorSpectrum(1);
    
    // Animate buttons
    toggleRandomSevenButtons(colorSpectrum);
  };
  
  const generateColorSpectrum = (steps: number) => {
    const spectrum = [];
    for (let i = 0; i < steps; i++) {
      const hue = Math.floor(Math.random() * 360);
      spectrum.push(`hsl(${hue}, 100%, 65%)`);
    }
    return spectrum;
  };
  
  const displaySpinnerAndChangeText = () => {
    const cascadeButton = document.querySelector('.cascadeButton') as HTMLButtonElement;
    if (cascadeButton) {
      cascadeButton.innerHTML = `
        <svg data-role="spinner" width="25" height="25" viewBox="0 0 25 25" fill="${firstSevenToggled.length >= 7 ? 'rgb(138, 138, 138)' : '#cf0'}" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.15957 17.3803C0.159569 19.3614 1.60684 21.1139 3.43497 21.5711C3.81583 23.476 5.72014 24.9237 7.62444 24.8475C8.8432 24.8475 9.90961 24.3903 10.6713 23.6284C11.4331 22.8664 11.9663 21.7235 11.8901 20.5805V14.1801C11.8901 13.8753 11.8139 13.6467 11.5854 13.4182C11.3569 13.1896 11.1284 13.1134 10.8237 13.1134H4.42521C3.20646 13.1134 2.14005 13.5706 1.37833 14.3325C0.616603 15.0945 0.0833975 16.2374 0.15957 17.3803Z" />
          <path d="M13.2611 4.27517V10.6756C13.2611 11.2851 13.7181 11.7423 14.3275 11.7423H20.7259C21.9447 11.7423 23.0111 11.2851 23.7728 10.5232C24.5346 9.76124 25.0678 8.61831 24.9916 7.47538C24.9916 5.49429 23.5443 3.7418 21.7162 3.28463C21.5638 2.52267 21.1068 1.76072 20.5736 1.22735C19.7357 0.389197 18.6693 -0.0679753 17.5267 0.0082202C16.308 0.0082202 15.2416 0.465393 14.4798 1.22735C13.7181 1.9893 13.1849 3.13223 13.2611 4.27517Z" />
          <path d="M13.1851 14.2564V20.6569C13.1851 22.9427 15.1656 24.9238 17.5269 25C18.7457 25 19.8121 24.5428 20.5738 23.7809C21.1832 23.1713 21.564 22.4855 21.7164 21.7236C22.4781 21.5712 23.2398 21.114 23.773 20.5807C24.6109 19.7425 25.068 18.6758 24.9918 17.5328C24.9918 16.3137 24.5347 15.247 23.773 14.485C23.0113 13.7231 21.8687 13.1897 20.7261 13.2659H14.3277C14.023 13.2659 13.7945 13.3421 13.566 13.5707C13.3374 13.7993 13.1851 13.9517 13.1851 14.2564Z" />
          <path d="M1.22697 4.42795C0.389079 5.2661 -0.0679545 6.33283 0.0082177 7.47576C0.0082178 9.91402 1.91252 11.8189 4.35003 11.8189H10.7485C11.3579 11.8189 11.8149 11.3617 11.8149 10.7522V4.35175C11.8149 3.13262 11.3579 2.06588 10.5962 1.30393C9.83443 0.541976 8.76802 0.084804 7.54926 0.084804C6.33051 0.0848039 5.2641 0.541977 4.50238 1.30393C3.893 1.9135 3.51214 2.59925 3.35979 3.36121C2.5219 3.4374 1.76018 3.89458 1.22697 4.42795Z" />
        </svg>`;
    }
    
    // Show spacer if frequency results are visible
    const frequencyResultsDiv = document.getElementById('frequencyResults');
    const randSpacerDiv = document.querySelector('.forRandSpacer') as HTMLElement;
    if (frequencyResultsDiv && randSpacerDiv && 
        window.getComputedStyle(frequencyResultsDiv).display === 'block' && 
        manuallyToggledNumbers.size === 0) {
      randSpacerDiv.style.display = 'block';
      setTimeout(() => {
        randSpacerDiv.style.display = 'none';
      }, 900);
    }
  };
  
  const toggleRandomSevenButtons = (colorSpectrum: string[]) => {
    const totalNumbers = 50;
    const maxColorChanges = 2;
    let animatedButtons = 0;
    const numbers = Array.from({ length: totalNumbers }, (_, i) => i + 1);
    const shuffledNumbers = shuffleArray(numbers);
    
    shuffledNumbers.forEach((number, index) => {
      setTimeout(() => {
        if (!manuallyToggledNumbers.has(number)) {
          const button = document.querySelector(`#selectorContainerID button[data-number="${number}"]`) as HTMLButtonElement;
          if (button) {
            let colorIndex = 0;
            const originalBackgroundColor = button.style.backgroundColor;
            const originalTextColor = button.style.color;
            
            const interval = setInterval(() => {
              button.style.backgroundColor = colorSpectrum[colorIndex % colorSpectrum.length];
              button.style.color = '#242424';
              button.style.textShadow = 'none';
              colorIndex++;
              
              if (colorIndex >= maxColorChanges) {
                clearInterval(interval);
                button.style.backgroundColor = originalBackgroundColor;
                button.style.color = originalTextColor;
                animatedButtons++;
                
                if (animatedButtons === totalNumbers - manuallyToggledNumbers.size) {
                  shuffleAndToggleSevenRandomButtons();
                }
              }
            }, 200);
          }
        }
      }, index * 10);
    });
  };
  
  const shuffleArray = (array: number[]) => {
    const arr = [...array];
    let currentIndex = arr.length;
    let randomIndex;
    
    while (currentIndex !== 0) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
      [arr[currentIndex], arr[randomIndex]] = [arr[randomIndex], arr[currentIndex]];
    }
    
    return arr;
  };
  
  const shuffleAndToggleSevenRandomButtons = () => {
    const numbersNeeded = 7 - firstSevenToggled.length;
    if (numbersNeeded <= 0) return;
    
    // Use frequency-based selection when a frequency tab is active
    let availableNumbers = [...specificNumbers];
    
    // If specificNumbers is empty or too small due to frequency thresholds,
    // fall back to notYetToggled
    if (availableNumbers.length === 0 || showBelowToggled) {
      // Fall back to all numbers if we don't have enough in specificNumbers
      availableNumbers = [...notYetToggled];
    }
    
    // Filter out manually toggled numbers
    availableNumbers = availableNumbers.filter(num => !manuallyToggledNumbers.has(num));
    
    if (availableNumbers.length === 0) {
      console.log('No available numbers to select');
      resetCascadeButton();
      setCascadeDisabled(false);
      return;
    }
    
    const selectedNumbers: number[] = [];
    
    for (let i = 0; i < numbersNeeded && availableNumbers.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * availableNumbers.length);
      const selectedNumber = availableNumbers[randomIndex];
      selectedNumbers.push(selectedNumber);
      
      // Remove all instances of this number from availableNumbers
      availableNumbers = availableNumbers.filter(num => num !== selectedNumber);
    }
    
    // Toggle the selected numbers
    selectedNumbers.forEach(number => {
      const button = document.querySelector(`#selectorContainerID button[data-number="${number}"]`) as HTMLButtonElement;
      if (button && !button.classList.contains('toggled-on')) {
        toggleColor(number);
      }
    });
    
    // Reset cascade button after animation
    setTimeout(() => {
      resetCascadeButton();
      setCascadeDisabled(false);
    }, 100);
  };
  
  const getFrequencyThreshold = () => {
    const linkText = activeLinkId;
    switch (linkText) {
      case '8d': return 3;
      case '13d': return 4;
      case '21d': return 6;
      case '34d': return 9;
      case '55d': return 14;
      case 'all': return Math.floor(dataToShow.length * 0.23);
      default: return 0;
    }
  };
  
  const reToggleManuallyToggledNumbers = () => {
    manuallyToggledNumbers.forEach(number => {
      const button = document.querySelector(`#selectorContainerID button[data-number="${number}"]`) as HTMLButtonElement;
      if (button) {
        if (!activeNumbers.has(number)) {
          toggleColor(number);
        }
        button.style.outline = '3px solid #000';
        button.style.outlineOffset = '-5px';
        button.style.color = 'white';
      }
    });
  };
  
  const resetCascadeButton = () => {
    const cascadeButton = document.querySelector('.cascadeButton') as HTMLButtonElement;
    if (cascadeButton) {
      cascadeButton.style.backgroundColor = '';
      cascadeButton.style.color = '';
      cascadeButton.style.textShadow = 'none';
      cascadeButton.innerHTML = `
        <svg width="25" height="25" viewBox="0 0 25 25" fill="#cf0" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.15957 17.3803C0.159569 19.3614 1.60684 21.1139 3.43497 21.5711C3.81583 23.476 5.72014 24.9237 7.62444 24.8475C8.8432 24.8475 9.90961 24.3903 10.6713 23.6284C11.4331 22.8664 11.9663 21.7235 11.8901 20.5805V14.1801C11.8901 13.8753 11.8139 13.6467 11.5854 13.4182C11.3569 13.1896 11.1284 13.1134 10.8237 13.1134H4.42521C3.20646 13.1134 2.14005 13.5706 1.37833 14.3325C0.616603 15.0945 0.0833975 16.2374 0.15957 17.3803Z" />
          <path d="M13.2611 4.27517V10.6756C13.2611 11.2851 13.7181 11.7423 14.3275 11.7423H20.7259C21.9447 11.7423 23.0111 11.2851 23.7728 10.5232C24.5346 9.76124 25.0678 8.61831 24.9916 7.47538C24.9916 5.49429 23.5443 3.7418 21.7162 3.28463C21.5638 2.52267 21.1068 1.76072 20.5736 1.22735C19.7357 0.389197 18.6693 -0.0679753 17.5267 0.0082202C16.308 0.0082202 15.2416 0.465393 14.4798 1.22735C13.7181 1.9893 13.1849 3.13223 13.2611 4.27517Z" />
          <path d="M13.1851 14.2564V20.6569C13.1851 22.9427 15.1656 24.9238 17.5269 25C18.7457 25 19.8121 24.5428 20.5738 23.7809C21.1832 23.1713 21.564 22.4855 21.7164 21.7236C22.4781 21.5712 23.2398 21.114 23.773 20.5807C24.6109 19.7425 25.068 18.6758 24.9918 17.5328C24.9918 16.3137 24.5347 15.247 23.773 14.485C23.0113 13.7231 21.8687 13.1897 20.7261 13.2659H14.3277C14.023 13.2659 13.7945 13.3421 13.566 13.5707C13.3374 13.7993 13.1851 13.9517 13.1851 14.2564Z" />
          <path d="M1.22697 4.42795C0.389079 5.2661 -0.0679545 6.33283 0.0082177 7.47576C0.0082178 9.91402 1.91252 11.8189 4.35003 11.8189H10.7485C11.3579 11.8189 11.8149 11.3617 11.8149 10.7522V4.35175C11.8149 3.13262 11.3579 2.06588 10.5962 1.30393C9.83443 0.541976 8.76802 0.084804 7.54926 0.084804C6.33051 0.0848039 5.2641 0.541977 4.50238 1.30393C3.893 1.9135 3.51214 2.59925 3.35979 3.36121C2.5219 3.4374 1.76018 3.89458 1.22697 4.42795Z" />
        </svg>`;
    }
  };

  // Grey out cascade button when 7 numbers are selected
  const greyedCascadeButton = () => {
    const cascadeButton = document.querySelector('.cascadeButton') as HTMLButtonElement;
    if (cascadeButton) {
      cascadeButton.style.backgroundColor = 'rgb(28, 28, 28)';
      cascadeButton.style.color = '';
      cascadeButton.style.textShadow = 'none';
      cascadeButton.innerHTML = `
        <svg width="25" height="25" viewBox="0 0 25 25" fill="rgb(138, 138, 138)" xmlns="http://www.w3.org/2000/svg">
          <path d="M0.15957 17.3803C0.159569 19.3614 1.60684 21.1139 3.43497 21.5711C3.81583 23.476 5.72014 24.9237 7.62444 24.8475C8.8432 24.8475 9.90961 24.3903 10.6713 23.6284C11.4331 22.8664 11.9663 21.7235 11.8901 20.5805V14.1801C11.8901 13.8753 11.8139 13.6467 11.5854 13.4182C11.3569 13.1896 11.1284 13.1134 10.8237 13.1134H4.42521C3.20646 13.1134 2.14005 13.5706 1.37833 14.3325C0.616603 15.0945 0.0833975 16.2374 0.15957 17.3803Z" />
          <path d="M13.2611 4.27517V10.6756C13.2611 11.2851 13.7181 11.7423 14.3275 11.7423H20.7259C21.9447 11.7423 23.0111 11.2851 23.7728 10.5232C24.5346 9.76124 25.0678 8.61831 24.9916 7.47538C24.9916 5.49429 23.5443 3.7418 21.7162 3.28463C21.5638 2.52267 21.1068 1.76072 20.5736 1.22735C19.7357 0.389197 18.6693 -0.0679753 17.5267 0.0082202C16.308 0.0082202 15.2416 0.465393 14.4798 1.22735C13.7181 1.9893 13.1849 3.13223 13.2611 4.27517Z" />
          <path d="M13.1851 14.2564V20.6569C13.1851 22.9427 15.1656 24.9238 17.5269 25C18.7457 25 19.8121 24.5428 20.5738 23.7809C21.1832 23.1713 21.564 22.4855 21.7164 21.7236C22.4781 21.5712 23.2398 21.114 23.773 20.5807C24.6109 19.7425 25.068 18.6758 24.9918 17.5328C24.9918 16.3137 24.5347 15.247 23.773 14.485C23.0113 13.7231 21.8687 13.1897 20.7261 13.2659H14.3277C14.023 13.2659 13.7945 13.3421 13.566 13.5707C13.3374 13.7993 13.1851 13.9517 13.1851 14.2564Z" />
          <path d="M1.22697 4.42795C0.389079 5.2661 -0.0679545 6.33283 0.0082177 7.47576C0.0082178 9.91402 1.91252 11.8189 4.35003 11.8189H10.7485C11.3579 11.8189 11.8149 11.3617 11.8149 10.7522V4.35175C11.8149 3.13262 11.3579 2.06588 10.5962 1.30393C9.83443 0.541976 8.76802 0.084804 7.54926 0.084804C6.33051 0.0848039 5.2641 0.541977 4.50238 1.30393C3.893 1.9135 3.51214 2.59925 3.35979 3.36121C2.5219 3.4374 1.76018 3.89458 1.22697 4.42795Z" />
        </svg>`;
    }
  };
  
  // Handle bottom trigger click to show/hide selectors
  const handleBottomTriggerClick = () => {
    setBottomSelectorsVisible(!bottomSelectorsVisible);
    
    // Update button styling like standalone
    const bottomTrigger = document.getElementById('bottomTrigger');
    if (bottomTrigger) {
      if (!bottomSelectorsVisible) {
        bottomTrigger.style.backgroundColor = '#242424';
        bottomTrigger.style.opacity = '0.65';
      } else {
        bottomTrigger.style.backgroundColor = '';
        bottomTrigger.style.opacity = '';
      }
    }
  };

  // Handle grid button clicks
  const handleGridButtonClick = (buttonType: 'vertical' | 'horizontal') => {
    const selectorContainer = document.getElementById('selectorContainerID');
    const selectedNumbersRow = document.getElementById('selectedNumbersRowID');
    const linkList = document.getElementById('linkList');
    const frequencyContainer = document.getElementById('frequencyContainer');
    const randNumberBox = document.getElementById('randNumberBox');
    const winningNumberSpacer = document.getElementById('winningNumberSpacer');
    const verticalButton = document.getElementById('vertical');
    const horizontalButton = document.getElementById('horizontal');
    
    // Toggle visibility function matching standalone
    const toggleVisibility = (element: HTMLElement | null) => {
      if (element) {
        if (element.style.display === 'none' || element.style.display === '') {
          element.style.display = 'flex';
        } else {
          element.style.display = 'none';
        }
      }
    };
    
    // Check if all elements are hidden matching standalone
    const areAllElementsHidden = () => {
      return [selectorContainer, selectedNumbersRow, linkList, frequencyContainer, randNumberBox].every(
        element => element && (element.style.display === 'none' || element.style.display === '')
      );
    };
    
    if (buttonType === 'vertical') {
      // Remember state before switching to vertical
      const activeLink = document.querySelector('#linkList a.on');
      if (activeLink) {
        setWasActiveBeforeVertical(true);
        setActiveLinkId(activeLink.id);
        setPreviousDataToShow([...dataToShow]);
      }
    }
    
    // Toggle visibility of elements
    toggleVisibility(selectorContainer);
    toggleVisibility(selectedNumbersRow);
    toggleVisibility(linkList);
    toggleVisibility(frequencyContainer);
    toggleVisibility(randNumberBox);
    
    // Check if all elements are hidden and update spacer
    if (winningNumberSpacer) {
      winningNumberSpacer.style.display = areAllElementsHidden() ? 'flex' : 'none';
    }
    
    // Scroll to top
    window.scrollTo(0, 0);
    
    // Swap button visibility
    if (verticalButton && horizontalButton) {
      if (horizontalButton.style.display === 'none') {
        horizontalButton.style.display = 'block';
        verticalButton.style.display = 'none';
      } else {
        horizontalButton.style.display = 'none';
        verticalButton.style.display = 'block';
      }
    }
    
    // Handle data changes and restore state
    if (buttonType === 'vertical') {
      setDataToShow([...lottoMaxWinningNumbers2023]);
    } else if (buttonType === 'horizontal' && wasActiveBeforeVertical) {
      setDataToShow([...previousDataToShow]);
      if (activeLinkId) {
        const linkToActivate = document.getElementById(activeLinkId) as HTMLAnchorElement;
        if (linkToActivate) {
          linkToActivate.classList.add('on');
          updateUIBasedOnActiveLink(linkToActivate);
          
          if (activeLinkId === 'pairs') {
            const pairFrequency = document.getElementById('pairFrequency');
            if (pairFrequency) pairFrequency.style.display = 'block';
          } else if (activeLinkId === 'allLink') {
            const frequencyResults = document.getElementById('frequencyResults');
            if (frequencyResults) frequencyResults.style.display = 'block';
          }
        }
      }
      setWasActiveBeforeVertical(false);
    }
    
    // Update displays
    displayMostFrequentNumbers();
    displayPairsInDifferentDraws();
  };
  
  // Update UI based on active link
  const updateUIBasedOnActiveLink = (clickedLink: HTMLAnchorElement) => {
    const frequencyResults = document.getElementById('frequencyResults');
    const pairFrequency = document.getElementById('pairFrequency');
    
    if (clickedLink.id === 'pairs') {
      if (pairFrequency) {
        pairFrequency.style.display = 'block';
        displayPairsInDifferentDraws();
      }
      if (frequencyResults) frequencyResults.style.display = 'none';
    } else {
      if (frequencyResults) {
        frequencyResults.style.display = 'block';
        displayMostFrequentNumbers();
      }
      if (pairFrequency) pairFrequency.style.display = 'none';
    }
  };

  // Create number button exactly like standalone
  const createNumberButton = (number: number, isBonus = false) => {
    const button = document.createElement('button');
    button.textContent = number.toString();
    button.setAttribute('data-number', number.toString());
    button.classList.add('saved-number-button');
    if (isBonus) {
      button.classList.add('bonus');
      button.style.opacity = '0.5';
    } else {
      button.style.opacity = '1';
    }
    button.addEventListener('click', () => toggleColor(number));
    return button;
  };

  // Populate saved numbers from localStorage exactly like standalone
  const populateSavedNumbersFromLocalStorage = () => {
    const savedNumbersDiv = document.getElementById('savedUmbersID');
    if (!savedNumbersDiv) return;
    
    const storedSequences = JSON.parse(localStorage.getItem('numberSequences') || '[]');
    let table = savedNumbersDiv.querySelector('table');
    
    if (!table) {
      table = document.createElement('table');
      savedNumbersDiv.appendChild(table);
    }
    
    storedSequences.forEach((sequence: number[]) => {
      const row = table!.insertRow(0); // Insert at beginning
      
      sequence.forEach((number) => {
        const cell = row.insertCell();
        const numberButton = createNumberButton(number, false);
        cell.appendChild(numberButton);
      });
      
      // Add empty cells if less than 7 numbers
      for (let i = sequence.length; i < 7; i++) {
        const emptyCell = row.insertCell();
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('empty-cell');
        emptyCell.appendChild(emptyDiv);
      }
      
      // Add clear button
      const clearCell = row.insertCell();
      const clearButton = document.createElement('button');
      clearButton.className = 'clear-button';
      clearButton.innerHTML = '✕';
      clearButton.onclick = function() {
        table!.deleteRow(row.rowIndex);
        // Remove from localStorage
        const currentSequences = JSON.parse(localStorage.getItem('numberSequences') || '[]');
        const updatedSequences = currentSequences.filter((seq: number[]) => 
          JSON.stringify(seq) !== JSON.stringify(sequence)
        );
        localStorage.setItem('numberSequences', JSON.stringify(updatedSequences));
        updateSavedRowCount(false);
      };
      clearCell.appendChild(clearButton);
    });
    
    // Update clear button content based on current lock state after populating
    updateClearButtonContent();
  };

  // Save numbers function exactly like standalone
  const saveNumbers = () => {
    if (firstSevenToggled.length === 0) {
      console.log('No numbers to save');
      return;
    }
    
    const sortedNumbers = [...firstSevenToggled].sort((a, b) => a - b);
    const savedNumbersDiv = document.getElementById('savedUmbersID');
    if (!savedNumbersDiv) return;
    
    let table = savedNumbersDiv.querySelector('table');
    if (!table) {
      table = document.createElement('table');
      savedNumbersDiv.appendChild(table);
    }
    
    const row = table.insertRow(0);
    row.classList.add('row-highlight');
    setTimeout(() => {
      row.classList.remove('row-highlight');
    }, 1000);
    
    sortedNumbers.forEach((number) => {
      const cell = row.insertCell();
      const numberButton = createNumberButton(number, false);
      toggleColor(number); // Toggle off the number
      cell.appendChild(numberButton);
    });
    
    // Add empty cells
    for (let i = sortedNumbers.length; i < 7; i++) {
      const emptyCell = row.insertCell();
      const emptyDiv = document.createElement('div');
      emptyDiv.classList.add('empty-cell');
      emptyCell.appendChild(emptyDiv);
    }
    
    // Add clear button
    const clearCell = row.insertCell();
    const clearButton = document.createElement('button');
    clearButton.className = 'clear-button';
    clearButton.innerHTML = '✕';
    clearButton.onclick = function() {
      table!.deleteRow(row.rowIndex);
      // Remove from localStorage
      const currentSequences = JSON.parse(localStorage.getItem('numberSequences') || '[]');
      const updatedSequences = currentSequences.filter((seq: number[]) => 
        JSON.stringify(seq) !== JSON.stringify(sortedNumbers)
      );
      localStorage.setItem('numberSequences', JSON.stringify(updatedSequences));
      updateSavedRowCount(false);
    };
    clearCell.appendChild(clearButton);
    
    // Save to localStorage
    const existingSequences = JSON.parse(localStorage.getItem('numberSequences') || '[]');
    existingSequences.push(sortedNumbers);
    localStorage.setItem('numberSequences', JSON.stringify(existingSequences));
    
    // Reset state
    toggleOffAllButtons();
    updateSavedRowCount(false);
    
    // Update clear button content based on current lock state
    updateClearButtonContent();
    
    // Show saved navigation buttons
    const downSavedBtn = document.getElementById('downSaved');
    const upSavedBtn = document.getElementById('upSaved');
    if (downSavedBtn) downSavedBtn.style.display = 'block';
    if (upSavedBtn) upSavedBtn.style.display = 'block';
  };
  
  // Get lock saved state from localStorage exactly like standalone
  const getLockSavedState = () => {
    const state = localStorage.getItem('lockSavedState');
    return state ? JSON.parse(state) : false; // Default to false if not set
  };

  // Animate saved numbers table exactly like standalone
  const animateSavedNumbersTable = (direction: 'leftToRight' | 'rightToLeft', overlapColumns: number) => {
    const savedNumbersDiv = document.getElementById('savedUmbersID');
    const savedNumbersTable = savedNumbersDiv?.querySelector('table') as HTMLTableElement;
    if (!savedNumbersTable || savedNumbersTable.rows.length === 0) return;

    let delay = 50;
    const delayIncrement = 0; // Time to wait before changing to the next column
    const colorChangeDuration = 50; // Time to keep the color changed
    const numColumns = savedNumbersTable.rows[0].cells.length;
    const numRows = savedNumbersTable.rows.length;

    // Function to change the background color of a button
    const changeBackgroundColor = (button: HTMLElement, color: string) => {
      button.style.backgroundColor = color;
    };

    for (let col = 0; col < numColumns; col++) {
      let startCol = direction === 'rightToLeft' ? numColumns - 1 - col : col;

      for (let overlap = 0; overlap < overlapColumns; overlap++) {
        let currentCol = direction === 'rightToLeft' ? startCol - overlap : startCol + overlap;
        if (currentCol >= 0 && currentCol < numColumns) {
          // Define colors for overlapping columns
          let color;
          switch (overlap) {
            case 0:
              color = '#003B42'; // First column in blue
              break;
            case 1:
              color = '#009eba'; // Second column in light blue
              break;
            case 2:
              color = '#8deeff'; // Third column in light blue
              break;
            default:
              color = ''; // Default color
          }

          for (let row = 0; row < numRows; row++) {
            const cell = savedNumbersTable.rows[row].cells[currentCol];
            const button = cell.querySelector('button');
            if (button) {
              setTimeout(() => changeBackgroundColor(button, color), delay);
            }
          }

          for (let row = 0; row < numRows; row++) {
            const cell = savedNumbersTable.rows[row].cells[currentCol];
            const button = cell.querySelector('button');
            if (button) {
              setTimeout(
                () => changeBackgroundColor(button, ''),
                delay + colorChangeDuration
              );
            }
          }
        }
      }

      // Increment the delay for the next column group
      delay += delayIncrement + colorChangeDuration;
    }
  };

  // Save lock saved state to localStorage exactly like standalone
  const saveLockSavedState = (isLocked: boolean) => {
    localStorage.setItem('lockSavedState', JSON.stringify(isLocked));
    
    // Update button visibility ONLY if the saved container is currently open
    const savedNumbersDiv = document.getElementById('savedUmbersID');
    const isContainerOpen = savedNumbersDiv?.style.display === 'flex';
    
    if (isContainerOpen) {
      // Only update lock/unlock button visibility when container is open
      const lockSavedButton = document.querySelector('.lockSaved') as HTMLElement;
      const unLockSavedButton = document.querySelector('.unLockSaved') as HTMLElement;
      
      // When LOCKED: show locked icon (numbers are locked, can't delete)
      // When UNLOCKED: show unlocked icon (numbers are unlocked, can delete)
      if (lockSavedButton) lockSavedButton.style.display = isLocked ? 'block' : 'none';
      if (unLockSavedButton) unLockSavedButton.style.display = isLocked ? 'none' : 'block';
    }
    // If container is closed, lock/unlock buttons should remain hidden
    
    // Update clear buttons based on new lock state
    updateClearButtonContent(isLocked);
  };

  // Find the currently active index from bottom selectors exactly like standalone
  const findActiveSelectorIndex = () => {
    const selectors = document.querySelectorAll('.bottomSelector');
    for (let i = 0; i < selectors.length; i++) {
      if (selectors[i].classList.contains('on')) {
        return i;
      }
    }
    return -1; // Return -1 if no selector is active
  };

  // Update bottom selectors exactly like standalone
  const updateBottomSelectors = (index: number) => {
    const selectors = document.querySelectorAll('.bottomSelector');
    selectors.forEach((selector, i) => {
      if (i === index) {
        selector.classList.add('on');
      } else {
        selector.classList.remove('on');
      }
    });
  };

  // Toggle numbers and advance to next row exactly like standalone
  const toggleNumbersAndAdvance = () => {
    let activeIndex = findActiveSelectorIndex();
    let currentIndex = activeIndex !== -1 ? activeIndex : -1;
    currentIndex = (currentIndex + 1) % dataToShow.length;
    
    // If this row corresponds to a bottom selector (first 15), update it
    if (currentIndex < 15) {
      // Turn off all selectors first
      document.querySelectorAll('.bottomSelector').forEach((el) => {
        el.classList.remove('on');
        el.classList.add('off');
      });
      
      // Turn on the new selector
      const newSelector = document.querySelectorAll('.bottomSelector')[currentIndex];
      if (newSelector) {
        newSelector.classList.remove('off');
        newSelector.classList.add('on');
      }
      
      // Update draw details
      updateDrawDetails(currentIndex);
    } else {
      // Row is beyond bottom selectors, just toggle the row
      document.querySelectorAll('.bottomSelector').forEach((el) => {
        el.classList.remove('on');
        el.classList.add('off');
      });
      updateDrawDetails(-1);
    }
    
    // Update the state
    setActiveIndex(currentIndex);
    toggleNumbersFromDraw(currentIndex);
    greyedCascadeButton();
    setTimeout(() => updateButtonVisibility(), 0);
  };

  // Toggle numbers and reverse to previous row exactly like standalone  
  const toggleNumbersAndReverse = () => {
    let activeIndex = findActiveSelectorIndex();
    let currentIndex = activeIndex !== -1 ? activeIndex : 0;
    currentIndex = currentIndex - 1;
    if (currentIndex < 0) {
      currentIndex = dataToShow.length - 1;
    }
    
    // If this row corresponds to a bottom selector (first 15), update it
    if (currentIndex < 15) {
      // Turn off all selectors first
      document.querySelectorAll('.bottomSelector').forEach((el) => {
        el.classList.remove('on');
        el.classList.add('off');
      });
      
      // Turn on the new selector
      const newSelector = document.querySelectorAll('.bottomSelector')[currentIndex];
      if (newSelector) {
        newSelector.classList.remove('off');
        newSelector.classList.add('on');
      }
      
      // Update draw details
      updateDrawDetails(currentIndex);
    } else {
      // Row is beyond bottom selectors, just toggle the row
      document.querySelectorAll('.bottomSelector').forEach((el) => {
        el.classList.remove('on');
        el.classList.add('off');
      });
      updateDrawDetails(-1);
    }
    
    // Update the state
    setActiveIndex(currentIndex);
    toggleNumbersFromDraw(currentIndex);
    greyedCascadeButton();
    setTimeout(() => updateButtonVisibility(), 0);
  };

  // Check if any complete winning number row is toggled on
  const isAnyCompleteDrawToggled = () => {
    for (let i = 0; i < Math.min(15, dataToShow.length); i++) {
      if (areAllNumbersFromDrawToggledOn(i)) {
        return true;
      }
    }
    return false;
  };

  // Update button visibility for red up/down arrows exactly like standalone  
  const updateButtonVisibility = (currentActiveNumbers?: Set<number>) => {
    const upButton = document.querySelector('.upButton') as HTMLElement;
    const downButton = document.querySelector('.downButton') as HTMLElement;
    const savedNumbersDiv = document.getElementById('savedUmbersID');
    const drawDetailsDiv = document.querySelector('.drawDetails') as HTMLElement;
    
    // Check if any bottom selector is on OR if draw details are visible
    const isAnyBottomSelectorOn = document.querySelector('.bottomSelector.on') !== null;
    const areDrawDetailsVisible = drawDetailsDiv && drawDetailsDiv.style.display === 'block';
    
    console.log(`UpdateButtonVisibility - isAnyBottomSelectorOn: ${isAnyBottomSelectorOn}, areDrawDetailsVisible: ${areDrawDetailsVisible}`);
    
    // Red arrows should be visible if:
    // 1. Any bottom selector row is toggled on OR draw details are visible, AND
    // 2. Saved numbers container is closed (or doesn't exist)
    // 
    // Red arrows should be hidden when:
    // - No bottom selector row is toggled on AND draw details are not visible, OR
    // - Saved numbers container is open
    const shouldShowRedArrows = (isAnyBottomSelectorOn || areDrawDetailsVisible) && 
      (!savedNumbersDiv || savedNumbersDiv.style.display !== 'flex');
    
    console.log(`Should show red arrows: ${shouldShowRedArrows}`);
    
    if (upButton) upButton.style.display = shouldShowRedArrows ? 'block' : 'none';
    if (downButton) downButton.style.display = shouldShowRedArrows ? 'block' : 'none';
  };

  // Helper function to check if any complete draw is toggled with specific numbers
  const isAnyCompleteDrawToggledWithNumbers = (numbersToCheck: Set<number>) => {
    for (let i = 0; i < Math.min(15, dataToShow.length); i++) {
      if (areAllNumbersFromDrawToggledOnWithNumbers(i, numbersToCheck)) {
        return true;
      }
    }
    return false;
  };

  // Helper function to check if all numbers from a draw are toggled with specific numbers
  const areAllNumbersFromDrawToggledOnWithNumbers = (drawIndex: number, numbersToCheck: Set<number>) => {
    if (drawIndex < 0 || drawIndex >= dataToShow.length) return false;
    const drawNumbers = dataToShow[drawIndex].numbers;
    return drawNumbers.every((number: number) => numbersToCheck.has(number));
  };

  // Track current row index for saved numbers navigation
  let currentRowIndex = -1;

  // Toggle row selection exactly like standalone
  const toggleRow = (rowIndex: number) => {
    const savedNumbersDiv = document.getElementById('savedUmbersID');
    const table = savedNumbersDiv?.querySelector('table');
    
    if (!table) return; // Exit if the table doesn't exist
    
    // Set the opacity for all rows
    for (let i = 0; i < table.rows.length; i++) {
      (table.rows[i] as HTMLElement).style.opacity = i === rowIndex ? '1' : '0.5';
    }
    
    currentRowIndex = rowIndex; // Update the current row index
    
    if (table && rowIndex >= 0 && rowIndex < table.rows.length) {
      // Turn off all active numbers
      activeNumbers.forEach((number) => {
        const button = document.querySelector(`button[data-number="${number}"]`) as HTMLButtonElement;
        if (button) {
          toggleColor(number); // This will turn off the button
        }
      });
      
      // Clear the active numbers set
      setActiveNumbers(new Set());
      
      // Toggle on the numbers in the selected row
      const row = table.rows[rowIndex];
      Array.from(row.cells).forEach((cell, index) => {
        const button = cell.querySelector('button') as HTMLButtonElement;
        if (button && index < 7) {
          const number = parseInt(button.textContent || '0');
          toggleColor(number); // This will turn on the button
          setActiveNumbers(prev => new Set([...prev, number])); // Add number to active set
        }
      });
    }
    
    // Hide red up/down buttons when a row is selected
    const upButton = document.querySelector('.upButton') as HTMLElement;
    const downButton = document.querySelector('.downButton') as HTMLElement;
    if (upButton) upButton.style.display = 'none';
    if (downButton) downButton.style.display = 'none';
  };

  // Toggle off currently selected row exactly like standalone
  const toggleRowOff = () => {
    const savedNumbersDiv = document.getElementById('savedUmbersID');
    const table = savedNumbersDiv?.querySelector('table');
    
    if (!table || currentRowIndex === -1) return; // Exit if no table or no selected row
    
    // Reset the opacity for all rows
    for (let row of table.rows) {
      (row as HTMLElement).style.opacity = '1';
    }
    
    // Reset the current row index
    currentRowIndex = -1;
    
    // Turn off all active numbers
    activeNumbers.forEach((number) => {
      const button = document.querySelector(`button[data-number="${number}"]`) as HTMLButtonElement;
      if (button) {
        toggleColor(number); // This will turn off the button
      }
    });
    
    // Clear the active numbers set
    setActiveNumbers(new Set());
    resetCascadeButton();
  };

  // Navigate through saved numbers with green arrows
  const navigateSavedNumbers = (direction: 'up' | 'down') => {
    const savedNumbersDiv = document.getElementById('savedUmbersID');
    const table = savedNumbersDiv?.querySelector('table');
    
    if (!table || table.rows.length === 0) return;
    
    let newRowIndex: number;
    
    if (currentRowIndex === -1) {
      // No row currently selected, start from first (down) or last (up)
      newRowIndex = direction === 'down' ? 0 : table.rows.length - 1;
    } else {
      // Move up or down from current selection
      if (direction === 'down') {
        newRowIndex = (currentRowIndex + 1) % table.rows.length; // Wrap to top
      } else {
        newRowIndex = currentRowIndex - 1;
        if (newRowIndex < 0) {
          newRowIndex = table.rows.length - 1; // Wrap to bottom
        }
      }
    }
    
    // Select the new row
    toggleRow(newRowIndex);
  };

  // Update clear button content based on lock state exactly like standalone
  const updateClearButtonContent = (isLocked = getLockSavedState()) => {
    const savedRows = document.querySelectorAll('#savedUmbersID table tr');
    
    savedRows.forEach((row) => {
      const clearButton = row.querySelector('.clear-button') as HTMLButtonElement;
      if (!clearButton) return;
      
      clearButton.disabled = isLocked; // Disable clear button if locked
      clearButton.innerHTML = isLocked
        ? '<svg xmlns="http://www.w3.org/2000/svg" height="10" width="10" viewBox="0 0 448 512"><path fill="#009eba" d="M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z"/></svg>'
        : '✕';
    });
  };

  // Check and toggle save button state exactly like standalone
  const checkAndToggleSaveButtonState = (animate = false) => {
    const saveBtnDefault = document.getElementById('saveBtnDefaultID');
    const saveBtn = document.getElementById('saveBtnID');
    
    if (!saveBtnDefault || !saveBtn) return;
    
    // Always show the colored heart (ON state), hide the gray heart
    saveBtnDefault.style.display = 'none';
    saveBtn.style.display = 'block';
    
    console.log('Save button kept in enabled state (colored heart visible)');
  };

  // Update saved row count exactly like standalone
  const updateSavedRowCount = (maintainVisibility = true) => {
    const savedNumbersDiv = document.getElementById('savedUmbersID');
    const table = savedNumbersDiv?.querySelector('table');
    const rowCount = table ? table.rows.length : 0;
    const counterBtn = document.getElementById('counterBtnID');
    const lockSavedButton = document.querySelector('.lockSaved') as HTMLButtonElement;
    const unLockSavedButton = document.querySelector('.unLockSaved') as HTMLButtonElement;
    
    if (!savedNumbersDiv || !counterBtn) return;
    
    const updateCounterButtonText = () => {
      const isVisible = savedNumbersDiv.style.display === 'flex';
      counterBtn.classList.toggle('visible', isVisible);
      
      // Lock/unlock buttons should NEVER be visible from this function
      // They are only controlled by the counter button click handler
      
      counterBtn.innerHTML = 
        `${rowCount} saved \xa0\xa0\xa0` +
        (isVisible
          ? '<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path fill="#8deeff" d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path fill="#009eba" d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/></svg>');
    };
    
    // Update visibility based on maintainVisibility flag and whether it's the first call
    if (maintainVisibility && !savedNumbersDiv.getAttribute('data-initialized')) {
      savedNumbersDiv.style.setProperty('display', 'none', 'important');
      savedNumbersDiv.setAttribute('data-initialized', 'true');
    } else if (!maintainVisibility) {
      savedNumbersDiv.style.setProperty('display', rowCount > 0 ? 'flex' : 'none', 'important');
    }
    
    updateCounterButtonText();
    
    // Add click event listener to counter button
    counterBtn.onclick = () => {
      const isCurrentlyVisible = savedNumbersDiv.style.display === 'flex';
      savedNumbersDiv.style.setProperty('display', isCurrentlyVisible ? 'none' : 'flex', 'important');
      
      const downSavedNav = document.getElementById('downSaved');
      const upSavedNav = document.getElementById('upSaved');
      const lockSavedButton = document.querySelector('.lockSaved') as HTMLElement;
      const unLockSavedButton = document.querySelector('.unLockSaved') as HTMLElement;
      const bottomTrigger = document.querySelector('.bottomTrigger') as HTMLElement;
      const upButton = document.querySelector('.upButton') as HTMLElement;
      const downButton = document.querySelector('.downButton') as HTMLElement;
      
      if (isCurrentlyVisible) {
        // Container is currently open, being closed - show red elements, hide green elements
        
        // Show red grip icon
        if (bottomTrigger) bottomTrigger.style.display = 'block';
        
        // Red arrows visibility will be determined by updateButtonVisibility()
        
        // Hide green arrows (saved number navigation)
        if (downSavedNav) downSavedNav.style.display = 'none';
        if (upSavedNav) upSavedNav.style.display = 'none';
        
        // Hide lock/unlock buttons (hidden when closed)
        if (lockSavedButton) lockSavedButton.style.display = 'none';
        if (unLockSavedButton) unLockSavedButton.style.display = 'none';
        
      } else {
        // Container is currently closed, being opened - hide red elements, show green elements
        
        // Hide red grip icon
        if (bottomTrigger) bottomTrigger.style.display = 'none';
        
        // Hide red arrows (for winning number navigation)
        if (upButton) upButton.style.display = 'none';
        if (downButton) downButton.style.display = 'none';
        
        // Show green arrows (saved number navigation)
        if (downSavedNav) downSavedNav.style.display = 'block';
        if (upSavedNav) upSavedNav.style.display = 'block';
        
        // Show lock/unlock buttons when green arrows are visible
        const isLocked = getLockSavedState();
        // When LOCKED: show locked icon (numbers are locked, can't delete)
        // When UNLOCKED: show unlocked icon (numbers are unlocked, can delete)
        if (lockSavedButton) lockSavedButton.style.display = isLocked ? 'block' : 'none';
        if (unLockSavedButton) unLockSavedButton.style.display = isLocked ? 'none' : 'block';
      }

      // Update red arrow visibility based on current state
      setTimeout(() => updateButtonVisibility(), 0);

      
      // If the container is being hidden, toggle off the selected row exactly like standalone
      if (isCurrentlyVisible) {
        toggleRowOff();
      }
      
      updateCounterButtonText();
    };
  };

  if (loading) {
    return (
      <div className="loader">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Easter Egg */}
      <div role="presentation" className="easter-egg">
        Tuesday 01.07.25  
        <span className="flip" role="img" style={{fontSize: '1.25em', top: '0.15em', position: 'relative'}}>
        🍀 </span>
        <strong>$55 million</strong>
        
        <span role="img" style={{fontSize: '1.25em', top: '0.15em', position: 'relative'}}>
        🍀 </span>

        <div><span style={{fontSize: '.75em', marginLeft: '164px'}}>+ 4 MaxMillions</span></div>
      </div>

      {/* Top Navigation */}
      <div className="topNav">
        <button className="allOff" id="allOff" onClick={toggleOffAllButtons}>
          <svg xmlns="http://www.w3.org/2000/svg" height="16" width="14" viewBox="0 0 448 512">
            <path fill="#cf0" d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"/>
          </svg>
        </button>
        
        <div style={{display: 'flex', justifyContent: 'center'}}>
          <button className="noBorder" id="vertical" style={{display: 'none'}} onClick={() => handleGridButtonClick('vertical')}>
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="10" viewBox="0 0 320 512">
              <path fill="#cf0" d="M40 352l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zm192 0l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zM40 320c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0zM232 192l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40zM40 160c-22.1 0-40-17.9-40-40L0 72C0 49.9 17.9 32 40 32l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0zM232 32l48 0c22.1 0 40 17.9 40 40l0 48c0 22.1-17.9 40-40 40l-48 0c-22.1 0-40-17.9-40-40l0-48c0-22.1 17.9-40 40-40z"/>
            </svg>
          </button>

          <button className="noBorder" id="horizontal" onClick={() => handleGridButtonClick('horizontal')}>
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="14" viewBox="0 0 448 512">
              <path fill="#cf0" d="M128 136c0-22.1-17.9-40-40-40L40 96C17.9 96 0 113.9 0 136l0 48c0 22.1 17.9 40 40 40H88c22.1 0 40-17.9 40-40l0-48zm0 192c0-22.1-17.9-40-40-40H40c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40H88c22.1 0 40-17.9 40-40V328zm32-192v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V136c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM288 328c0-22.1-17.9-40-40-40H200c-22.1 0-40 17.9-40 40l0 48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V328zm32-192v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V136c0-22.1-17.9-40-40-40l-48 0c-22.1 0-40 17.9-40 40zM448 328c0-22.1-17.9-40-40-40H360c-22.1 0-40 17.9-40 40v48c0 22.1 17.9 40 40 40h48c22.1 0 40-17.9 40-40V328z"/>
            </svg>
          </button>
        </div>
        
        <a href="/game" target="_self">
          <button className="spin">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.75 12.5H6.25C6.94063 12.5 7.5 11.9406 7.5 11.25V9.75C7.5 9.05937 6.94063 8.5 6.25 8.5H4.75C4.05937 8.5 3.5 9.05937 3.5 9.75V11.25C3.5 11.9406 4.05937 12.5 4.75 12.5ZM9.75 8.5C9.05937 8.5 8.5 9.05937 8.5 9.75V11.25C8.5 11.9406 9.05937 12.5 9.75 12.5H11.25C11.9406 12.5 12.5 11.9406 12.5 11.25V9.75C12.5 9.05937 11.9406 8.5 11.25 8.5H9.75ZM4.75 7.5H6.25C6.94063 7.5 7.5 6.94063 7.5 6.25L7.5 4.75C7.5 4.05937 6.94063 3.5 6.25 3.5H4.75C4.05937 3.5 3.5 4.05937 3.5 4.75V6.25C3.5 6.94063 4.05937 7.5 4.75 7.5ZM9.75 3.5C9.05937 3.5 8.5 4.05937 8.5 4.75V6.25C8.5 6.94063 9.05937 7.5 9.75 7.5L11.25 7.5C11.9406 7.5 12.5 6.94063 12.5 6.25V4.75C12.5 4.05937 11.9406 3.5 11.25 3.5H9.75Z" fill="#CCFF00"/>
            </svg>
        </button>
        </a>
      </div>

      {/* Winning Number Spacer */}
      <div id="winningNumberSpacer"></div>

      {/* Selector Container */}
      <div className="selectorContainer" id="selectorContainerID">
        <div className="sumText">{calculateAndDisplaySum()}</div>
        
        <table>
          <tbody>
            {numberGrid.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((number) => (
                  <td key={number}>
                    <button
                      className={`number-button ${activeNumbers.has(number) ? 'toggled-on' : ''}`}
                      data-number={number}
                      style={getButtonStyle(number)}
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

      {/* Random Number Generator Button */}
      <div className="randNumberBox" data-role="interactive-randNumberBox" id="randNumberBox">
          <button 
            className="cascadeButton" 
          data-role="interactive-cascadeButton" 
          id="cascadeButton"
            onClick={handleCascadeClick}
            style={{
            backgroundColor: firstSevenToggled.length >= 7 ? 'rgb(28, 28, 28)' : ''
          }}
        >
          <svg width="25" height="25" viewBox="0 0 25 25" fill={firstSevenToggled.length >= 7 ? 'rgb(138, 138, 138)' : '#cf0'} xmlns="http://www.w3.org/2000/svg">
            <path d="M0.15957 17.3803C0.159569 19.3614 1.60684 21.1139 3.43497 21.5711C3.81583 23.476 5.72014 24.9237 7.62444 24.8475C8.8432 24.8475 9.90961 24.3903 10.6713 23.6284C11.4331 22.8664 11.9663 21.7235 11.8901 20.5805V14.1801C11.8901 13.8753 11.8139 13.6467 11.5854 13.4182C11.3569 13.1896 11.1284 13.1134 10.8237 13.1134H4.42521C3.20646 13.1134 2.14005 13.5706 1.37833 14.3325C0.616603 15.0945 0.0833975 16.2374 0.15957 17.3803Z" />
            <path d="M13.2611 4.27517V10.6756C13.2611 11.2851 13.7181 11.7423 14.3275 11.7423H20.7259C21.9447 11.7423 23.0111 11.2851 23.7728 10.5232C24.5346 9.76124 25.0678 8.61831 24.9916 7.47538C24.9916 5.49429 23.5443 3.7418 21.7162 3.28463C21.5638 2.52267 21.1068 1.76072 20.5736 1.22735C19.7357 0.389197 18.6693 -0.0679753 17.5267 0.0082202C16.308 0.0082202 15.2416 0.465393 14.4798 1.22735C13.7181 1.9893 13.1849 3.13223 13.2611 4.27517Z" />
            <path d="M13.1851 14.2564V20.6569C13.1851 22.9427 15.1656 24.9238 17.5269 25C18.7457 25 19.8121 24.5428 20.5738 23.7809C21.1832 23.1713 21.564 22.4855 21.7164 21.7236C22.4781 21.5712 23.2398 21.114 23.773 20.5807C24.6109 19.7425 25.068 18.6758 24.9918 17.5328C24.9918 16.3137 24.5347 15.247 23.773 14.485C23.0113 13.7231 21.8687 13.1897 20.7261 13.2659H14.3277C14.023 13.2659 13.7945 13.3421 13.566 13.5707C13.3374 13.7993 13.1851 13.9517 13.1851 14.2564Z" />
            <path d="M1.22697 4.42795C0.389079 5.2661 -0.0679545 6.33283 0.0082177 7.47576C0.0082178 9.91402 1.91252 11.8189 4.35003 11.8189H10.7485C11.3579 11.8189 11.8149 11.3617 11.8149 10.7522V4.35175C11.8149 3.13262 11.3579 2.06588 10.5962 1.30393C9.83443 0.541976 8.76802 0.084804 7.54926 0.084804C6.33051 0.0848039 5.2641 0.541977 4.50238 1.30393C3.893 1.9135 3.51214 2.59925 3.35979 3.36121C2.5219 3.4374 1.76018 3.89458 1.22697 4.42795Z" />
          </svg>
          </button>
        </div>
        
      {/* Selected Numbers Row */}
      <div className="selectedNumbersRow" id="selectedNumbersRowID" tabIndex={0}>
        {displaySelectedNumbers()}
      </div>

      {/* For Rand Spacer */}
      <div className="forRandSpacer"></div>

      {/* Link List */}
      <div id="linkList">
        <a 
          href="#" 
          data-rows="8"
          className="link-button"
          onClick={handleLinkClick}
        >
          8d
        </a>
        <a 
          href="#" 
          data-rows="13"
          className="link-button"
          onClick={handleLinkClick}
        >
          13d
        </a>
        <a 
          href="#" 
          data-rows="21"
          className="link-button"
          onClick={handleLinkClick}
        >
          21d
        </a>
        <a 
          href="#" 
          data-rows="34"
          className="link-button"
          onClick={handleLinkClick}
        >
          34d
        </a>
        <a 
          href="#" 
          data-rows="55"
          className="link-button"
          onClick={handleLinkClick}
        >
          55d
        </a>
        <a 
          href="#" 
          data-rows="all"
          className="link-button"
          id="allLink"
          onClick={handleLinkClick}
        >
          {lottoMaxWinningNumbers2023.length}d
        </a>
        <a 
          href="#" 
          data-rows="all"
          className="link-button"
          id="pairs"
          onClick={handleLinkClick}
        >
          x+y
        </a>
      </div>

      {/* Frequency Container */}
      <div id="frequencyContainer">
        <div id="frequencyResults"></div>
        <div id="pairFrequency"></div>
      </div>

      {/* Saved Numbers Section */}
      <div className="savedContainer">
        <div className="counterAndSaveRow">
          <button 
            className="saveBtnDefault" 
            id="saveBtnDefaultID"
            style={{ display: 'none' }}
          >
            <svg width="16" height="15" viewBox="0 0 16 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.4875 8.72885L7.13438 14.0007C7.36875 14.2195 7.67812 14.3414 8 14.3414C8.32188 14.3414 8.63125 14.2195 8.86563 14.0007L14.5125 8.72885C15.4625 7.84448 16 6.60385 16 5.30698V5.12573C16 2.94135 14.4219 1.07885 12.2688 0.719479C10.8438 0.481979 9.39375 0.947604 8.375 1.96635L8 2.34135L7.625 1.96635C6.60625 0.947604 5.15625 0.481979 3.73125 0.719479C1.57812 1.07885 0 2.94135 0 5.12573V5.30698C0 6.60385 0.5375 7.84448 1.4875 8.72885Z" fill="#2E2E2E"/>
            </svg>
          </button>

          <button 
            className="saveBtn" 
            id="saveBtnID"
            onClick={saveNumbers}
            style={{ display: 'block' }}
          >
            <svg width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.4875 9.72885L8.13438 15.0007C8.36875 15.2195 8.67812 15.3414 9 15.3414C9.32188 15.3414 9.63125 15.2195 9.86563 15.0007L15.5125 9.72885C16.4625 8.84448 17 7.60385 17 6.30698V6.12573C17 3.94135 15.4219 2.07885 13.2688 1.71948C11.8438 1.48198 10.3937 1.9476 9.375 2.96635L9 3.34135L8.625 2.96635C7.60625 1.9476 6.15625 1.48198 4.73125 1.71948C2.57812 2.07885 1 3.94135 1 6.12573V6.30698C1 7.60385 1.5375 8.84448 2.4875 9.72885Z" stroke="#009EBA" strokeWidth="2"/>
            </svg>
          </button>

          <button className="counterBtn" id="counterBtnID"></button>
        </div>

        <div className="savedNumbers" id="savedUmbersID">
          {/* Saved numbers table will be populated here */}
        </div>
      </div>

      {/* Winning Numbers Container */}
      <div className="winningNumbersContainer">
        <div id="winningNumbersTable">
          <table>
            <tbody>
              {dataToShow.map((draw, index) => (
                <tr key={index}>
                  {draw.numbers.map((number: number) => (
                    <td key={number}>
                      <button 
                        data-number={number}
                        className={`saved-number-button ${activeNumbers.has(number) ? 'toggled-on' : ''}`}
                        style={{ 
                          backgroundColor: activeNumbers.has(number) ? getColor(number) : '',
                          color: activeNumbers.has(number) ? '#fff' : '',
                          opacity: 1
                        }}
                        onClick={() => toggleColor(number)}
                      >
                        {number}
                      </button>
                    </td>
                  ))}
                  <td>
                    <button 
                      data-number={draw.bonus_number || draw.bonus}
                      className={`saved-number-button bonus ${activeNumbers.has(draw.bonus_number || draw.bonus) ? 'toggled-on' : ''}`}
                      style={{ 
                        backgroundColor: activeNumbers.has(draw.bonus_number || draw.bonus) ? getColor(draw.bonus_number || draw.bonus) : '',
                        color: activeNumbers.has(draw.bonus_number || draw.bonus) ? '#fff' : '',
                        opacity: 0.5
                      }}
                      onClick={() => toggleColor(draw.bonus_number || draw.bonus)}
                    >
                      {draw.bonus_number || draw.bonus}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div id="lastDrawDateDisplay" className="till_when_text">
          {dataToShow.length > 0 
            ? `${dataToShow.length} draws since ${dataToShow[dataToShow.length - 1]?.date || 'N/A'}`
            : 'Till [ the last draw date ]'
          }
        </div>
      </div>

      {/* Bottom Container */}
      <div className="bottomContainer">
        <div className="drawDetails" id="drawDetails" style={{ display: 'none' }}>
          details
        </div>

        <div 
          className="bottomSelectorsContainer"
          id="bottomSelectorsContainer"
          style={{ display: bottomSelectorsVisible ? 'grid' : 'none' }}
        >
          {Array.from({length: 15}, (_, index) => {
            const ordinalLabels = [
              'Latest', '2nd', '3rd', '4th', '5th', 
              '6th', '7th', '8th', '9th', '10th',
              '11th', '12th', '13th', '14th', '15th'
            ];
            
            return (
              <div
                key={index}
                className="bottomSelector"
                onClick={() => handleBottomSelectorClick(index)}
              >
                {ordinalLabels[index]}
              </div>
            );
          })}
        </div>

        {/* Bottom Nav Controls Selection */}
        <div className="controls">
          <button className="downSaved" id="downSaved" style={{display: 'none'}}>
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512">
              <path fill="#009eba" d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/>
            </svg>
          </button>

          <button className="downButton" id="downButton" style={{display: 'none'}}>
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512">
              <path fill="currentColor" style={{color: 'var(--main-color)'}} d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/>
            </svg>
          </button>

          {/* SAVE LOCK */}
          <button className="lockSaved" id="lockSaved" style={{display: 'none'}}>
            <svg width="20" height="20" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17 34.2549C17 31.1316 19.6043 28.5996 22.8169 28.5996H47.1831C50.3957 28.5996 53 31.1316 53 34.2549V57.9443C53 61.0676 50.3957 63.5996 47.1831 63.5996H22.8169C19.6043 63.5996 17 61.0676 17 57.9443V34.2549Z" fill="#009eba"/>
              <path d="M35.0169 6C27.8662 6 22.0693 11.7968 22.0693 18.9476V26H28.5916V18.9476C28.5916 15.399 31.4683 12.5222 35.0169 12.5222C38.5655 12.5222 41.4423 15.399 41.4423 18.9476V26H47.9645V18.9476C47.9645 11.7968 42.1677 6 35.0169 6Z" fill="#009eba"/>
            </svg>
          </button>

          {/* UNLOCK SAVE */}
          <button className="unLockSaved" id="unLockSaved" style={{display: 'none'}}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4.85742 9.78712C4.85742 8.89474 5.60151 8.17131 6.51939 8.17131H13.4812C14.3991 8.17131 15.1431 8.89474 15.1431 9.78712V16.5555C15.1431 17.4479 14.3991 18.1713 13.4812 18.1713H6.51939C5.60151 18.1713 4.85742 17.4479 4.85742 16.5555V9.78712Z" fill="#009EBA"/>
              <path d="M15.6996 1.71387C13.6565 1.71387 12.0003 3.3701 12.0003 5.41318V7.42815H13.8638V5.41318C13.8638 4.3993 14.6857 3.57735 15.6996 3.57735C16.7135 3.57735 17.5354 4.3993 17.5354 5.41318V7.42815H19.3989V5.41318C19.3989 3.3701 17.7427 1.71387 15.6996 1.71387Z" fill="#009EBA"/>
            </svg>
          </button>

          <button 
            className="bottomTrigger" 
            id="bottomTrigger"
            onClick={handleBottomTriggerClick}
          >
            <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fill="currentColor" style={{color: 'var(--main-color)'}} d="M4 1.25C4 0.559375 3.44063 0 2.75 0H1.25C0.559375 0 0 0.559375 0 1.25V2.75C0 3.44063 0.559375 4 1.25 4H2.75C3.44063 4 4 3.44063 4 2.75V1.25ZM4 7.25C4 6.55937 3.44063 6 2.75 6H1.25C0.559375 6 0 6.55937 0 7.25V8.75C0 9.44063 0.559375 10 1.25 10H2.75C3.44063 10 4 9.44063 4 8.75V7.25ZM5 1.25V2.75C5 3.44063 5.55937 4 6.25 4H7.75C8.44063 4 9 3.44063 9 2.75V1.25C9 0.559375 8.44063 0 7.75 0H6.25C5.55937 0 5 0.559375 5 1.25ZM9 7.25C9 6.55937 8.44063 6 7.75 6H6.25C5.55937 6 5 6.55937 5 7.25V8.75C5 9.44063 5.55937 10 6.25 10H7.75C8.44063 10 9 9.44063 9 8.75V7.25ZM10 1.25V2.75C10 3.44063 10.5594 4 11.25 4H12.75C13.4406 4 14 3.44063 14 2.75V1.25C14 0.559375 13.4406 0 12.75 0H11.25C10.5594 0 10 0.559375 10 1.25ZM14 7.25C14 6.55937 13.4406 6 12.75 6H11.25C10.5594 6 10 6.55937 10 7.25V8.75C10 9.44063 10.5594 10 11.25 10H12.75C13.4406 10 14 9.44063 14 8.75V7.25Z" />
            </svg>
          </button>

          <button className="upButton" id="upButton" style={{display: 'none'}}>
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512">
              <path fill="currentColor" style={{color: 'var(--main-color)'}} d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/>
            </svg>
          </button>

          <button className="upSaved" id="upSaved" style={{display: 'none'}}>
            <svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512">
              <path fill="#009eba" d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}