// import data.js
// import { lottoMaxWinningNumbers2023 } from './data.js'

// import data.js
//import { lottoMaxWinningNumbers2023 } from './5656.js'

// Use global variable instead of import
const lottoMaxWinningNumbers2023 = window.lottoMaxWinningNumbers2023 || []

const colors = {}
const activeNumbers = new Set()
let firstSevenToggled = []
let additionalToggled = []
let notYetToggled = Array.from({ length: 50 }, (_, i) => i + 1)

let dataToShow = [] // Declare at a higher scope

let isActiveOnBeforeHorizontal = false // New variable to remember isActive state
let activeLinkId = null
let previousDataToShow = []

// Other functions and initialization code here

// Initialize dataToShow with the full dataset first
dataToShow = [...lottoMaxWinningNumbers2023]

initializeNumberGrid()
initializeEventListeners()

// Call this function to initially populate the table with all data
populateWinningNumbersTable(dataToShow)

// Call the triggerLoad function after everything else is set up
triggerLoad()

// OnLoad function
function triggerLoad() {
  // Ensure data is properly initialized first
  if (!dataToShow || dataToShow.length === 0) {
    dataToShow = [...lottoMaxWinningNumbers2023]
  }

  setTimeout(function () {
    // Re-populate the table with the correct data after timeout
    populateWinningNumbersTable(dataToShow)

    updateUIBasedOnActiveLink()

    updateLastDrawDateDisplay() // Include this to ensure it updates on load

    updateAllOffButtonOpacity(activeNumbers)

    document.getElementById('downSaved').style.display = 'none'
    document.getElementById('upSaved').style.display = 'none'

    // Hide both lockSavedButton and unLockSavedButton based on bottomTrigger visibility
    const bottomTriggerButton = document.getElementById('bottomTrigger')
    const lockSavedButton = document.getElementById('lockSaved')
    const unLockSavedButton = document.getElementById('unLockSaved')

    if (bottomTriggerButton && bottomTriggerButton.style.display !== 'none') {
      lockSavedButton.style.display = 'none'
      unLockSavedButton.style.display = 'none'
    }

    updateClearButtonContent()
    greyedCascadeButton()

    // ZAP
    // Only send analytics once
    if (!window.analyticsLoaded) {
      window.analyticsLoaded = true

      fetch('https://ipapi.co/json/')
        .then((response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok')
          }
          return response.json()
        })
        .then((data) => {
          const formData = new FormData()
          formData.append('event', 'page_load')
          formData.append('timestamp', new Date().toISOString())
          formData.append('userAgent', navigator.userAgent)
          formData.append(
            'screenResolution',
            `${window.screen.width}x${window.screen.height}`
          )
          formData.append('location', window.location.href)
          formData.append('ip', data.ip)
          formData.append('city', data.city)
          formData.append('country', data.country_name)
          formData.append('latitude', String(data.latitude))
          formData.append('longitude', String(data.longitude))
          formData.append(
            'uuid',
            window.screen.width + 'x' + window.screen.height
          )

          return fetch(
            'https://hooks.zapier.com/hooks/catch/9135782/2is4g4a/',
            {
              method: 'POST',
              mode: 'no-cors',
              body: formData,
            }
          )
        })
    }
    // .catch(() => {
    //   const formData = new FormData()
    //   formData.append('event', 'page_load')
    //   formData.append('timestamp', new Date().toISOString())
    //   formData.append('userAgent', navigator.userAgent)
    //   formData.append(
    //     'screenResolution',
    //     `${window.screen.width}x${window.screen.height}`
    //   )
    //   formData.append('location', window.location.href)
    //   formData.append('ip', 'API Error')
    //   formData.append('city', 'API Error')
    //   formData.append('country', 'API Error')
    //   formData.append('latitude', 'API Error')
    //   formData.append('longitude', 'API Error')

    //   return fetch('https://hooks.zapier.com/hooks/catch/9135782/2is4g4a/', {
    //     method: 'POST',
    //     mode: 'no-cors',
    //     body: formData,
    //   })
    // })

    // End Zap

    // Call this on page load
    window.addEventListener('load', triggerLoad)

    // Set the "Latest" bottomSelector on by default
    const bottomSelectors = document.querySelectorAll('.bottomSelector')
    if (bottomSelectors.length > 0) {
      bottomSelectors[0].classList.add('on') // Assuming the first selector is "Latest"
      bottomSelectors[0].classList.remove('off')
    }

    // Turn on the latest row of numbers by default
    if (lottoMaxWinningNumbers2023.length > 0 && dataToShow.length > 0) {
      const latestDrawIndex = 0 // The latest draw is at the top of the list
      toggleNumbersFromDraw(latestDrawIndex) // Toggle numbers from the latest draw
      updateDrawDetails(latestDrawIndex) // Update draw details for the latest draw
      // Ensure button appearance is updated after initial load
      updateButtonAppearance()
      // Refresh the winning numbers table to apply all styling
      populateWinningNumbersTable(dataToShow)
    }
  }, 100)
}

function initializeNumberGrid() {
  const tableBody = document.querySelector('table tbody')
  for (let i = 0; i < 10; i++) {
    const row = tableBody.insertRow()
    for (let j = 1; j <= 5; j++) {
      const cell = row.insertCell()
      cell.appendChild(createNumberButton(i * 5 + j))
    }
  }
}

function initializeEventListeners() {
  document.querySelectorAll('#linkList a').forEach((link) => {
    link.addEventListener('click', toggleOn)
  })
  document
    .querySelector('.allOff')
    .addEventListener('click', toggleOffAllButtons)
  document
    .querySelector('.downButton')
    .addEventListener('click', toggleNumbersAndAdvance)
}

function createNumberButton(number, isBonus = false) {
  const button = document.createElement('button')
  button.textContent = number
  button.setAttribute('data-number', number)
  button.classList.add('saved-number-button')
  button.classList.toggle('bonus', isBonus)
  button.style.opacity = isBonus ? '0.5' : '1'
  button.addEventListener('click', () => toggleColor(button))
  return button
}

// Toggle on individual buttons
function toggleColor(button) {
  const number = parseInt(button.getAttribute('data-number'))
  const isActivated = activeNumbers.has(number)
  isActivated ? activeNumbers.delete(number) : activeNumbers.add(number)
  updateToggleSequence(number, !isActivated)
  updateUI()
  updateFrequencyDisplay() // This should update the frequency display
  // Check and toggle save button state
  checkAndToggleSaveButtonState()
  updateAllOffButtonOpacity(activeNumbers)
}

// Remember the toggle sequence
function updateToggleSequence(number, isActive) {
  const wasInFirstSeven = firstSevenToggled.includes(number)
  const wasInAdditional = additionalToggled.includes(number)
  const indexInNotYetToggled = notYetToggled.indexOf(number)

  if (isActive) {
    if (firstSevenToggled.length < 7 && !wasInFirstSeven) {
      firstSevenToggled.push(number)
      if (indexInNotYetToggled > -1)
        notYetToggled.splice(indexInNotYetToggled, 1)
    } else if (!wasInFirstSeven && !wasInAdditional) {
      additionalToggled.push(number)
      if (indexInNotYetToggled > -1)
        notYetToggled.splice(indexInNotYetToggled, 1)
    }
    activeNumbers.add(number)
  } else {
    const indexInFirstSeven = firstSevenToggled.indexOf(number)
    if (indexInFirstSeven > -1) {
      firstSevenToggled.splice(indexInFirstSeven, 1)
      notYetToggled.push(number)
      if (additionalToggled.length > 0) {
        const movedNumber = additionalToggled.shift()
        firstSevenToggled.push(movedNumber)
        updateButtonAppearance(movedNumber) // Update appearance for newly moved number
      }
    } else {
      const indexInAdditional = additionalToggled.indexOf(number)
      if (indexInAdditional > -1) {
        additionalToggled.splice(indexInAdditional, 1)
        notYetToggled.push(number)
      }
    }
    activeNumbers.delete(number)
  }

  updateButtonAppearance(number) // Update appearance for the toggled number

  // Log the current state of toggled numbers
  // console.log('First Seven Toggled:', firstSevenToggled)
  // console.log('Additional Toggled:', additionalToggled)
  // console.log('Not Yet Toggled:', notYetToggled)
}

// Set the colour of the buttons when toggled on/off or over 7
function updateButtonAppearance() {
  document.querySelectorAll('button[data-number]').forEach((button) => {
    const number = parseInt(button.getAttribute('data-number'))

    if (firstSevenToggled.includes(number)) {
      // Style for numbers in the first seven toggled
      button.classList.add('toggled-on')
      button.style.backgroundColor = getColor(number)
      button.style.color = '#fff' // Set text color to white when toggled on
      button.style.textShadow = '' // Default text shadow
    } else if (additionalToggled.includes(number)) {
      // Style for numbers in the additional toggled
      button.classList.add('toggled-on')
      button.style.backgroundColor = getColor(number)
      button.style.color = 'black' // Black text color
      button.style.textShadow = 'none' // No text shadow
    } else {
      // Style for all other numbers
      button.classList.remove('toggled-on')
      if (firstSevenToggled.length >= 7) {
        button.style.backgroundColor = '#1C1C1C' // Darker BG color for remaining numbers
        button.style.color = '#8A8A8A' // Grey text color for contrast
        button.style.opacity = '1' // Maintain full opacity
      } else {
        button.style.backgroundColor = '' // Use CSS default
        button.style.color = '' // Reset to default color
        button.style.opacity = '1' // Maintain full opacity
      }
      button.style.textShadow = ''
    }
  })

  // Apply similar styling for saved number buttons
  document
    .querySelectorAll('#savedUmbersID .saved-number-button')
    .forEach((button) => {
      const number = parseInt(button.getAttribute('data-number'))

      if (firstSevenToggled.includes(number)) {
        button.classList.add('toggled-on')
        button.style.color = '#fff' // White for first seven toggled
      } else if (additionalToggled.includes(number)) {
        button.classList.add('toggled-on')
        button.style.color = 'black' // Black for additional toggled
      } else {
        button.classList.remove('toggled-on')
        button.style.color =
          firstSevenToggled.length >= 7 ? '#009eba' : '#8deeff' // Grey if 7 or more toggled, else default color
        button.style.textShadow = firstSevenToggled.length >= 7 ? 'none' : '' // text shadow
      }
    })
}

// Common function to update UI based on the active link
function updateUIBasedOnActiveLink(clickedLink) {
  let rowCount
  const mostFrequentResults = document.getElementById('frequencyResults')
  const pairFrequencies = document.getElementById('pairFrequency')

  // Check if the clicked link is currently active
  const isActive = clickedLink && clickedLink.classList.contains('on')

  // Toggle 'on' class for the clicked link and update display accordingly
  const links = document.querySelectorAll('#linkList a')
  if (isActive) {
    clickedLink.classList.remove('on')
    mostFrequentResults.style.display = 'none'
    pairFrequencies.style.display = 'none'
    rowCount = lottoMaxWinningNumbers2023.length
  } else {
    links.forEach((link) => link.classList.remove('on'))
    if (clickedLink) {
      clickedLink.classList.add('on')
      // Set display based on the clicked link's ID
      if (clickedLink.id === 'pairs') {
        pairFrequencies.style.display = 'block'
        mostFrequentResults.style.display = 'none'
      } else {
        mostFrequentResults.style.display = 'block'
        pairFrequencies.style.display = 'none'
      }
      rowCount =
        clickedLink.getAttribute('data-rows') === 'all'
          ? lottoMaxWinningNumbers2023.length
          : parseInt(clickedLink.getAttribute('data-rows'), 10)

      console.log(
        `Selected ${clickedLink.textContent} tab, showing ${rowCount} rows`
      )
    } else {
      // No link clicked, hide both divs
      mostFrequentResults.style.display = 'none'
      pairFrequencies.style.display = 'none'
      rowCount = lottoMaxWinningNumbers2023.length
    }
  }

  dataToShow = lottoMaxWinningNumbers2023.slice(0, rowCount)
  populateWinningNumbersTable(dataToShow)
  updateButtonAppearance()
  updateFrequencyDisplay()
  displayMostFrequentNumbers()
  displayPairsInDifferentDraws()
}

// Toggle data to show and toggle visibility of mostFrequentResults
function toggleOn(event) {
  event.preventDefault()
  const clickedLink = event.currentTarget

  // Save the ID of the active link
  activeLinkId = clickedLink.id
  previousDataToShow = [...dataToShow]

  // Log the active link ID to the console
  // console.log('Active Link ID:', activeLinkId)

  // Update UI based on the clicked link
  updateUIBasedOnActiveLink(clickedLink)
}

document.querySelectorAll('#linkList a').forEach((link) => {
  link.addEventListener('click', toggleOn)
})

// Set Colors for numbers
function getColor(number) {
  if (colors[number]) return colors[number]
  const hue = 360 - (number - 1) * (360 / 50)
  colors[number] = `hsl(${hue}, 100%, 69%)`
  return colors[number]
}

// Function to update the last draw date display
function updateLastDrawDateDisplay() {
  const lastDrawDateDiv = document.getElementById('lastDrawDateDisplay')
  // Get the date of the oldest draw from dataToShow
  const oldestDrawDate =
    dataToShow.length > 0 ? dataToShow[dataToShow.length - 1].date : 'N/A'
  const numberOfDraws = dataToShow.length // Number of draws currently visible

  // Update the text content to include the number of draws and the oldest draw date
  lastDrawDateDiv.textContent = `${numberOfDraws} draws since ${oldestDrawDate}`
}

// Populate the winning numbers table with provided data
function populateWinningNumbersTable(draws) {
  const tableBody = document.querySelector('#winningNumbersTable table tbody')
  if (!tableBody) return // Exit if table body doesn't exist

  tableBody.innerHTML = '' // Clear the table first

  // Ensure draws is an array and has content
  if (!draws || !Array.isArray(draws) || draws.length === 0) {
    console.warn('No draws data provided to populate table')
    return
  }

  // Check if 'around' tab is active and a number is selected
  let dimNonNeighbours = false
  let selectedNumber = null
  let neighbourPositions = new Set()

  const pairTabAro = document.getElementById('pairTab_around')
  if (pairTabAro && pairTabAro.classList.contains('pairTab-active')) {
    const toggledNumbers = [...firstSevenToggled, ...additionalToggled]
    if (toggledNumbers.length > 0) {
      dimNonNeighbours = true
      selectedNumber = toggledNumbers[0]

      // Find all (row,col) positions of selectedNumber in the grid
      const positions = []
      draws.forEach((draw, rowIndex) => {
        draw.numbers.forEach((num, colIndex) => {
          if (num === selectedNumber) {
            positions.push([rowIndex, colIndex])
          }
        })
      })

      // For each position of the selected number, mark all 8-way neighbours
      const offsets = [
        [-1, -1],
        [-1, 0],
        [-1, +1],
        [0, -1],
        [0, 0],
        [0, +1],
        [+1, -1],
        [+1, 0],
        [+1, +1],
      ]

      positions.forEach(([row, col]) => {
        offsets.forEach(([dr, dc]) => {
          const newRow = row + dr
          const newCol = col + dc
          if (
            newRow >= 0 &&
            newRow < draws.length &&
            newCol >= 0 &&
            newCol < 7
          ) {
            neighbourPositions.add(`${newRow},${newCol}`)
          }
        })
      })
    }
  }

  draws.forEach((draw, index) => {
    const row = tableBody.insertRow()

    // Append each winning number as a cell
    draw.numbers.concat(draw.bonus).forEach((number, numIndex) => {
      const numberCell = row.insertCell()
      const numberButton = createNumberButton(
        number,
        numIndex === draw.numbers.length
      ) // Mark bonus number

      // Reset button styles to default first
      // Check if this is a bonus button (either by index or by class)
      const isBonus =
        numIndex === draw.numbers.length ||
        numberButton.classList.contains('bonus')

      // Set opacity - bonus always 0.5, others depend on toggle state
      if (isBonus) {
        numberButton.style.opacity = '0.5'
      } else {
        // For regular numbers, keep full opacity
        numberButton.style.opacity = '1'
      }

      // Set appropriate styling based on whether 7 or more are toggled
      if (firstSevenToggled.length >= 7 && !activeNumbers.has(number)) {
        // Apply darker background for all non-toggled numbers when 7+ are selected
        numberButton.style.backgroundColor = '#1C1C1C'
        numberButton.style.color = '#8A8A8A' // Grey text when 7 or more are toggled
      } else if (!activeNumbers.has(number)) {
        numberButton.style.backgroundColor = ''
        numberButton.style.color = '' // Default color when less than 7
      }
      numberButton.style.textShadow = ''

      // For bonus numbers, apply darker styling when 7 or more are toggled
      if (numIndex === draw.numbers.length) {
        // Bonus numbers ALWAYS have 0.5 opacity
        numberButton.style.opacity = '0.5'

        // Ensure the bonus class is set
        if (!numberButton.classList.contains('bonus')) {
          numberButton.classList.add('bonus')
        }

        if (firstSevenToggled.length >= 7) {
          numberButton.style.backgroundColor = '#1C1C1C'
          numberButton.style.color = '#8A8A8A'
        }
      }

      // Apply dimming if needed (only for main numbers, not bonus)
      // But skip dimming if the number is toggled on
      if (
        dimNonNeighbours &&
        numIndex < 7 &&
        !neighbourPositions.has(`${index},${numIndex}`) &&
        !activeNumbers.has(number)
      ) {
        numberButton.style.opacity = '0.5'
        numberButton.style.backgroundColor = '#242424'
        numberButton.style.color = '#444444'
        numberButton.style.textShadow = 'none'
      }

      // Apply darker grey to bonus numbers when 'around' tab is active
      // But skip if the bonus number is toggled on
      if (
        dimNonNeighbours &&
        numIndex === draw.numbers.length &&
        !activeNumbers.has(number)
      ) {
        // Keep 0.5 opacity for bonus numbers (not 0.4)
        numberButton.style.opacity = '0.5'
        numberButton.style.backgroundColor = '#1C1C1C'
        numberButton.style.color = '#333333'
        numberButton.style.textShadow = 'none'
      }

      numberCell.appendChild(numberButton)

      // Apply toggled-on style if the number is active
      if (activeNumbers.has(number)) {
        numberButton.classList.add('toggled-on')
        numberButton.style.backgroundColor = getColor(number)

        // Determine text color based on number range and toggled state
        if (firstSevenToggled.includes(number)) {
          numberButton.style.color = '#fff' // White for first seven toggled
          numberButton.style.textShadow = '' // Default text shadow for first seven
        } else if (additionalToggled.includes(number)) {
          numberButton.style.color = 'black' // Black for additional toggled
          numberButton.style.textShadow = 'none' // No text shadow for additional
        } else {
          // For any other active numbers (shouldn't happen in normal flow)
          numberButton.style.color = '#fff'
          numberButton.style.textShadow = ''
        }

        // Override dimming styles for toggled numbers, but keep bonus opacity
        if (
          !numberButton.classList.contains('bonus') &&
          numIndex !== draw.numbers.length
        ) {
          numberButton.style.opacity = '1'
        }
      }
    })

    // Update the last draw date display for the last row
    if (index === draws.length - 1) {
      updateLastDrawDateDisplay(draw.date) // Ensure this function is defined
    }
  })
  updateLastDrawDateDisplay()
}

// Turn everything OFF
function toggleOffAllButtons() {
  if (activeNumbers.size > 0) {
    // console.log('Toggling off numbers:', Array.from(activeNumbers))
  } else {
    // console.log('No numbers are currently toggled on.')
  }

  // Reset the saved numbers table rows opacity to 100%
  const savedNumbersTable = document
    .getElementById('savedUmbersID')
    .querySelector('table')
  if (savedNumbersTable) {
    for (let row of savedNumbersTable.rows) {
      row.style.opacity = '1' // Reset opacity
    }
  }

  // Clear the lists and reset states
  activeNumbers.clear()
  firstSevenToggled = []
  additionalToggled = []
  notYetToggled = Array.from({ length: 50 }, (_, i) => i + 1)

  // Reset the display of selected numbers and button appearances
  displaySelectedNumbers()
  updateButtonAppearance()
  updateFrequencyDisplay()
  displayPairsInDifferentDraws()
  displayMostFrequentNumbers()
  calculateAndDisplaySum()
  checkAndToggleSaveButtonState()
  updateDrawDetailsVisibility()
  currentRowIndex = -1 // Reset the current row index
  updateUI()
  updateAllOffButtonOpacity(activeNumbers)
  // updateFocusOnDisplay()

  // Turn off all selectors in the bottomContainer
  document.querySelectorAll('.bottomSelector').forEach((selector) => {
    selector.classList.remove('on')
    selector.classList.add('off')
  })

  document.querySelectorAll('button[data-number]').forEach((button) => {
    button.style.backgroundColor = ''
    button.style.color = ''
    // Keep opacity 0.5 for bonus buttons, reset for others
    if (button.classList.contains('bonus')) {
      button.style.opacity = '0.5'
    } else {
      button.style.opacity = ''
    }
    button.classList.remove('toggled-on')
  })
  // Reset the cascadeButton
  resetCascadeButton()
}

// Opacity of delet button
function updateAllOffButtonOpacity(activeNumbers) {
  const allOffButton = document.getElementById('allOff')

  if (activeNumbers.size === 0) {
    allOffButton.style.opacity = '0.25' // 25% opacity
    allOffButton.style.filter = 'grayscale(1)' // Full grayscale
  } else {
    allOffButton.style.opacity = '1' // 100% opacity
    allOffButton.style.filter = 'grayscale(0)' // No grayscale
  }
}

// Display Selected Numbers in the 7 boxes
function displaySelectedNumbers() {
  const sortedFirstSeven = [...firstSevenToggled].sort((a, b) => a - b) // Sort the array in ascending order
  const chosenNumberElements = document.querySelectorAll(
    '.selectedNumbersRow .chosen_number'
  )

  chosenNumberElements.forEach((element, index) => {
    if (index < sortedFirstSeven.length) {
      element.textContent = sortedFirstSeven[index]
      element.parentNode.style.borderColor = getColor(sortedFirstSeven[index]) // Set border color based on the number
      element.style.color = '#fff' // Set text color to white for non-empty slots
    } else {
      element.textContent = '•'
      element.parentNode.style.borderColor = '' // Reset border color for empty slots
      element.style.color = '#242424' // Set text color to #242424 for the bullet point
    }
  })
}

// Check Bottom Selectors
function checkBottomSelectors() {
  let isAnySelectorOn = false

  document.querySelectorAll('.bottomSelector').forEach((selector, index) => {
    if (areAllNumbersFromDrawToggledOn(index)) {
      selector.classList.add('on')
      selector.classList.remove('off')
      isAnySelectorOn = true // Set flag if any selector is on

      // Log when a selector is set to 'on'
      // console.log(`Selector at index ${index} is set to 'on'.`)
    } else {
      selector.classList.remove('on')
      selector.classList.add('off')
    }
  })

  // Update button visibility based on the state of bottom selectors
  updateButtonVisibility(isAnySelectorOn)
}

// Function to check if toggled numbers match any draw index
function checkForMatchingDrawIndex() {
  // Check if exactly 7 numbers are toggled on
  if (activeNumbers.size === 7) {
    for (let index = 0; index < lottoMaxWinningNumbers2023.length; index++) {
      const drawNumbersSet = new Set(lottoMaxWinningNumbers2023[index].numbers)
      const isMatch = Array.from(activeNumbers).every((number) =>
        drawNumbersSet.has(number)
      )

      if (isMatch) {
        // console.log(`Matching draw found for index: ${index}`)
        updateDrawDetails(index) // Update draw details for the matched index
        return
      }
    }
    // console.log('No matching draw found.')
    // Hide draw details if no match is found
    updateDrawDetailsVisibility(false)
  } else {
    // console.log('Less than 7 numbers toggled, not checking for matching draw.')
    // Hide draw details if not enough numbers are toggled
    updateDrawDetailsVisibility(false)
  }
}

// Check if all numbers from a specific draw index are toggled on
function areAllNumbersFromDrawToggledOn(drawIndex) {
  if (drawIndex < 0 || drawIndex >= lottoMaxWinningNumbers2023.length) {
    // console.log(`Invalid draw index: ${drawIndex}`)
    return false
  }

  checkForMatchingDrawIndex()
  // Get only the main draw numbers, excluding the bonus number
  const drawNumbers = lottoMaxWinningNumbers2023[drawIndex].numbers
  let allToggledOn = true

  for (const number of drawNumbers) {
    if (!activeNumbers.has(number)) {
      // console.log(`Number not toggled on: ${number} in draw index ${drawIndex}`)
      allToggledOn = false
      //updateDrawDetailsVisibility() // Hide draw details
    }
  }

  // Log the overall result
  // console.log`Draw index: ${drawIndex}, All main numbers toggled on: ${allToggledOn}`()
  return allToggledOn
}

// Update the toggleSelectorState function
function toggleSelectorState(selector, index) {
  // Check the current state of the selector
  if (selector.classList.contains('on')) {
    // If it's currently 'on', set it to 'off'
    selector.classList.remove('on')
    selector.classList.add('off')
    updateDrawDetailsVisibility() // Hide draw details
    firstSevenToggled = []
    additionalToggled = []
    activeNumbers.clear()
    updateButtonAppearance()
    displaySelectedNumbers()
    updateFrequencyDisplay()
    displayPairsInDifferentDraws() // Call displayPairsInDifferentDraws after updating firstSevenToggled
    displayMostFrequentNumbers() // Update most frequent numbers display
    checkAndToggleSaveButtonState()
    updateAllOffButtonOpacity(activeNumbers)
    calculateAndDisplaySum()
    resetCascadeButton()
    // console.log('Selector toggled off');
  } else {
    // If it's currently 'off', set it to 'on'
    document
      .querySelectorAll('.bottomSelector')
      .forEach((el) => el.classList.remove('on'))
    selector.classList.remove('off')
    selector.classList.add('on')
    toggleNumbersFromDraw(index)
    updateDrawDetails(index) // Update and display draw details
    updateFrequencyDisplay()
    displayPairsInDifferentDraws() // Call displayPairsInDifferentDraws after updating firstSevenToggled
    displayMostFrequentNumbers() // Update most frequent numbers display
    // console.log('Selector toggled on')
    calculateAndDisplaySum()
    checkAndToggleSaveButtonState()
    updateAllOffButtonOpacity(activeNumbers)
    // resetCascadeButton() // resets
    greyedCascadeButton()
  }
}

// Function to toggle numbers from a specific draw index
function toggleNumbersFromDraw(drawIndex) {
  if (drawIndex < 0 || drawIndex >= lottoMaxWinningNumbers2023.length) {
    console.log('Invalid draw index')
    return
  }

  // Clear current selections
  firstSevenToggled = []
  additionalToggled = []
  activeNumbers.clear()

  const numbersToToggle = lottoMaxWinningNumbers2023[drawIndex].numbers
  numbersToToggle.forEach((number, idx) => {
    if (idx < 7) {
      firstSevenToggled.push(number)
    } else {
      additionalToggled.push(number)
    }
    activeNumbers.add(number)
  })

  updateButtonAppearance()
  displaySelectedNumbers()
  checkAndToggleSaveButtonState()
}

// A mapping of month names to their numerical values
const monthMap = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
}

// Function to update draw details
function updateDrawDetails(drawIndex) {
  // Validate drawIndex
  if (drawIndex < 0 || drawIndex >= lottoMaxWinningNumbers2023.length) {
    // console.log('Invalid draw index')
    return
  }

  // Get the draw details
  const drawDetails = lottoMaxWinningNumbers2023[drawIndex]
  let drawDate = drawDetails.date

  // Process the date
  const dateParts = drawDate.split(' ') // Splitting date into parts
  const month = monthMap[dateParts[0]].toString().padStart(2, '0') // Convert month name to number and pad with zero
  const day = dateParts[1].slice(0, -1).padStart(2, '0') // Remove comma from the day and pad with zero
  const year = dateParts[2].slice(-2) // Get last two digits of the year

  // Formatting the date
  drawDate = `${day}.${month}.${year}`

  // Format the jackpot amount to display in millions
  const jackpot = `$${drawDetails.jackpot / 1000000} million`

  // Get the drawDetails div and update its content
  const detailsDiv = document.querySelector('.drawDetails')
  detailsDiv.style.display = 'block' // Make it visible
  detailsDiv.innerHTML = `${drawDate} ~ ${jackpot}`

  // Check if any bottomSelector is 'on'
  const isAnySelectorOn = Array.from(
    document.querySelectorAll('.bottomSelector')
  ).some((el) => el.classList.contains('on'))
  // )

  // Update the visibility of left and right buttons
  updateButtonVisibility(isAnySelectorOn)
  checkAndToggleSaveButtonState()
}

// Update Draw Details Visibility function
function updateDrawDetailsVisibility() {
  const detailsDiv = document.querySelector('.drawDetails')
  let isAnySelectorOn = false

  // Check if any of the selectors is in the 'on' state
  document.querySelectorAll('.bottomSelector').forEach((selector, index) => {
    if (selector.classList.contains('on')) {
      isAnySelectorOn = true
    }
  })

  // If any selector is 'on', display draw details, else hide them
  detailsDiv.style.display = isAnySelectorOn ? 'block' : 'none'

  // Update the visibility of left and right buttons
  updateButtonVisibility()
}

// length of lottoMaxWinningNumbers2023
function updateAllLinkText() {
  const allLink = document.querySelector('#allLink')
  if (allLink && Array.isArray(lottoMaxWinningNumbers2023)) {
    allLink.textContent = lottoMaxWinningNumbers2023.length + 'd'
  }
}

// Function to get frequency of each number for a given subset of draws
function getNumberFrequencies(drawsSubset) {
  const frequencies = {}
  drawsSubset.forEach((draw) => {
    draw.numbers.forEach((number) => {
      frequencies[number] = (frequencies[number] || 0) + 1
    })
  })
  return frequencies
}

// Function to display pairs of numbers with their frequency in days and dates in a table
function displayPairsInDifferentDraws() {
  let pairOccurrences = {}

  // Populate pair occurrences from lottoMaxWinningNumbers2023
  lottoMaxWinningNumbers2023.forEach((draw) => {
    draw.numbers.forEach((num1, i) => {
      draw.numbers.slice(i + 1).forEach((num2) => {
        let pair = [num1, num2].sort((a, b) => a - b).join(' + ')
        pairOccurrences[pair] = (pairOccurrences[pair] || new Set()).add(
          draw.date
        )
      })
    })
  })

  // Combine firstSevenToggled and additionalToggled arrays
  const combinedToggled = [...firstSevenToggled, ...additionalToggled]

  // Create table elements
  const table = document.createElement('table')
  const tbody = table.createTBody()

  if (combinedToggled.length === 1) {
    // If only one number is selected, show all pairs with that number, grouped by frequency
    const selectedNumber = combinedToggled[0]
    let pairFreqs = {}
    for (let pair in pairOccurrences) {
      const [num1, num2] = pair.split(' + ').map(Number)
      if (num1 === selectedNumber || num2 === selectedNumber) {
        const other = num1 === selectedNumber ? num2 : num1
        const freq = pairOccurrences[pair].size
        if (!pairFreqs[freq]) pairFreqs[freq] = []
        pairFreqs[freq].push([selectedNumber, other])
      }
    }
    // Sort frequencies in descending order
    const sortedFrequencies = Object.keys(pairFreqs).sort((a, b) => b - a)
    if (sortedFrequencies.length === 0) {
      // No pairs found for the selected number
      const row = tbody.insertRow()
      const frequencyCell = row.insertCell()
      frequencyCell.textContent = '0x:'
      const pairsCell = row.insertCell()
      pairsCell.innerHTML = '<span style="color:#009eba;">—</span>'
    } else {
      sortedFrequencies.forEach((freq) => {
        const row = tbody.insertRow()
        const frequencyCell = row.insertCell()
        frequencyCell.textContent = `${freq}x:`
        const pairsCell = row.insertCell()
        pairsCell.innerHTML = pairFreqs[freq]
          .map(([num1, num2]) => {
            const style1 = ` style=\"background-color: ${getColor(
              num1
            )}; color: black; border-radius: 4px; padding: 0 .25rem;\"`
            // The other number (num2) and the + use the #pairFrequency color
            return `<span style=\"white-space: nowrap;\"><span${style1}>${num1}</span> <span style=\"color:#009eba;\">+</span> <span style=\"color:#009eba;\">${num2}</span></span>`
          })
          .join(' &nbsp; ')
      })
    }
  } else {
    // Generate all unique pairs from combinedToggled
    const toggledPairs = new Set()
    combinedToggled.forEach((num1, i) => {
      combinedToggled.slice(i + 1).forEach((num2) => {
        toggledPairs.add([num1, num2].sort((a, b) => a - b).join(' + '))
      })
    })

    // Group pairs by frequency
    let frequencies = {}
    Object.entries(pairOccurrences).forEach(([pair, dates]) => {
      if (toggledPairs.has(pair)) {
        let freq = dates.size
        if (!frequencies[freq]) frequencies[freq] = []
        frequencies[freq].push(pair)
      }
    })

    // Sort frequencies in descending order
    const sortedFrequencies = Object.keys(frequencies).sort((a, b) => b - a)
    sortedFrequencies.forEach((freq) => {
      const row = tbody.insertRow()
      const frequencyCell = row.insertCell()
      frequencyCell.textContent = `${freq}x:`
      const pairsCell = row.insertCell()

      pairsCell.innerHTML = frequencies[freq]
        .map((pair) => {
          // Split the pair to check individual numbers
          const [num1, num2] = pair.split(' + ').map(Number)
          const style1 =
            num1 === firstSevenToggled[0]
              ? ` style=\"background-color: ${getColor(
                  num1
                )}; color: black; border-radius: 4px; padding: 0 .25rem;\"`
              : ''
          const style2 =
            num2 === firstSevenToggled[0]
              ? ` style=\"background-color: ${getColor(
                  num2
                )}; color: black; border-radius: 4px; padding: 0 .25rem;\"`
              : ''
          return `<span style=\"white-space: nowrap;\"><span${style1}>${num1}</span> + <span${style2}>${num2}</span></span>`
        })
        .join(' &nbsp; ')
    })
  }

  // Append table to the div
  const pairFrequencyDiv = document.getElementById('pairFrequency')
  if (pairFrequencyDiv) {
    // Create tab bar
    pairFrequencyDiv.innerHTML = `
      <div style="display: flex; border-bottom: 1px solid #222; margin-bottom: 8px;">
        <div id="pairTab_selected" class="pairTab pairTab-active" style="padding: 4px 12px; cursor: pointer; border-bottom: 2px solid #009eba;">selected pairs</div>
        <div id="pairTab_around" class="pairTab" style="padding: 4px 12px; cursor: pointer;">around</div>
        <div id="pairTab_number" class="pairTab" style="padding: 4px 12px; cursor: pointer;"></div>
      </div>
      <div id="pairTabContent_selected"></div>
      <div id="pairTabContent_around" style="display:none; padding: 0 0 0 0; margin-top:0; color: #009eba; font-size: 1.2em;"></div>
      <div id="pairTabContent_number" style="display:none; padding: 8px 0 0 0; color: #009eba; font-size: 1.2em;"></div>
    `
    // Insert the table into the selected tab content
    const selectedContent = pairFrequencyDiv.querySelector(
      '#pairTabContent_selected'
    )
    if (selectedContent) selectedContent.appendChild(table)

    // Fill the 'around' tab with neighbour-tally data
    const aroundContent = pairFrequencyDiv.querySelector(
      '#pairTabContent_around'
    )
    const toggledNumbers = [...firstSevenToggled, ...additionalToggled]
    let aroundHTML = ''
    if (toggledNumbers.length === 0) {
      aroundHTML = ''
    } else {
      // Only show tally for the first toggled number
      const targetNumber = toggledNumbers[0]
      const tallyRaw = tallyNeighbours(targetNumber, lottoMaxWinningNumbers2023)
      // Build a map for quick lookup
      const tallyMap = new Map(
        tallyRaw.map((row) => [row.neighbour, row.touches])
      )
      // Build a frequency-to-numbers map
      const freqMap = {}
      for (let n = 1; n <= 50; n++) {
        // Do NOT skip the selected number itself
        const freq = tallyMap.get(n) || 0
        if (!freqMap[freq]) freqMap[freq] = []
        freqMap[freq].push(n)
      }
      // Sort frequencies descending
      const sortedFreqs = Object.keys(freqMap)
        .map(Number)
        .sort((a, b) => b - a)
      aroundHTML += `<table style=\"color:#8deeff;font-size:1em;margin-top:0;padding-top:0;\">`
      sortedFreqs.forEach((freq) => {
        const nums = freqMap[freq].sort((a, b) => a - b)
        const numsHTML = nums
          .map((n) => {
            if (toggledNumbers.includes(n)) {
              const textColor =
                n >= 1 && n <= 20 ? 'black !important' : '#242424 !important'
              const paddingStyle = n <= 9 ? '1px 7px' : '1px 5px'
              return `<span style='background:${getColor(
                n
              )};color:${textColor};border-radius:4px;padding:${paddingStyle};font-size:0.85em;vertical-align:top;'>${n}</span>`
            } else {
              // Match selected pairs: font-size 0.85em, color #009eba
              return `<span style='color:#009eba;font-size:0.85em;vertical-align:top;'>${n}</span>`
            }
          })
          .join(
            ' <span style="color:#009eba;font-size:0.85em;vertical-align:top;">•</span> '
          )
        aroundHTML += `<tr><td style='padding-right:0.5em; text-align:right; font-size:0.875rem; vertical-align:top;'>${freq}x:</td><td style='text-align:left; vertical-align:middle;'>${numsHTML}</td></tr>`
      })
      aroundHTML += '</table>'
    }
    if (aroundContent) aroundContent.innerHTML = aroundHTML

    // Tab switching logic (restore this!)
    const tabSel = pairFrequencyDiv.querySelector('#pairTab_selected')
    const tabAro = pairFrequencyDiv.querySelector('#pairTab_around')
    const tabNum = pairFrequencyDiv.querySelector('#pairTab_number')
    const contentSel = pairFrequencyDiv.querySelector(
      '#pairTabContent_selected'
    )
    const contentAro = pairFrequencyDiv.querySelector('#pairTabContent_around')
    const contentNum = pairFrequencyDiv.querySelector('#pairTabContent_number')

    // Remember last active tab across refreshes
    let lastActiveTab = window._lastPairTab || 'selected'
    function activateTab(tab) {
      if (tab === 'selected') {
        tabSel.classList.add('pairTab-active')
        tabAro.classList.remove('pairTab-active')
        tabNum.classList.remove('pairTab-active')
        contentSel.style.display = ''
        contentAro.style.display = 'none'
        contentNum.style.display = 'none'
        tabSel.style.borderBottom = '2px solid #009eba'
        tabAro.style.borderBottom = 'none'
        tabNum.style.borderBottom = 'none'
        tabSel.style.color = '#009eba'
        tabAro.style.color = '#009eba'
        tabNum.style.color = '#009eba'
        window._lastPairTab = 'selected'
        // Update winning numbers table when leaving 'around' tab
        populateWinningNumbersTable(dataToShow)
      } else if (tab === 'around') {
        tabAro.classList.add('pairTab-active')
        tabSel.classList.remove('pairTab-active')
        tabNum.classList.remove('pairTab-active')
        contentSel.style.display = 'none'
        contentAro.style.display = ''
        contentNum.style.display = 'none'
        tabAro.style.borderBottom = '2px solid #009eba'
        tabSel.style.borderBottom = 'none'
        tabNum.style.borderBottom = 'none'
        tabSel.style.color = '#009eba'
        tabAro.style.color = '#009eba'
        tabNum.style.color = '#009eba'
        window._lastPairTab = 'around'
        // Update winning numbers table when entering 'around' tab
        populateWinningNumbersTable(dataToShow)
      } else if (tab === 'number') {
        tabNum.classList.add('pairTab-active')
        tabSel.classList.remove('pairTab-active')
        tabAro.classList.remove('pairTab-active')
        contentSel.style.display = 'none'
        contentAro.style.display = 'none'
        contentNum.style.display = ''
        tabNum.style.borderBottom = '2px solid #009eba'
        tabSel.style.borderBottom = 'none'
        tabAro.style.borderBottom = 'none'
        tabSel.style.color = '#009eba'
        tabAro.style.color = '#009eba'
        tabNum.style.color = '#009eba'
        window._lastPairTab = 'number'
        // Update winning numbers table when leaving 'around' tab
        populateWinningNumbersTable(dataToShow)
      }
    }
    if (tabSel && tabAro && tabNum && contentSel && contentAro && contentNum) {
      tabSel.onclick = () => activateTab('selected')
      tabAro.onclick = () => activateTab('around')
      tabNum.onclick = () => activateTab('number')
      activateTab(lastActiveTab)
    }

    // --- Show toggled numbers in the 'around' tab label ---
    if (tabAro) {
      const toggledNumbers = [...firstSevenToggled, ...additionalToggled]
      let numHTML = ''
      if (toggledNumbers.length > 0) {
        const num = toggledNumbers[0]
        const textColor =
          num >= 1 && num <= 20 ? 'black !important' : '#242424 !important'
        const paddingStyle = num <= 9 ? '1px 7px' : '1px 5px'
        numHTML = `<span style=\"display:inline-block;margin-left:2px;margin-right:2px;padding:${paddingStyle};border-radius:4px;background:${getColor(
          num
        )};color:${textColor};font-size:0.85em;vertical-align:middle;\">${num}</span>`
      }
      tabAro.innerHTML = `around`
    }
    // --- Add number tab label ---
    if (tabNum) {
      const toggledNumbers = [...firstSevenToggled, ...additionalToggled]
      let numHTML = ''
      if (toggledNumbers.length > 0) {
        const num = toggledNumbers[0]
        const textColor =
          num >= 1 && num <= 20 ? 'black !important' : '#242424 !important'
        const paddingStyle = num <= 9 ? '1px 7px' : '1px 5px'
        numHTML = `<span style=\"display:inline-block;padding:${paddingStyle};border-radius:4px;background:${getColor(
          num
        )};color:${textColor};font-size:0.85em;vertical-align:middle;pointer-events:none;\">${num}</span>`
        tabNum.style.pointerEvents = 'none'
        tabNum.innerHTML = numHTML
      } else {
        tabNum.style.pointerEvents = 'none'
        tabNum.innerHTML = ''
      }
    }
    if (toggledNumbers.length === 0) {
      aroundHTML = ''
    } else {
      // Only show tally for the first toggled number
      const targetNumber = toggledNumbers[0]
      const tallyRaw = tallyNeighbours(targetNumber, lottoMaxWinningNumbers2023)
      // Build a map for quick lookup
      const tallyMap = new Map(
        tallyRaw.map((row) => [row.neighbour, row.touches])
      )
      // Build a frequency-to-numbers map
      const freqMap = {}
      for (let n = 1; n <= 50; n++) {
        // Do NOT skip the selected number itself
        const freq = tallyMap.get(n) || 0
        if (!freqMap[freq]) freqMap[freq] = []
        freqMap[freq].push(n)
      }
      // Sort frequencies descending
      const sortedFreqs = Object.keys(freqMap)
        .map(Number)
        .sort((a, b) => b - a)
      aroundHTML += `<table style=\"color:#8deeff;font-size:1em;margin-top:0;padding-top:0;\">`
      sortedFreqs.forEach((freq) => {
        const nums = freqMap[freq].sort((a, b) => a - b)
        const numsHTML = nums
          .map((n) => {
            if (toggledNumbers.includes(n)) {
              const textColor =
                n >= 1 && n <= 20 ? 'black !important' : '#242424 !important'
              const paddingStyle = n <= 9 ? '1px 7px' : '1px 5px'
              return `<span style='background:${getColor(
                n
              )};color:${textColor};border-radius:4px;padding:${paddingStyle};font-size:0.85em;vertical-align:top;'>${n}</span>`
            } else {
              // Match selected pairs: font-size 0.85em, color #009eba
              return `<span style='color:#009eba;font-size:0.85em;vertical-align:top;'>${n}</span>`
            }
          })
          .join(
            ' <span style="color:#009eba;font-size:0.85em;vertical-align:top;">•</span> '
          )
        aroundHTML += `<tr><td style='padding-right:0.5em; text-align:right; font-size:0.875rem; vertical-align:top;'>${freq}x:</td><td style='text-align:left; vertical-align:middle;'>${numsHTML}</td></tr>`
      })
      aroundHTML += '</table>'
    }
    // --- End toggled numbers in tab label ---
  }
}

// Function to update the frequency display
function updateFrequencyDisplay() {
  const frequencies = getNumberFrequencies(dataToShow)
  const chosenNumberElements = document.querySelectorAll(
    '.chosen_number_box .chosen_number'
  )
  const frequencyDivs = document.querySelectorAll(
    '.chosen_number_box .frequency'
  )
  const isLinkActive = Array.from(
    document.querySelectorAll('#linkList a')
  ).some((link) => link.classList.contains('on'))
  // )

  chosenNumberElements.forEach((element, index) => {
    const number = parseInt(element.textContent)
    if (!isNaN(number) && activeNumbers.has(number) && isLinkActive) {
      const frequency = frequencies[number] || 0
      frequencyDivs[index].textContent = `${frequency}x`
    } else {
      frequencyDivs[index].textContent = '  '
    }
  })
}

let specificNumbers = [] // Initialize specificNumbers array in an appropriate scope

// Add a global variable to track the checkbox state
let showBelowToggled = false

// Function to display the most frequent numbers in a table
function displayMostFrequentNumbers() {
  // Get currently selected tab
  const activeTimeLink = document.querySelector('#linkList a.on')

  // Get the tab name and rows for the active tab (8d, 13d, 21d, etc.)
  const activeTabName = activeTimeLink ? activeTimeLink.textContent : ''
  const activeTabRows = activeTimeLink
    ? activeTimeLink.getAttribute('data-rows') === 'all'
      ? lottoMaxWinningNumbers2023.length
      : parseInt(activeTimeLink.getAttribute('data-rows'), 10)
    : lottoMaxWinningNumbers2023.length

  // Find if a specific row is toggled on in the winning numbers
  const activeSelector = document.querySelector('.bottomSelector.on')
  const activeIndex = activeSelector
    ? Array.from(document.querySelectorAll('.bottomSelector')).indexOf(
        activeSelector
      )
    : -1

  // Create a separate variable for frequency calculation
  // This allows us to keep the same visual display but calculate frequencies differently
  let frequencyData = []

  // COMPLETELY NEW APPROACH:
  // 1. For each tab, define exactly how many draws to use total
  // 2. For each selected row, calculate exactly which draws should be below it
  // 3. Use the original data source to ensure consistency

  // If no row is toggled (activeIndex === -1), ignore the checkbox state and use all data
  if (activeIndex === -1) {
    frequencyData = [...dataToShow]
    console.log(
      `No row toggled: Using all ${frequencyData.length} draws from ${activeTabName} tab regardless of checkbox`
    )
  } else if (!showBelowToggled) {
    // When checkbox is NOT checked, use all data from the current tab view
    frequencyData = [...dataToShow]
    console.log(
      `Checkbox OFF: Using all ${frequencyData.length} draws from ${activeTabName} tab`
    )
  } else if (showBelowToggled && activeIndex !== -1) {
    // When checkbox IS checked, calculate draws below the selected row
    const bottomSelectorTitle = activeSelector.textContent
    const bottomSelectors = document.querySelectorAll('.bottomSelector')
    const numBottomSelectors = bottomSelectors.length

    // Get the total number of rows for each tab
    let totalRows = 0
    switch (activeTabName) {
      case '8d':
        totalRows = 8
        break
      case '13d':
        totalRows = 13
        break
      case '21d':
        totalRows = 21
        break
      case '34d':
        totalRows = 34
        break
      case '55d':
        totalRows = 55
        break
      case 'all':
      case '245d':
        totalRows = lottoMaxWinningNumbers2023.length
        break
      default:
        totalRows = 21 // Default to 21 if no tab selected
    }

    // If we're in 21d tab, handle calculation specifically
    if (activeTabName === '21d') {
      console.log(
        `21d TAB - DETAILED DEBUG: Row ${
          activeIndex + 1
        } selected, data length=${totalRows}, numBottomSelectors=${numBottomSelectors}`
      )

      // SPECIFIC HANDLING FOR 15TH ROW (LAST VISIBLE SELECTOR)
      // For the 21d tab, there are 21 data rows but only 15 bottom selectors
      // When the 15th row (index 14) is selected, we need to correctly map it
      if (activeIndex === numBottomSelectors - 1) {
        // If 15th row (index 14) is selected
        console.log(`21d TAB - 15TH ROW SPECIFIC HANDLING`)

        // When 15th selector is selected, we should have 6 draws below it (21 - 15 = 6)
        // We need to directly map this to the correct position in the dataset

        // The 15th selector should map to the 15th data row (index 14)
        // So draws below should be rows 15-20 (indices 15-20)
        frequencyData = []

        // Manually copy the draws to ensure we get exactly what we need
        for (let i = 15; i < 21; i++) {
          if (i < lottoMaxWinningNumbers2023.length) {
            frequencyData.push(lottoMaxWinningNumbers2023[i])
          }
        }

        console.log(
          `21d TAB - 15TH ROW: Using exactly ${frequencyData.length} draws below (should be 6)`
        )
        console.log(
          `21d TAB - Draws used: `,
          frequencyData.map(
            (draw, i) => `Draw ${i + 1}: ${draw.numbers.join(',')}`
          )
        )
      } else {
        // For other rows in 21d tab

        // Calculate expected draws below this row
        const drawsBelow = totalRows - (activeIndex + 1)
        console.log(`21d TAB - Expected draws below: ${drawsBelow}`)

        if (drawsBelow <= 0) {
          // No draws below this row
          frequencyData = []
          console.log(`21d TAB - ROW ${activeIndex + 1}: NO DRAWS BELOW`)
        } else {
          // CRITICAL FIX: For 5 or fewer rows remaining, use a different approach
          if (drawsBelow <= 5) {
            console.log(
              `21d TAB - SPECIAL HANDLING FOR ≤5 DRAWS: Using hardcoded range`
            )

            // Get the raw data for exactly the draws we need, without any intermediate variables
            // Copy the draws directly from the source
            frequencyData = []

            // Determine which positions we need in the original dataset
            // This is a row-by-row mapping for the critical range
            const startDrawIndex = activeIndex + 1

            // Direct copy of draw data for rows below the selected one
            for (
              let i = startDrawIndex;
              i < totalRows && i < lottoMaxWinningNumbers2023.length;
              i++
            ) {
              frequencyData.push(lottoMaxWinningNumbers2023[i])
            }

            console.log(
              `21d TAB - ROW ${activeIndex + 1}: DIRECT COPY - ${
                frequencyData.length
              } draws (should be ${drawsBelow})`
            )
            console.log(
              `21d TAB - Draws used: `,
              frequencyData.map(
                (draw, i) => `Draw ${i + 1}: ${draw.numbers.join(',')}`
              )
            )
          } else {
            // For more than 5 draws, use the normal approach
            const tabData = lottoMaxWinningNumbers2023.slice(0, totalRows)
            frequencyData = tabData.slice(activeIndex + 1)
            console.log(
              `21d TAB - ROW ${activeIndex + 1}: Using ${
                frequencyData.length
              } draws below (normal method)`
            )
          }
        }
      }
    } else {
      // For other tabs, calculate draws below normally
      const drawsBelow = totalRows - (activeIndex + 1)

      if (drawsBelow <= 0) {
        // No draws below this row
        frequencyData = []
        console.log(
          `${activeTabName} TAB - ROW ${activeIndex + 1}: NO DRAWS BELOW`
        )
      } else {
        // Get data for this tab and take draws below selected row
        const tabData = lottoMaxWinningNumbers2023.slice(0, totalRows)
        frequencyData = tabData.slice(activeIndex + 1)
        console.log(
          `${activeTabName} TAB - ROW ${activeIndex + 1}: Using ${
            frequencyData.length
          } draws below (should be ${drawsBelow})`
        )
      }
    }
  }

  // Calculate frequencies using our frequency data (draws below active row within current tab)
  const frequencies = getNumberFrequencies(frequencyData)
  const frequencyThreshold = getFrequencyThreshold()

  // DEBUG OUTPUT: Print the calculated frequencies for the critical range
  if (
    showBelowToggled &&
    activeTabName === '21d' &&
    frequencyData.length <= 6 &&
    frequencyData.length > 0
  ) {
    console.log('21d TAB - FREQUENCY CALCULATION DEBUG:')
    console.log(
      'Raw frequency data:',
      Object.keys(frequencies).map((num) => `${num}: ${frequencies[num]}x`)
    )
    console.log(
      'Total numbers with frequencies:',
      Object.keys(frequencies).length
    )

    // Check if we actually have numbers in the frequencies object
    if (Object.keys(frequencies).length === 0) {
      console.error(
        '21d TAB - ERROR: No frequencies calculated despite having data!'
      )

      // Force recalculation of frequencies directly
      if (frequencyData.length > 0) {
        console.log('21d TAB - Attempting direct frequency calculation')
        // Extract all numbers from the frequency data
        const allNumbers = []
        for (const draw of frequencyData) {
          if (draw && draw.numbers && Array.isArray(draw.numbers)) {
            allNumbers.push(...draw.numbers)
          }
        }

        // Count frequencies manually
        const manualFrequencies = {}
        for (const num of allNumbers) {
          manualFrequencies[num] = (manualFrequencies[num] || 0) + 1
        }

        console.log(
          '21d TAB - Manual frequency calculation:',
          Object.keys(manualFrequencies).map(
            (num) => `${num}: ${manualFrequencies[num]}x`
          )
        )
      }
    }
  }

  // Determine the threshold for adding numbers to specificNumbers based on the class state
  function getFrequencyThreshold() {
    const linkButtonOnElement = document.querySelector('#linkList a.on')
    const dataRows = linkButtonOnElement
      ? parseInt(linkButtonOnElement.getAttribute('data-rows'), 10)
      : 'all'

    // Always return 0 for all tabs when Below Toggled is checked
    if (showBelowToggled) {
      return 0
    }

    // Default behavior for when Below Toggled is not checked
    if (dataRows !== 'all') {
      switch (dataRows) {
        case 8:
        case 13:
        case 21:
          return 0
        case 34:
          return 3
        case 55:
          return 5
        default:
          return 13
      }
    }
    return 0 // Default to 0 if 'all' is selected
  }

  // Clear specificNumbers before filling
  specificNumbers = []

  // Group numbers by their frequency
  const frequencyGroups = {}
  for (const number in frequencies) {
    const freq = frequencies[number]

    if (!frequencyGroups[freq]) {
      frequencyGroups[freq] = []
    }
    frequencyGroups[freq].push(number)
  }

  // When Below Toggled is enabled, make sure to fill specificNumbers with all numbers
  // up to their frequencies - this makes behavior consistent across all tabs
  if (showBelowToggled) {
    // Fill specificNumbers with all numbers that have a frequency > 0
    // Repeat each number based on its frequency to weight probability
    for (const freq in frequencyGroups) {
      const numbers = frequencyGroups[freq]
      const frequency = parseInt(freq, 10)

      // Add each number to specificNumbers multiple times according to its frequency
      numbers.forEach((numStr) => {
        const num = parseInt(numStr, 10)
        // Add each number to specificNumbers once for each occurrence
        for (let i = 0; i < frequency; i++) {
          specificNumbers.push(num)
        }
      })
    }

    // For consistent behavior across all tabs (8d, 13d, 21d, etc.)
    // Find numbers with 0 frequency and add them to specificNumbers
    const allNumbers = Array.from({ length: 50 }, (_, i) => i + 1)
    const zeroFrequencyNumbers = allNumbers.filter((num) => !frequencies[num])

    // Add all zero frequency numbers to specificNumbers - only once each
    specificNumbers.push(...zeroFrequencyNumbers)

    // Ensures specificNumbers always has all 50 numbers
    if (specificNumbers.length === 0) {
      specificNumbers = Array.from({ length: 50 }, (_, i) => i + 1)
    }
  }

  // Build the title section with checkbox and count indicator
  let titleHTML =
    '<div style="display: flex; align-items: flex-end; margin-bottom: 5px; justify-content: space-between;">' +
    '<div style="display: flex; align-items: center;">' +
    '<span style="margin-right: 8px;">number frequency</span>'

  // Only show "below toggled" checkbox when a row is toggled
  if (activeIndex !== -1) {
    titleHTML +=
      '<div style="display: flex; align-items: center;">' +
      '<input type="checkbox" id="frequencyCheckbox" style="cursor: pointer; margin: 0 4px 0 0;">' +
      '<label for="frequencyCheckbox" style="cursor: pointer; font-size: 0.8em; display: flex; align-items: center;">below toggled'

    // Add count indicator right after "below toggled" text
    if (showBelowToggled) {
      const tabName = activeTimeLink ? activeTimeLink.textContent : ''
      titleHTML += `<span style="margin-left: 4px; font-size: 1em; color: #009EBA;" title="Using ${frequencyData.length} draws below the selected row in the ${tabName} view">(${frequencyData.length} draws)</span>`
    }

    titleHTML += '</label></div>'
  }

  titleHTML +=
    '</div>' +
    '<span></span>' + // Keep empty span for layout stability
    '</div>'

  // Update the results container
  const resultsContainer = document.getElementById('frequencyResults')
  resultsContainer.innerHTML =
    titleHTML + '<table class="frequency-table"></table>'
  const table = resultsContainer.querySelector('table')

  // Add event listener to the checkbox and set its initial state
  const frequencyCheckbox = document.getElementById('frequencyCheckbox')
  // Only set up the checkbox if it exists (when a row is toggled)
  if (frequencyCheckbox) {
    frequencyCheckbox.checked = showBelowToggled
    frequencyCheckbox.addEventListener('change', function () {
      showBelowToggled = this.checked
      // Preserve the current active row selection when toggling the checkbox
      displayMostFrequentNumbers()
    })
  }

  // Sort groups by frequency and then display
  Object.keys(frequencyGroups)
    .sort((a, b) => b - a)
    .forEach((freq) => {
      const row = table.insertRow()
      const frequencyCell = row.insertCell()
      frequencyCell.textContent = `${freq}x: `

      const numbersCell = row.insertCell()

      // Add numbers with frequency equal to or more than the threshold to specificNumbers array
      // When Below Toggled is checked, we've already filled specificNumbers earlier
      if (!showBelowToggled && parseInt(freq, 10) >= frequencyThreshold) {
        specificNumbers.push(...frequencyGroups[freq].map(Number))
      }

      // Create a span for each number and apply distinct style
      numbersCell.innerHTML = frequencyGroups[freq]
        .map((number) => {
          const num = parseInt(number)
          const isActive = activeNumbers.has(num)
          let paddingStyle = num <= 9 ? '2px 8px' : '2px 4px'
          let textColor = num >= 1 && num <= 20 ? 'black' : 'black'
          const style = isActive
            ? `background-color: ${getColor(
                num
              )}; color: ${textColor}; padding: ${paddingStyle}; border-radius: 25%;`
            : ''
          return `<span style="${style}">${num}</span>`
        })
        .join(' ∘ ')
    })

  // Find numbers with 0 frequency - all numbers that don't appear in the frequencies object
  const allNumbers = Array.from({ length: 50 }, (_, i) => i + 1)
  const zeroFrequencyNumbers = allNumbers.filter((num) => !frequencies[num])

  // Only show the 0x row if there are numbers with 0 frequency
  if (zeroFrequencyNumbers.length > 0) {
    const row = table.insertRow()
    const frequencyCell = row.insertCell()
    frequencyCell.textContent = '0x: '
    const numbersCell = row.insertCell()
    numbersCell.innerHTML = zeroFrequencyNumbers
      .map((num) => {
        const isActive = activeNumbers.has(num)
        let paddingStyle = num <= 9 ? '2px 8px' : '2px 4px'
        let textColor = 'black'
        return isActive
          ? `<span style="background-color: ${getColor(
              num
            )}; color: ${textColor}; padding: ${paddingStyle}; border-radius: 25%;">${num}</span>`
          : `<span style="color:#ff69b4">${num}</span>`
      })
      .join(' ∘ ')
  }
}

// Rest of your code remains the same

function updateUI() {
  updateButtonAppearance()
  displaySelectedNumbers()
  checkBottomSelectors()
  updateFrequencyDisplay()
  displayPairsInDifferentDraws()
  displayMostFrequentNumbers() // Add this line to update the frequency table
  calculateAndDisplaySum()
  checkAndToggleSaveButtonState()
  updateAllOffButtonOpacity(activeNumbers)
  updateFocusOnDisplay()

  // Update winning numbers table if 'around' tab is active
  const pairTabAro = document.getElementById('pairTab_around')
  if (pairTabAro && pairTabAro.classList.contains('pairTab-active')) {
    populateWinningNumbersTable(dataToShow)
  }
}

// Adding event listeners to bottomSelector elements
document.querySelectorAll('.bottomSelector').forEach((selector, index) => {
  selector.addEventListener('click', () => toggleSelectorState(selector, index))
})

function updateBottomSelectors(index) {
  const selectors = document.querySelectorAll('.bottomSelector')
  selectors.forEach((selector, i) => {
    if (i === index) {
      selector.classList.add('on')
    } else {
      selector.classList.remove('on')
    }
  })

  updateUI() // Assuming updateUI is a function that needs to be called here
}

// Function to find the currently active index from bottom selectors
function findActiveSelectorIndex() {
  const selectors = document.querySelectorAll('.bottomSelector')
  for (let i = 0; i < selectors.length; i++) {
    if (selectors[i].classList.contains('on')) {
      return i
    }
  }
  return -1 // Return -1 if no selector is active
}

// Function to toggle numbers from the current index and move to the next index
let currentIndex = -1 // Initialize currentIndex to -1

// Function to toggle numbers from the current index and move to the next index
function toggleNumbersAndAdvance() {
  let activeIndex = findActiveSelectorIndex()
  currentIndex = activeIndex !== -1 ? activeIndex : currentIndex
  currentIndex = (currentIndex + 1) % dataToShow.length
  toggleNumbersFromDraw(currentIndex)
  updateBottomSelectors(currentIndex)
}

document
  .querySelector('.downButton')
  .addEventListener('click', toggleNumbersAndAdvance)

// Function to toggle numbers from the current index and move to the previous index
function toggleNumbersAndReverse() {
  let activeIndex = findActiveSelectorIndex()
  currentIndex = activeIndex !== -1 ? activeIndex : currentIndex
  currentIndex = currentIndex - 1
  if (currentIndex < 0) {
    currentIndex = dataToShow.length - 1
  }
  toggleNumbersFromDraw(currentIndex)
  updateBottomSelectors(currentIndex)
}

document
  .querySelector('.upButton')
  .addEventListener('click', toggleNumbersAndReverse)

// Function to update the visibility of up and down buttons
function updateButtonVisibility() {
  const detailsDiv = document.querySelector('.drawDetails')
  const upButton = document.querySelector('.upButton')
  const downButton = document.querySelector('.downButton')

  // Check if the detailsDiv is visible
  const isVisible = detailsDiv.style.display === 'block'

  // Set buttons visibility based on detailsDiv visibility
  const displayStyle = isVisible ? 'block' : 'none'
  upButton.style.display = displayStyle
  downButton.style.display = displayStyle
}

/////////////////////////// Bottom nav opens Latest winners
let bottomTrigger = document.querySelector('.bottomTrigger') // Selector for the toggle
let bottomContainer = document.querySelector('.bottomSelectorsContainer') // Selector for the container

bottomTrigger.addEventListener('click', () => {
  if (
    bottomContainer.style.display === 'none' ||
    bottomContainer.style.display === ''
  ) {
    // If it's not visible, make it visible and change toggleSelector background to grey
    bottomContainer.style.display = 'grid'
    bottomTrigger.style.backgroundColor = '#242424'
    bottomTrigger.style.opacity = '65%'
    bottomTrigger.style.display = 'block'

    // Clear currentRowIndex and reset the opacity of all rows in the saved numbers table
    currentRowIndex = -1 // Reset the current row index
    const savedNumbersTable = document
      .getElementById('savedUmbersID')
      .querySelector('table')
    if (savedNumbersTable) {
      for (let row of savedNumbersTable.rows) {
        row.style.opacity = '1' // Set opacity to 1 for all rows
      }
    }
    // console.log('Bottom nav opens Latest winners');
  } else {
    // If it's visible, hide it and revert toggleSelector background color
    bottomContainer.style.display = 'none'
    bottomTrigger.style.backgroundColor = '' // Revert background color of toggleSelector
    bottomTrigger.style.opacity = ''

    // console.log('Hide Bottom nav');
  }
})

// Set visibility toggle of number toggle
const verticalButton = document.getElementById('vertical')
const horizontalButton = document.getElementById('horizontal')
const selectorContainer = document.getElementById('selectorContainerID')
const selectedNumbersRow = document.getElementById('selectedNumbersRowID')
const linkList = document.getElementById('linkList')
const frequencyContainer = document.getElementById('frequencyContainer')
const winningNumberSpacer = document.getElementById('winningNumberSpacer')
const randNumberBox = document.getElementById('randNumberBox')

function toggleVisibility(element) {
  if (element.style.display === 'none' || element.style.display === '') {
    element.style.display = 'flex'
  } else {
    element.style.display = 'none'
  }
}

function areAllElementsHidden() {
  return [
    selectorContainer,
    selectedNumbersRow,
    linkList,
    frequencyContainer,
    randNumberBox,
  ].every(
    (element) =>
      element.style.display === 'none' || element.style.display === ''
  )
}

let isAnimating = false // Global flag to track animation state

function swapButtons() {
  if (isAnimating) return // Don't swap buttons if animation is in progress

  if (horizontalButton.style.display === 'none') {
    horizontalButton.style.display = 'block'
    verticalButton.style.display = 'none'
  } else {
    horizontalButton.style.display = 'none'
    verticalButton.style.display = 'block'
  }
}

// Function to stop the spinner animation
function stopSpinnerAnimation() {
  const spinner = document.querySelector('[data-role="spinner"]')
  // console.log('Spinner element:', spinner)
  if (spinner) {
    spinner.style.animationPlayState = 'paused'
  } else {
    // console.error('Spinner element not found.')
  }
}

// Initially hide the vertical button
verticalButton.style.display = 'none'
verticalButton.addEventListener('click', buttonClickHandler)
horizontalButton.addEventListener('click', buttonClickHandler)

// Remember state when toggle horizontal and vertical
function buttonClickHandler() {
  populateWinningNumbersTable(dataToShow) //populate table
  let activeLink = document.querySelector('#linkList a.on')
  let wasActiveOnBeforeVertical = isActiveOnBeforeHorizontal

  if (this.id === 'vertical') {
    isActiveOnBeforeHorizontal = activeLink !== null
    if (isActiveOnBeforeHorizontal) {
      // Remember the current state when switching to vertical view
      activeLinkId = activeLink.id
      previousDataToShow = [...dataToShow]
    }
  }

  toggleVisibility(selectorContainer)
  toggleVisibility(selectedNumbersRow)
  toggleVisibility(linkList)
  toggleVisibility(frequencyContainer)
  toggleVisibility(randNumberBox)

  // Control sticky wrapper visibility based on selectorContainer
  const stickyWrapper = document.querySelector('.sticky-wrapper')
  if (
    selectorContainer.style.display === 'none' ||
    selectorContainer.style.display === ''
  ) {
    // selectorContainer is hidden, hide sticky wrapper
    document.body.classList.remove('lotto-active')
    if (stickyWrapper) {
      stickyWrapper.style.display = 'none'
    }
  } else {
    // selectorContainer is visible, show sticky wrapper
    document.body.classList.add('lotto-active')
    if (stickyWrapper) {
      stickyWrapper.style.display = 'block'
    }
  }

  if (areAllElementsHidden()) {
    winningNumberSpacer.style.display = 'flex'
  } else {
    winningNumberSpacer.style.display = 'none'
  }

  // window.scrollTo({ top: 0, behavior: 'smooth' })
  window.scrollTo(0, 0)
  swapButtons()

  if (this.id === 'vertical') {
    dataToShow = [...lottoMaxWinningNumbers2023]
  } else if (this.id === 'horizontal' && wasActiveOnBeforeVertical) {
    dataToShow = [...previousDataToShow]
    if (activeLinkId) {
      activeLinkId = ['pairs', 'allLink'].includes(activeLinkId)
        ? activeLinkId
        : activeLinkId

      var linkToActivate = document.getElementById(activeLinkId)
      linkToActivate.classList.add('on')
      updateUIBasedOnActiveLink(linkToActivate)

      if (activeLinkId === 'pairs') {
        document.getElementById('pairFrequency').style.display = 'block'
      } else if (activeLinkId === 'allLink') {
        document.getElementById('frequencyResults').style.display = 'block'
      }

      document.querySelectorAll('.link-button').forEach((button) => {
        if (button.id === activeLinkId) {
          button.classList.add('on')
        }
      })
    }
    isActiveOnBeforeHorizontal = false // Reset the flag
  }

  populateWinningNumbersTable(dataToShow)
  updateFrequencyDisplay()
  displayMostFrequentNumbers()
  displayPairsInDifferentDraws()
  updateButtonAppearance()
  stopSpinnerAnimation()
  // put clear here
}

////////////////////////////////////////////////////////////

// // Calculate sums
// function calculateAndDisplaySum() {
//   // Combine both arrays
//   const combinedArray = [...firstSevenToggled, ...additionalToggled]

//   // Check if there are at least two numbers
//   if (combinedArray.length >= 2) {
//     // Calculate the sum
//     const sum = combinedArray.reduce((acc, val) => acc + val, 0)

//     // Display the sum in the div
//     const sumDiv = document.querySelector('.sumText')
//     if (sumDiv) {
//       sumDiv.textContent = `sum: ${sum}`
//     }
//   } else {
//     // If there are less than two numbers, clear the text
//     const sumDiv = document.querySelector('.sumText')
//     if (sumDiv) {
//       sumDiv.textContent = ''
//     }
//   }
// }

// Calculate sums
function calculateAndDisplaySum() {
  // Combine both arrays
  const combinedArray = [...firstSevenToggled, ...additionalToggled]

  // Check if there are at least two numbers
  if (combinedArray.length >= 2) {
    // Calculate the sum
    const sum = combinedArray.reduce((acc, val) => acc + val, 0)

    // Calculate the numerology sum
    const numerologySum = reduceToSingleDigit(sum)

    // Display the sum and numerology sum in the div
    const sumDiv = document.querySelector('.sumText')
    if (sumDiv) {
      sumDiv.textContent = `sum: ${sum} :${numerologySum}`
    }
  } else {
    // If there are less than two numbers, clear the text
    const sumDiv = document.querySelector('.sumText')
    if (sumDiv) {
      sumDiv.textContent = ''
    }
  }
}

// Helper function to reduce a number to a single digit
function reduceToSingleDigit(num) {
  while (num > 9) {
    num = num
      .toString()
      .split('')
      .reduce((acc, digit) => acc + parseInt(digit), 0)
  }
  return num
}

////////////////////////////////////////////////////////////

// Event Listener for the Save Button
document.getElementById('saveBtnID').addEventListener('click', saveNumbers)

function saveNumbers() {
  // Make sure we have numbers to save
  if (firstSevenToggled.length === 0) {
    console.log('No numbers to save')
    return
  }

  // Sort the numbers before adding them to the row
  const sortedNumbers = [...firstSevenToggled].sort((a, b) => a - b)

  let savedNumbersDiv = document.getElementById('savedUmbersID')
  let table

  if (!savedNumbersDiv.querySelector('table')) {
    table = document.createElement('table')
    savedNumbersDiv.appendChild(table)
  } else {
    table = savedNumbersDiv.querySelector('table')
  }

  // Create a new row to insert
  let row = table.insertRow(0) // Insert the new row at the beginning

  // Remove highlight from any previously highlighted rows
  const allRows = table.querySelectorAll('tr')
  allRows.forEach((r) => r.classList.remove('row-highlight'))
  row.classList.add('row-highlight') // Highlight the new row
  setTimeout(() => {
    row.classList.remove('row-highlight') // Remove highlight after 1 second
  }, 1000)

  sortedNumbers.forEach((number) => {
    let cell = row.insertCell()
    const numberButton = createNumberButton(number, false)
    toggleColor(numberButton)
    cell.appendChild(numberButton)
  })

  for (let i = sortedNumbers.length; i < 7; i++) {
    let emptyCell = row.insertCell()
    const emptyDiv = document.createElement('div')
    emptyDiv.classList.add('empty-cell')
    emptyCell.appendChild(emptyDiv)
  }

  let clearCell = row.insertCell()
  let clearButton = document.createElement('button')
  clearButton.className = 'clear-button'

  // Determine lock state and set clear button accordingly
  const isLocked = getLockSavedState()
  if (isLocked) {
    // If locked, display a locked icon and disable button
    clearButton.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" height="10" width="10" viewBox="0 0 448 512"><path fill="#009eba" d="M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z"/></svg>'
    // clearButton.disabled = true
  } else {
    // If unlocked, display a delete icon and enable button
    clearButton.innerHTML = '✕'
    clearButton.onclick = function () {
      table.deleteRow(row.rowIndex)
      removeFromLocalStorage(sortedNumbers)
      updateSavedRowCount(false)
      // clearButton.disabled = false
    }
  }

  clearCell.appendChild(clearButton)
  checkAndToggleSaveButtonState()
  toggleOffAllButtons()
  updateClearButtonContent()

  saveToLocalStorage(sortedNumbers)
  firstSevenToggled = []
  updateSavedRowCount(false)
  downSaved.style.display = 'block'
  upSaved.style.display = 'block'

  // Hide various elements
  bottomTrigger.style.display = 'none'
  drawDetails.style.display = 'none'
  bottomSelectorsContainer.style.display = 'none'
  // toggleSelector.style.backgroundColor = 'none'

  reToggleManuallyToggledNumbers()
}

function saveToLocalStorage(sequence) {
  let existingSequences =
    JSON.parse(localStorage.getItem('numberSequences')) || []
  // console.log('Saving sequence:', sequence)
  existingSequences.push(sequence)
  localStorage.setItem('numberSequences', JSON.stringify(existingSequences))
}

function removeFromLocalStorage(sequenceToRemove) {
  let existingSequences =
    JSON.parse(localStorage.getItem('numberSequences')) || []
  // console.log('Removing sequence:', sequenceToRemove)
  let updatedSequences = existingSequences.filter(
    (seq) => JSON.stringify(seq) !== JSON.stringify(sequenceToRemove)
  )
  localStorage.setItem('numberSequences', JSON.stringify(updatedSequences))
  updateSavedRowCount()
}

function populateSavedNumbersFromLocalStorage() {
  let savedNumbersDiv = document.getElementById('savedUmbersID')
  let storedSequences =
    JSON.parse(localStorage.getItem('numberSequences')) || []
  let table

  if (!savedNumbersDiv.querySelector('table')) {
    table = document.createElement('table')
    savedNumbersDiv.appendChild(table)
  } else {
    table = savedNumbersDiv.querySelector('table')
  }

  storedSequences.forEach((sequence) => {
    let row = table.insertRow(0) // Insert the new row at the beginning

    sequence.forEach((number) => {
      let cell = row.insertCell()
      const numberButton = createNumberButton(number, false)
      cell.appendChild(numberButton)
    })

    for (let i = sequence.length; i < 7; i++) {
      let emptyCell = row.insertCell()
      const emptyDiv = document.createElement('div')
      emptyDiv.classList.add('empty-cell')
      emptyCell.appendChild(emptyDiv)
      updateSavedRowCount()
    }

    let clearCell = row.insertCell()
    let clearButton = document.createElement('button')
    clearButton.className = 'clear-button'

    // Check if the unLockSavedButton is displayed
    const isUnLockButtonVisible =
      document.getElementById('unLockSaved').style.display === 'block'

    // Set clearButton content based on unLockSavedButton visibility
    if (isUnLockButtonVisible) {
      // console.log('unLockSavedButton is visible')
      clearButton.textContent = '✕'
      clearButton.disabled = false
    } else {
      // console.log('unLockSavedButton is not visible')
      clearButton.innerHTML =
        '<svg xmlns="http://www.w3.org/2000/svg" height="10" width="10" viewBox="0 0 448 512"><path fill="#009eba" d="M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z"/></svg>'
    }

    clearButton.onclick = function () {
      table.deleteRow(row.rowIndex)
      removeFromLocalStorage(sequence)
    }
    clearCell.appendChild(clearButton)
  })
}

function checkAndToggleSaveButtonState(animate = false) {
  const saveBtnDefault = document.getElementById('saveBtnDefaultID')
  const saveBtn = document.getElementById('saveBtnID')

  if (firstSevenToggled.length === 0) {
    // console.log('No numbers are toggled, showing default button.')

    saveBtnDefault.style.display = 'block' // Show the default button
    saveBtn.style.display = 'none' // Hide the active button
  } else {
    if (animate) {
      // console.log(
      //   'Numbers are toggled, animating and switching to default button.'
      // )

      // Add animation class to saveBtnDefault only when animate is true
      saveBtnDefault.classList.add('saveBtnDefaultAnimate')

      setTimeout(() => {
        saveBtn.style.display = 'none' // Hide .saveBtn
        saveBtnDefault.style.display = 'block' // Show .saveBtnDefault

        // Remove the animation class after a delay of 2 seconds
        setTimeout(() => {
          saveBtnDefault.classList.remove('saveBtnDefaultAnimate')
        }, 1000) // Timeout of 2 seconds for removing the animation class
      }, 1000) // Delay the display change until the animation completes
    } else {
      // console.log(
      //   'Numbers are toggled, switching to active button without animation.'
      // )

      saveBtnDefault.style.display = 'none' // Hide the default button
      saveBtn.style.display = 'block' // Show the active button
    }
  }
}

document.getElementById('saveBtnID').addEventListener('click', function () {
  const saveBtnDefault = document.getElementById('saveBtnDefaultID')
  saveBtnDefault.classList.add('saveBtnDefaultAnimate')

  // console.log('Numbers are Saved')

  // Clear manually toggled and randomly on numbers
  // manuallyToggledNumbers.clear()
  randomlyOnNumbers = []

  // Reset UI for all buttons
  // resetAllButtonsUI()

  // Remove the animation class after it completes
  setTimeout(() => {
    saveBtnDefault.classList.remove('saveBtnDefaultAnimate')
  }, 1000) // 1000 ms (1 second) matches the animation duration
})

// Function to reset the UI of all buttons
function resetAllButtonsUI() {
  const buttons = document.querySelectorAll('#selectorContainerID button')
  buttons.forEach((button) => {
    button.style.backgroundColor = '' // Reset to default background
    button.style.outline = ''
    button.style.outlineOffset = ''
    button.style.color = ''
    button.style.textShadow = ''
  })
}

// updateSavedRowCount function
function updateSavedRowCount(maintainVisibility = true) {
  const savedNumbersDiv = document.getElementById('savedUmbersID')
  const table = savedNumbersDiv.querySelector('table')
  const rowCount = table ? table.rows.length : 0
  let counterBtn = document.getElementById('counterBtnID')
  const lockSavedButton = document.querySelector('.lockSaved')
  const unLockSavedButton = document.querySelector('.unLockSaved')

  // Add event listener to lockSavedButton
  lockSavedButton.addEventListener('click', () => {
    // Hide lockSavedButton and show unLockSavedButton
    saveLockSavedState(false)
    lockSavedButton.style.display = 'none'
    unLockSavedButton.style.display = 'block'
  })

  // Similarly, add an event listener to unLockSavedButton to reverse the action (if needed)
  unLockSavedButton.addEventListener('click', () => {
    // Hide unLockSavedButton and show lockSavedButton
    saveLockSavedState(true)
    lockSavedButton.style.display = 'block'
    unLockSavedButton.style.display = 'none'
  })

  const updateCounterButtonText = () => {
    // Check the current visibility state
    const isVisible = savedNumbersDiv.style.display === 'flex'
    counterBtn.classList.toggle('visible', isVisible) // Toggle class based on visibility

    const isLocked = getLockSavedState()

    // Update the visibility of lockSavedButton and unLockSavedButton based on isLocked state
    lockSavedButton.style.display = isLocked ? 'block' : 'none'
    unLockSavedButton.style.display = isLocked ? 'none' : 'block'

    // Update the button text based on visibility
    counterBtn.innerHTML =
      `${rowCount} saved \xa0\xa0\xa0` +
      (isVisible
        ? '<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path fill="#8deeff" d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path fill="#009eba" d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/></svg>')
  }

  // Update visibility based on maintainVisibility flag and whether it's the first call
  if (maintainVisibility && !savedNumbersDiv.getAttribute('data-initialized')) {
    savedNumbersDiv.style.display = 'none'
    savedNumbersDiv.setAttribute('data-initialized', 'true') // Mark as initialized
  } else if (!maintainVisibility) {
    // Set visibility based on whether there are any rows
    savedNumbersDiv.style.display = rowCount > 0 ? 'flex' : 'none'
  }

  // Update the button text based on the initial state
  updateCounterButtonText()
  checkAndToggleSaveButtonState()

  // updateFocusOnDisplay()

  // Remove existing event listeners by cloning the button
  let newCounterBtn = counterBtn.cloneNode(true)
  counterBtn.parentNode.replaceChild(newCounterBtn, counterBtn)
  counterBtn = newCounterBtn

  // Add event listener to toggle visibility
  counterBtn.addEventListener('click', () => {
    const isCurrentlyVisible = savedNumbersDiv.style.display === 'flex'
    savedNumbersDiv.style.display = isCurrentlyVisible ? 'none' : 'flex'

    downSaved.style.display = isCurrentlyVisible ? 'none' : 'block'
    upSaved.style.display = isCurrentlyVisible ? 'none' : 'block'

    // updateFocusOnDisplay()

    // Check if any bottom selectors are active
    let isAnySelectorOn = false
    document.querySelectorAll('.bottomSelector').forEach((selector) => {
      if (selector.classList.contains('on')) {
        isAnySelectorOn = true
      }
    })

    // Check if firstSevenToggled is active and no additionalToggled or activeNumbers are active
    if (
      firstSevenToggled.length === 7 ||
      // && activeNumbers.size === 0
      (additionalToggled.length > 0 &&
        // activeNumbers.size === 0
        isCurrentlyVisible === 'none')
    ) {
      upButton.style.display = isCurrentlyVisible ? 'block' : 'none'
      downButton.style.display = isCurrentlyVisible ? 'block' : 'none'
    } else {
      upButton.style.display = 'none'
      downButton.style.display = 'none'
    }

    updateCounterButtonText() // Update text to reflect the new visibility state

    // put hide here
    bottomTrigger.style.display = isCurrentlyVisible ? 'block' : 'none'
    bottomContainer.style.display = 'none'
    bottomTrigger.style.backgroundColor = ''
    bottomTrigger.style.opacity = ''

    // Additionally, set lockSaved and unLockSaved buttons visibility
    if (!isCurrentlyVisible) {
      const isLocked = getLockSavedState()
      lockSavedButton.style.display = isLocked ? 'block' : 'none'
      unLockSavedButton.style.display = isLocked ? 'none' : 'block'
    } else {
      lockSavedButton.style.display = 'none'
      unLockSavedButton.style.display = 'none'
    }

    // If the container is being hidden, toggle off the selected row
    if (isCurrentlyVisible) {
      toggleRowOff()
    }

    // toggleOffAllButtons()
  })
}

// Initialize with the updateSavedRowCount function
updateSavedRowCount()

///////////////////////////// UNLOCK AND LOCK FUNCTIONALITY

// Function to update clearButton content based on lockSavedButton visibility
function updateClearButtonContent(isLocked = getLockSavedState()) {
  // console.log('1395-updateClearButtonContent called with isLocked:', isLocked)
  const savedRows = document.querySelectorAll('#savedUmbersID table tr')

  savedRows.forEach((row, index) => {
    const clearButton = row.querySelector('.clear-button')
    if (!clearButton) return

    clearButton.disabled = isLocked // Disable clear button if locked
    clearButton.innerHTML = isLocked
      ? '<svg xmlns="http://www.w3.org/2000/svg" height="10" width="10" viewBox="0 0 448 512"><path fill="#009eba" d="M144 144v48H304V144c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192V144C80 64.5 144.5 0 224 0s144 64.5 144 144v48h16c35.3 0 64 28.7 64 64V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V256c0-35.3 28.7-64 64-64H80z"/></svg>'
      : '✕'

    // Log the lock status for each row
    // console.log(
    //   `Visually Row ${index + 1} is ${isLocked ? 'locked' : 'unlocked'}.`
    // )
  })
}

// Function to refresh the saved numbers table
function refreshSavedNumbersTable() {
  // Clear existing content
  const savedNumbersDiv = document.getElementById('savedUmbersID')
  savedNumbersDiv.innerHTML = ''

  // Repopulate from local storage
  toggleOffAllButtons()
  populateSavedNumbersFromLocalStorage()
}

/////////////////////////ANIMATE SAVED NUMBERS SWITCH

// Function to animate the saved numbers table
function animateSavedNumbersTable(direction, overlapColumns) {
  const savedNumbersTable = document
    .getElementById('savedUmbersID')
    .querySelector('table')
  if (!savedNumbersTable) return

  let delay = 50
  const delayIncrement = 0 // Time to wait before changing to the next column
  const colorChangeDuration = 50 // Time to keep the color changed
  const numColumns = savedNumbersTable.rows[0].cells.length
  const numRows = savedNumbersTable.rows.length

  // Function to change the background color of a button
  function changeBackgroundColor(button, color) {
    button.style.backgroundColor = color
  }

  for (let col = 0; col < numColumns; col++) {
    let startCol = direction === 'rightToLeft' ? numColumns - 1 - col : col

    for (let overlap = 0; overlap < overlapColumns; overlap++) {
      let currentCol =
        direction === 'rightToLeft' ? startCol - overlap : startCol + overlap
      if (currentCol >= 0 && currentCol < numColumns) {
        // Define colors for overlapping columns
        let color
        switch (overlap) {
          case 0:
            color = '#003B42' // First column in blue
            break
          case 1:
            color = '#009eba' // Second column in light blue
            break
          case 2:
            color = '#8deeff' // Third column in orange
            break
          case 3:
          //   color = '#009eba' // Third column in orange
          //   break
          // case 4:
          //   color = '#A4FF72' // Third column in orange
          //   break
          default:
            color = '' // Default color
        }

        for (let row = 0; row < numRows; row++) {
          const cell = savedNumbersTable.rows[row].cells[currentCol]
          const button = cell.querySelector('button')
          if (button) {
            setTimeout(() => changeBackgroundColor(button, color), delay)
          }
        }

        for (let row = 0; row < numRows; row++) {
          const cell = savedNumbersTable.rows[row].cells[currentCol]
          const button = cell.querySelector('button')
          if (button) {
            setTimeout(
              () => changeBackgroundColor(button, ''),
              delay + colorChangeDuration
            )
          }
        }
      }
    }

    // Increment the delay for the next column group
    delay += delayIncrement + colorChangeDuration
  }
}

// Example usage:
animateSavedNumbersTable('leftToRight', 3) // This will overlap 3 columns at a time with different colors

// Example usage:

// Add event listeners for lockSavedButton and unLockSavedButton to update clear buttons
const lockSavedButton = document.querySelector('.lockSaved')
const unLockSavedButton = document.querySelector('.unLockSaved')

lockSavedButton.addEventListener('click', () => {
  lockSavedButton.style.display = 'none'
  unLockSavedButton.style.display = 'block'
  saveLockSavedState(true)
  refreshSavedNumbersTable()
  animateSavedNumbersTable('leftToRight', 3) // This will overlap 2 columns at a time from left to right
  updateSavedRowCount()
})

unLockSavedButton.addEventListener('click', () => {
  unLockSavedButton.style.display = 'none'
  lockSavedButton.style.display = 'block'
  saveLockSavedState(false)
  refreshSavedNumbersTable()
  animateSavedNumbersTable('rightToLeft', 3) // Animate from right to left
  updateSavedRowCount()
})

// Function to save the lockSaved state
// function saveLockSavedState(isLocked) {
//   localStorage.setItem('lockSavedState', JSON.stringify(isLocked))
//   // Update clear buttons based on new lock state
//   updateClearButtonContent(isLocked)
// }

// Function to save the lockSaved state and update button visibility
function saveLockSavedState(isLocked) {
  localStorage.setItem('lockSavedState', JSON.stringify(isLocked))

  // Update button visibility
  lockSavedButton.style.display = isLocked ? 'block' : 'none'
  unLockSavedButton.style.display = isLocked ? 'none' : 'block'

  // Update clear buttons based on new lock state
  updateClearButtonContent(isLocked)
}

// Function to retrieve the lockSaved state
function getLockSavedState() {
  const state = localStorage.getItem('lockSavedState')
  return state ? JSON.parse(state) : false // Default to false if not set
}

////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////
// Add the toggleLatestSavedRow function
let currentRowIndex = -1 // Variable to track the current row index

function toggleRow(rowIndex) {
  const savedNumbersDiv = document.getElementById('savedUmbersID')
  const table = savedNumbersDiv.querySelector('table')

  if (!table) return // Exit if the table doesn't exist

  // Set the opacity for all rows
  for (let i = 0; i < table.rows.length; i++) {
    table.rows[i].style.opacity = i === rowIndex ? '1' : '0.5'
  }

  currentRowIndex = rowIndex // Update the current row index

  if (table && rowIndex >= 0 && rowIndex < table.rows.length) {
    currentRowIndex = rowIndex // Update currentRowIndex to the new index

    // Turn off all active numbers
    activeNumbers.forEach((number) => {
      const button = document.querySelector(`button[data-number="${number}"]`)
      if (button) {
        toggleColor(button) // This will turn off the button
      }
    })

    // Clear the active numbers set
    activeNumbers.clear()

    // Toggle on the numbers in the selected row
    const row = table.rows[currentRowIndex]
    Array.from(row.cells).forEach((cell, index) => {
      const button = cell.querySelector('button')
      if (button && index < 7) {
        toggleColor(button) // This will turn on the button
        activeNumbers.add(parseInt(button.textContent)) // Add number to active set
      }
    })
  }
  updateFocusOnDisplay()
  downButton.style.display = 'none'
  upButton.style.display = 'none'
}

/////////////////////////////// Display highlight index 1 / 10

function updateFocusOnDisplay() {
  const counterBtn = document.getElementById('counterBtnID')
  const savedNumbersDiv = document.getElementById('savedUmbersID')
  const table = savedNumbersDiv.querySelector('table')

  if (!table) {
    console.warn('Saved numbers table not found.')
    return
  }

  const totalRows = table.rows.length
  const isVisible = savedNumbersDiv.style.display === 'flex'

  if (currentRowIndex === -1) {
    // When no row is highlighted, show total count with appropriate SVG
    counterBtn.innerHTML =
      `${totalRows} saved ` +
      (isVisible
        ? '<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path fill="#8deeff" d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path fill="#009eba" d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/></svg>')
  } else {
    // Calculate reverse index (totalRows - currentRowIndex)
    const reverseIndex = totalRows - currentRowIndex

    // Update the counter button's text content with reverse index and icons
    counterBtn.innerHTML =
      `${reverseIndex} of ${totalRows} saved ` +
      (isVisible
        ? '<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path fill="#8deeff" d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg>'
        : '<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 512 512"><path fill="#009eba" d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/></svg>')
  }
}

//////////////////////////////////////////////////////////////////////////////

// Function to toggle off the currently selected row
function toggleRowOff() {
  const savedNumbersDiv = document.getElementById('savedUmbersID')
  const table = savedNumbersDiv.querySelector('table')

  if (!table || currentRowIndex === -1) return // Exit if no table or no selected row

  // Reset the opacity for all rows
  for (let row of table.rows) {
    row.style.opacity = '1'
  }

  // Reset the current row index
  currentRowIndex = -1

  // Turn off all active numbers
  activeNumbers.forEach((number) => {
    const button = document.querySelector(`button[data-number="${number}"]`)
    if (button) {
      toggleColor(button) // This will turn off the button
    }
  })

  // Clear the active numbers set
  activeNumbers.clear()
  resetCascadeButton()
}

///////////////////
// Event listener for the downSaved button
document.getElementById('downSaved').addEventListener('click', () => {
  const savedNumbersDiv = document.getElementById('savedUmbersID')
  const table = savedNumbersDiv.querySelector('table')

  if (!table) return // Exit if the table doesn't exist

  const nextRowIndex =
    currentRowIndex < table.rows.length - 1 ? currentRowIndex + 1 : 0
  toggleRow(nextRowIndex)
  greyedCascadeButton()
})

// Event listener for the upSaved button
document.getElementById('upSaved').addEventListener('click', () => {
  const savedNumbersDiv = document.getElementById('savedUmbersID')
  const table = savedNumbersDiv.querySelector('table')

  if (!table) return // Exit if the table doesn't exist

  const prevRowIndex =
    currentRowIndex > 0 ? currentRowIndex - 1 : table.rows.length - 1
  toggleRow(prevRowIndex)
  greyedCascadeButton()
})

//////////////////////////////

document
  .getElementById('saveBtnDefaultID')
  .addEventListener('click', function () {
    this.classList.add('saveBtnBackgroundAnimate') // Add the animation class

    setTimeout(() => {
      this.classList.remove('saveBtnBackgroundAnimate') // Remove the animation class after 1 second
    }, 1000) // Timeout set to the duration of the animation
  })

////////////////////////////////////////////////////////////

////////////////////////////////////////////////////////////

// Call this function to initially populate the table with all data
// populateWinningNumbersTable([...lottoMaxWinningNumbers2023])

// Call onLoad when the page loads
// window.addEventListener('load', onLoad)

triggerLoad()

// Toggle OFF all numbers
document.querySelector('.allOff').addEventListener('click', toggleOffAllButtons)

// Add event listener to the "allOff" button
document.getElementById('allOff').addEventListener('click', () => {
  manuallyToggledNumbers.forEach((number) => {
    const button = document.querySelector(
      `#selectorContainerID button[data-number="${number}"]`
    )
    if (button) {
      manuallyToggledNumbers.delete(number)
      updateButtonStyle(button, false)
    }
  })

  // Additional actions you might need to perform when all numbers are toggled off
  // For example, updating the UI or resetting certain states
})

function updateButtonStyle(button, isToggled) {
  if (isToggled) {
    button.style.outline = '3px solid #000'
    button.style.outlineOffset = '-5px'
    button.classList.add('toggled-on')
    // Add any other style changes for toggled state
  } else {
    button.style.outline = ''
    button.style.outlineOffset = ''
    button.classList.remove('toggled-on')
    // Reset styles for untoggled state
  }
}

// Show frequency of pairs
displayPairsInDifferentDraws()

// Update number for how long the winning table is
updateAllLinkText()

// Call this function to display the frequency table
displayMostFrequentNumbers()

// Call updateFrequencyDisplay initially to set initial values
updateFrequencyDisplay()

populateSavedNumbersFromLocalStorage() // Populate saved numbers on load
updateSavedRowCount()
checkAndToggleSaveButtonState()

// Example usage
// updateDrawDetails(0)
/////////////////////////////////////////////////////////////////
//////////// RANDOM NUMBER GENERATOR ///////////////////////////
///////////////////////////////////////////////////////////////

//////////////////////////////////////////////////////////////

let svgFillColor

// Modified function to return just one random color
function generateColorSpectrum(steps) {
  let spectrum = []
  for (let i = 0; i < steps; i++) {
    let hue = Math.floor(Math.random() * 360)
    let complementaryHue = (hue + 0) % 360
    svgFillColor = `hsl(${complementaryHue}, 100%, 15%)`
    spectrum.push(`hsl(${hue}, 100%, 65%)`)
  }
  return spectrum
}

function toggleRandomSevenButtons() {
  const cascadeButton = document.querySelector('.cascadeButton')
  cascadeButton.disabled = true // Disable the button to prevent re-clicking

  toggleOffAllButtons()
  reToggleManuallyToggledNumbers()
  displaySpinnerAndChangeText()

  const colorSpectrum = generateColorSpectrum(1)
  setRandomCascadeButtonColor(colorSpectrum)

  const totalNumbers = 50
  const maxColorChanges = 2

  let animatedButtons = 0
  const numbers = Array.from({ length: totalNumbers }, (_, i) => i + 1)
  const shuffledNumbers = shuffleArray(numbers)

  // Log the total number of possible randomized numbers
  // console.log(`Total possible randomized numbers: ${shuffledNumbers.length}`)

  function displaySpinnerAndChangeText() {
    const cascadeButton = document.querySelector('.cascadeButton')

    // Use svgFillColor for the fill color of the SVG
    cascadeButton.innerHTML = `
    <svg data-role="spinner" width="25" height="25" viewBox="0 0 25 25" fill="${svgFillColor}" xmlns="http://www.w3.org/2000/svg">
     <path d="M0.15957 17.3803C0.159569 19.3614 1.60684 21.1139 3.43497 21.5711C3.81583 23.476 5.72014 24.9237 7.62444 24.8475C8.8432 24.8475 9.90961 24.3903 10.6713 23.6284C11.4331 22.8664 11.9663 21.7235 11.8901 20.5805V14.1801C11.8901 13.8753 11.8139 13.6467 11.5854 13.4182C11.3569 13.1896 11.1284 13.1134 10.8237 13.1134H4.42521C3.20646 13.1134 2.14005 13.5706 1.37833 14.3325C0.616603 15.0945 0.0833975 16.2374 0.15957 17.3803Z" />
     <path d="M13.2611 4.27517V10.6756C13.2611 11.2851 13.7181 11.7423 14.3275 11.7423H20.7259C21.9447 11.7423 23.0111 11.2851 23.7728 10.5232C24.5346 9.76124 25.0678 8.61831 24.9916 7.47538C24.9916 5.49429 23.5443 3.7418 21.7162 3.28463C21.5638 2.52267 21.1068 1.76072 20.5736 1.22735C19.7357 0.389197 18.6693 -0.0679753 17.5267 0.0082202C16.308 0.0082202 15.2416 0.465393 14.4798 1.22735C13.7181 1.9893 13.1849 3.13223 13.2611 4.27517Z" />
     <path d="M13.1851 14.2564V20.6569C13.1851 22.9427 15.1656 24.9238 17.5269 25C18.7457 25 19.8121 24.5428 20.5738 23.7809C21.1832 23.1713 21.564 22.4855 21.7164 21.7236C22.4781 21.5712 23.2398 21.114 23.773 20.5807C24.6109 19.7425 25.068 18.6758 24.9918 17.5328C24.9918 16.3137 24.5347 15.247 23.773 14.485C23.0113 13.7231 21.8687 13.1897 20.7261 13.2659H14.3277C14.023 13.2659 13.7945 13.3421 13.566 13.5707C13.3374 13.7993 13.1851 13.9517 13.1851 14.2564Z" />
     <path d="M1.22697 4.42795C0.389079 5.2661 -0.0679545 6.33283 0.0082177 7.47576C0.0082178 9.91402 1.91252 11.8189 4.35003 11.8189H10.7485C11.3579 11.8189 11.8149 11.3617 11.8149 10.7522V4.35175C11.8149 3.13262 11.3579 2.06588 10.5962 1.30393C9.83443 0.541976 8.76802 0.084804 7.54926 0.084804C6.33051 0.0848039 5.2641 0.541977 4.50238 1.30393C3.893 1.9135 3.51214 2.59925 3.35979 3.36121C2.5219 3.4374 1.76018 3.89458 1.22697 4.42795Z" />
    </svg>`

    /////////////////////
    // Check the display style of 'frequencyResults' div
    const frequencyResultsDiv = document.getElementById('frequencyResults')
    const displayStyleOfFrequencyResults =
      window.getComputedStyle(frequencyResultsDiv).display

    // Display the 'forRandSpacer' div only if frequencyResults is set to block and there are no manually toggled numbers
    const randSpacerDiv = document.querySelector('.forRandSpacer')
    if (
      randSpacerDiv &&
      displayStyleOfFrequencyResults === 'block' &&
      manuallyToggledNumbers.size === 0
    ) {
      randSpacerDiv.style.display = 'block' // Show the div
      // Will be hidden when first number is displayed in shuffleAndToggleSevenRandomButtons
    }
  }

  shuffledNumbers.forEach((number, index) => {
    setTimeout(() => {
      if (!manuallyToggledNumbers.has(number)) {
        // Skip over manually toggled numbers
        const button = document.querySelector(
          `#selectorContainerID button[data-number="${number}"]`
        )
        if (button) {
          let colorIndex = 0
          const originalBackgroundColor = button.style.backgroundColor
          const originalTextColor = button.style.color

          const interval = setInterval(() => {
            button.style.backgroundColor =
              colorSpectrum[colorIndex % colorSpectrum.length]
            button.style.color = '#242424'
            button.style.textShadow = 'none'
            colorIndex++

            if (colorIndex >= maxColorChanges) {
              clearInterval(interval)
              button.style.backgroundColor = originalBackgroundColor
              button.style.color = originalTextColor
              animatedButtons++

              if (
                animatedButtons ===
                totalNumbers - manuallyToggledNumbers.size
              ) {
                shuffleAndToggleSevenRandomButtons()
              }
            }
          }, 200)
        }
      }
    }, index * 10)
  })
}
//////////////////

/////////////////
// Modified shuffleAndToggleSevenRandomButtons function
function shuffleAndToggleSevenRandomButtons() {
  const selectedNumbers = new Set([...manuallyToggledNumbers]) // Start with manually toggled numbers
  let randomlyOnNumbers = [] // New array to store numbers that are randomly turned on

  // Create a numbers array to pick from - making sure it's populated regardless of tab
  let availableNumbers = [...specificNumbers]

  // If specificNumbers is empty or too small due to frequency thresholds,
  // use all numbers from 1-50 that aren't already selected
  if (availableNumbers.length < 10) {
    // Fall back to all numbers if we don't have enough in specificNumbers
    availableNumbers = Array.from({ length: 50 }, (_, i) => i + 1).filter(
      (num) => !selectedNumbers.has(num)
    )
  }

  // Shuffle and pick numbers until we have 7 unique ones, excluding manually toggled numbers
  while (selectedNumbers.size < 7) {
    const shuffledSequence = shuffleArray(
      availableNumbers.filter((n) => !selectedNumbers.has(n))
    )

    if (
      shuffledSequence.length > 0 &&
      !selectedNumbers.has(shuffledSequence[0])
    ) {
      selectedNumbers.add(shuffledSequence[0])
      randomlyOnNumbers.push(shuffledSequence[0]) // Add to randomlyOnNumbers array
    } else {
      // Break the loop if there are not enough numbers to select from
      break
    }
  }

  let count = 0
  let firstNumberDisplayed = false
  Array.from(selectedNumbers).forEach((number, order) => {
    setTimeout(() => {
      const button = document.querySelector(
        `#selectorContainerID button[data-number="${number}"]`
      )
      if (button) {
        // Hide forRandSpacer when first number is displayed
        if (!firstNumberDisplayed) {
          const randSpacerDiv = document.querySelector('.forRandSpacer')
          if (randSpacerDiv) {
            randSpacerDiv.style.display = 'none'
          }
          firstNumberDisplayed = true
        }

        // Apply color toggle only for non-manually toggled numbers
        if (!manuallyToggledNumbers.has(number)) {
          toggleColor(button)
        }
        count++
        if (count === selectedNumbers.size) {
          document.querySelector('.cascadeButton').disabled = false // Re-enable the button
        }
      }
    }, order * 100)
  })
}

// Add event listeners to all buttons for manual toggle
document.querySelectorAll('#selectorContainerID button').forEach((button) => {
  button.addEventListener('click', () => {
    const number = parseInt(button.getAttribute('data-number'), 10)
    toggleNumberState(number)
  })
})

function shuffleArray(array) {
  let currentIndex = array.length,
    randomIndex
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex)
    currentIndex--
    ;[array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ]
  }
  return array
}

////////////////////////////////////////////////
///////////TOGGLE ON BUTTON////////////////////
////////////////////////////////////////////////

let manuallyToggledNumbers = new Set() // Store manually toggled numbers
let randomlyOnNumbers = [] // Store numbers that are randomly turned on

// Function to toggle number state
function toggleNumberState(number) {
  const button = document.querySelector(
    `#selectorContainerID button[data-number="${number}"]`
  )

  if (button) {
    if (randomlyOnNumbers.includes(number)) {
      // If the number is in randomlyOnNumbers, change color to red but don't toggle off
    } else {
      // Toggle for numbers not in randomlyOnNumbers
      if (manuallyToggledNumbers.has(number)) {
        manuallyToggledNumbers.delete(number)
        activeNumbers.delete(number) // Ensure it's removed from activeNumbers
        button.style.backgroundColor = '' // Default background
        button.style.outline = ''
        button.style.outlineOffset = ''
        button.style.color = ''
        button.style.textShadow = ''
      } else {
        manuallyToggledNumbers.add(number)
        activeNumbers.add(number) // Add to activeNumbers
        button.style.backgroundColor = '#cf0' // Color for manually toggled on
        button.style.outline = '3px solid #000'
        button.style.outlineOffset = '-5px'
        button.style.color = 'white'
        button.style.textShadow = ''
      }
    }
  }
  updateToggleSequence(number, activeNumbers.has(number))
  updateUI()
  updateFrequencyDisplay()
  checkAndToggleSaveButtonState()
  updateAllOffButtonOpacity(activeNumbers)
}

// Function to re-toggle manually toggled numbers
function reToggleManuallyToggledNumbers() {
  manuallyToggledNumbers.forEach((number) => {
    const button = document.querySelector(
      `#selectorContainerID button[data-number="${number}"]`
    )

    if (button) {
      toggleNumberOn(button)

      button.style.outline = '3px solid #000'
      button.style.outlineOffset = '-5px'
      button.style.color = 'white'
    }
  })
}

function toggleNumberOn(button) {
  const number = parseInt(button.getAttribute('data-number'))
  const isActivated = activeNumbers.has(number)
  isActivated ? activeNumbers.delete(number) : activeNumbers.add(number)
  updateToggleSequence(number, !isActivated)
  updateUI()
  updateFrequencyDisplay()
  // Check and toggle save button state
  checkAndToggleSaveButtonState()
  updateAllOffButtonOpacity(activeNumbers)
}

////////////////////////////////////////
//////////END TOGGLE ON BUTTON/////////
///////////////////////////////////////

function greyedCascadeButton() {
  const cascadeButton = document.querySelector('.cascadeButton')

  if (cascadeButton) {
    // Reset the button's styles to default
    cascadeButton.style.backgroundColor = 'rgb(28, 28, 28)'

    cascadeButton.style.color = '' // Or set to default color
    cascadeButton.style.textShadow = 'none'
    cascadeButton.innerHTML = `
    <svg  width="25" height="25" viewBox="0 0 25 25" fill="rgb(138, 138, 138)" xmlns="http://www.w3.org/2000/svg">
     <path d="M0.15957 17.3803C0.159569 19.3614 1.60684 21.1139 3.43497 21.5711C3.81583 23.476 5.72014 24.9237 7.62444 24.8475C8.8432 24.8475 9.90961 24.3903 10.6713 23.6284C11.4331 22.8664 11.9663 21.7235 11.8901 20.5805V14.1801C11.8901 13.8753 11.8139 13.6467 11.5854 13.4182C11.3569 13.1896 11.1284 13.1134 10.8237 13.1134H4.42521C3.20646 13.1134 2.14005 13.5706 1.37833 14.3325C0.616603 15.0945 0.0833975 16.2374 0.15957 17.3803Z" />
     <path d="M13.2611 4.27517V10.6756C13.2611 11.2851 13.7181 11.7423 14.3275 11.7423H20.7259C21.9447 11.7423 23.0111 11.2851 23.7728 10.5232C24.5346 9.76124 25.0678 8.61831 24.9916 7.47538C24.9916 5.49429 23.5443 3.7418 21.7162 3.28463C21.5638 2.52267 21.1068 1.76072 20.5736 1.22735C19.7357 0.389197 18.6693 -0.0679753 17.5267 0.0082202C16.308 0.0082202 15.2416 0.465393 14.4798 1.22735C13.7181 1.9893 13.1849 3.13223 13.2611 4.27517Z" />
     <path d="M13.1851 14.2564V20.6569C13.1851 22.9427 15.1656 24.9238 17.5269 25C18.7457 25 19.8121 24.5428 20.5738 23.7809C21.1832 23.1713 21.564 22.4855 21.7164 21.7236C22.4781 21.5712 23.2398 21.114 23.773 20.5807C24.6109 19.7425 25.068 18.6758 24.9918 17.5328C24.9918 16.3137 24.5347 15.247 23.773 14.485C23.0113 13.7231 21.8687 13.1897 20.7261 13.2659H14.3277C14.023 13.2659 13.7945 13.3421 13.566 13.5707C13.3374 13.7993 13.1851 13.9517 13.1851 14.2564Z" />
     <path d="M1.22697 4.42795C0.389079 5.2661 -0.0679545 6.33283 0.0082177 7.47576C0.0082178 9.91402 1.91252 11.8189 4.35003 11.8189H10.7485C11.3579 11.8189 11.8149 11.3617 11.8149 10.7522V4.35175C11.8149 3.13262 11.3579 2.06588 10.5962 1.30393C9.83443 0.541976 8.76802 0.084804 7.54926 0.084804C6.33051 0.0848039 5.2641 0.541977 4.50238 1.30393C3.893 1.9135 3.51214 2.59925 3.35979 3.36121C2.5219 3.4374 1.76018 3.89458 1.22697 4.42795Z" />
    </svg>`

    // Reset the dynamic box shadow
    updateBoxShadow('rgba(0, 0, 0, 0.0)') // Reset to no box-shadow
  }
}

function resetCascadeButton() {
  const cascadeButton = document.querySelector('.cascadeButton')

  if (cascadeButton) {
    // Reset the button's styles to default
    cascadeButton.style.backgroundColor = ''

    cascadeButton.style.color = '' // Or set to default color
    cascadeButton.style.textShadow = 'none'
    cascadeButton.innerHTML = `
    <svg  width="25" height="25" viewBox="0 0 25 25" fill="#cf0" xmlns="http://www.w3.org/2000/svg">
     <path d="M0.15957 17.3803C0.159569 19.3614 1.60684 21.1139 3.43497 21.5711C3.81583 23.476 5.72014 24.9237 7.62444 24.8475C8.8432 24.8475 9.90961 24.3903 10.6713 23.6284C11.4331 22.8664 11.9663 21.7235 11.8901 20.5805V14.1801C11.8901 13.8753 11.8139 13.6467 11.5854 13.4182C11.3569 13.1896 11.1284 13.1134 10.8237 13.1134H4.42521C3.20646 13.1134 2.14005 13.5706 1.37833 14.3325C0.616603 15.0945 0.0833975 16.2374 0.15957 17.3803Z" />
     <path d="M13.2611 4.27517V10.6756C13.2611 11.2851 13.7181 11.7423 14.3275 11.7423H20.7259C21.9447 11.7423 23.0111 11.2851 23.7728 10.5232C24.5346 9.76124 25.0678 8.61831 24.9916 7.47538C24.9916 5.49429 23.5443 3.7418 21.7162 3.28463C21.5638 2.52267 21.1068 1.76072 20.5736 1.22735C19.7357 0.389197 18.6693 -0.0679753 17.5267 0.0082202C16.308 0.0082202 15.2416 0.465393 14.4798 1.22735C13.7181 1.9893 13.1849 3.13223 13.2611 4.27517Z" />
     <path d="M13.1851 14.2564V20.6569C13.1851 22.9427 15.1656 24.9238 17.5269 25C18.7457 25 19.8121 24.5428 20.5738 23.7809C21.1832 23.1713 21.564 22.4855 21.7164 21.7236C22.4781 21.5712 23.2398 21.114 23.773 20.5807C24.6109 19.7425 25.068 18.6758 24.9918 17.5328C24.9918 16.3137 24.5347 15.247 23.773 14.485C23.0113 13.7231 21.8687 13.1897 20.7261 13.2659H14.3277C14.023 13.2659 13.7945 13.3421 13.566 13.5707C13.3374 13.7993 13.1851 13.9517 13.1851 14.2564Z" />
     <path d="M1.22697 4.42795C0.389079 5.2661 -0.0679545 6.33283 0.0082177 7.47576C0.0082178 9.91402 1.91252 11.8189 4.35003 11.8189H10.7485C11.3579 11.8189 11.8149 11.3617 11.8149 10.7522V4.35175C11.8149 3.13262 11.3579 2.06588 10.5962 1.30393C9.83443 0.541976 8.76802 0.084804 7.54926 0.084804C6.33051 0.0848039 5.2641 0.541977 4.50238 1.30393C3.893 1.9135 3.51214 2.59925 3.35979 3.36121C2.5219 3.4374 1.76018 3.89458 1.22697 4.42795Z" />
    </svg>`

    // Reset the dynamic box shadow
    updateBoxShadow('rgba(0, 0, 0, 0.0)') // Reset to no box-shadow
  }
}

function setRandomCascadeButtonColor(spectrum) {
  const randomColor = spectrum[Math.floor(Math.random() * spectrum.length)]
  const cascadeButton = document.querySelector('.cascadeButton')

  if (cascadeButton) {
    cascadeButton.style.backgroundColor = randomColor
    cascadeButton.innerHTML = `
    <svg data-role="spinner" width="25" height="25" viewBox="0 0 25 25" fill="${svgFillColor}" xmlns="http://www.w3.org/2000/svg">
     <path d="M0.15957 17.3803C0.159569 19.3614 1.60684 21.1139 3.43497 21.5711C3.81583 23.476 5.72014 24.9237 7.62444 24.8475C8.8432 24.8475 9.90961 24.3903 10.6713 23.6284C11.4331 22.8664 11.9663 21.7235 11.8901 20.5805V14.1801C11.8901 13.8753 11.8139 13.6467 11.5854 13.4182C11.3569 13.1896 11.1284 13.1134 10.8237 13.1134H4.42521C3.20646 13.1134 2.14005 13.5706 1.37833 14.3325C0.616603 15.0945 0.0833975 16.2374 0.15957 17.3803Z" />
     <path d="M13.2611 4.27517V10.6756C13.2611 11.2851 13.7181 11.7423 14.3275 11.7423H20.7259C21.9447 11.7423 23.0111 11.2851 23.7728 10.5232C24.5346 9.76124 25.0678 8.61831 24.9916 7.47538C24.9916 5.49429 23.5443 3.7418 21.7162 3.28463C21.5638 2.52267 21.1068 1.76072 20.5736 1.22735C19.7357 0.389197 18.6693 -0.0679753 17.5267 0.0082202C16.308 0.0082202 15.2416 0.465393 14.4798 1.22735C13.7181 1.9893 13.1849 3.13223 13.2611 4.27517Z" />
     <path d="M13.1851 14.2564V20.6569C13.1851 22.9427 15.1656 24.9238 17.5269 25C18.7457 25 19.8121 24.5428 20.5738 23.7809C21.1832 23.1713 21.564 22.4855 21.7164 21.7236C22.4781 21.5712 23.2398 21.114 23.773 20.5807C24.6109 19.7425 25.068 18.6758 24.9918 17.5328C24.9918 16.3137 24.5347 15.247 23.773 14.485C23.0113 13.7231 21.8687 13.1897 20.7261 13.2659H14.3277C14.023 13.2659 13.7945 13.3421 13.566 13.5707C13.3374 13.7993 13.1851 13.9517 13.1851 14.2564Z" />
     <path d="M1.22697 4.42795C0.389079 5.2661 -0.0679545 6.33283 0.0082177 7.47576C0.0082178 9.91402 1.91252 11.8189 4.35003 11.8189H10.7485C11.3579 11.8189 11.8149 11.3617 11.8149 10.7522V4.35175C11.8149 3.13262 11.3579 2.06588 10.5962 1.30393C9.83443 0.541976 8.76802 0.084804 7.54926 0.084804C6.33051 0.0848039 5.2641 0.541977 4.50238 1.30393C3.893 1.9135 3.51214 2.59925 3.35979 3.36121C2.5219 3.4374 1.76018 3.89458 1.22697 4.42795Z" />
    </svg>`
    updateBoxShadow(randomColor) // Update box-shadow with the random color
  }
}

// Event listeners and handler
const cascadeButton = document.querySelector('.cascadeButton')

function isMobileDevice() {
  return /Mobi/i.test(navigator.userAgent)
}

function handleCascadeButtonClick(event) {
  if (!this.disabled) {
    // Prevents the click event from firing after touchstart on mobile devices
    if (event.type === 'touchstart') {
      event.preventDefault()
    }

    toggleRandomSevenButtons()
  }
}

if (cascadeButton) {
  if (isMobileDevice()) {
    // Use touchstart only for mobile devices
    cascadeButton.addEventListener('touchstart', handleCascadeButtonClick, {
      passive: false,
    })
  } else {
    // Use click for non-mobile devices
    cascadeButton.addEventListener('click', handleCascadeButtonClick)
  }
}

function updateBoxShadow(color) {
  const styleElement = document.getElementById('dynamic-styles')
  if (!styleElement) {
    const newStyleElement = document.createElement('style')
    newStyleElement.id = 'dynamic-styles'
    document.head.appendChild(newStyleElement)
  }

  const dynamicStyles = document.getElementById('dynamic-styles')
  dynamicStyles.textContent = `
    .cascadeButton {
      transition: box-shadow 0.25s ease;
  }
      .cascadeButton:active {
        transform: translate(1px, 2px);
        box-shadow: 0 0 25px ${color};
        opacity: 1.0;
      }
    `
}
////////// move button

// Neighbour tally function
function tallyNeighbours(targetNumber, draws) {
  const grid = draws.map((draw) => draw.numbers)
  const height = grid.length
  const width = 7
  const offsets = [
    [-1, -1],
    [-1, 0],
    [-1, +1],
    [0, -1],
    [0, +1],
    [+1, -1],
    [+1, 0],
    [+1, +1],
  ]
  const tally = {}
  const seenPairs = new Set()
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      if (grid[r][c] === targetNumber) {
        for (const [dr, dc] of offsets) {
          const nr = r + dr,
            nc = c + dc
          if (nr >= 0 && nr < height && nc >= 0 && nc < width) {
            const val = grid[nr][nc]
            if (val === targetNumber) {
              // Only count each adjacency pair once (order-independent)
              const key = [
                Math.min(r, nr),
                Math.min(c, nc),
                Math.max(r, nr),
                Math.max(c, nc),
              ].join(',')
              if (!seenPairs.has(key)) {
                tally[targetNumber] = (tally[targetNumber] || 0) + 1
                seenPairs.add(key)
              }
            } else {
              tally[val] = (tally[val] || 0) + 1
            }
          }
        }
      }
    }
  }
  return Object.entries(tally)
    .map(([neighbour, touches]) => ({ neighbour: +neighbour, touches }))
    .sort((a, b) => b.touches - a.touches)
}
