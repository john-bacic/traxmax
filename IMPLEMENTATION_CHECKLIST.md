# LOTTO 2_1 Implementation Checklist

## Core Functionality

- [x] Number grid (1-50)
- [x] Toggle numbers on/off
- [x] First 7 numbers: white text on colored background
- [x] Additional numbers (8+): black text on colored background
- [x] Inset black border on toggled numbers
- [x] Color generation based on HSL formula
- [x] All Off button functionality
- [x] Vertical/Horizontal toggle buttons
- [x] Selected numbers display (7 boxes)
- [x] Frequency navigation links

## Remaining Features

### 1. Winning Numbers Table

- [x] Table structure with draws
- [x] Number buttons in table cells (2.5rem size, saved-number-button class)
- [x] Bonus number display (opacity 0.5)
- [x] Date and jackpot display (till_when_text)
- [x] Update on frequency link changes
- [x] Proper button styling with toggled-on class

### 2. Bottom Container

- [x] Fixed position at bottom
- [x] Draw details display (formatted date + jackpot)
- [x] Bottom selectors grid (15 buttons)
- [x] Up/Down navigation buttons (show only when draw selected)
- [x] Selector state management (on/off classes)

### 3. Saved Numbers

- [x] Save current selection
- [x] Display saved numbers table
- [ ] Lock/unlock functionality
- [x] Clear button (remove button per row)
- [ ] Counter display
- [x] Local storage persistence
- [x] Save button animation
- [x] Grayscale when disabled

### 4. Cascade Button (Random Generator)

- [x] Spinner animation
- [x] Random color generation
- [ ] Box shadow effect
- [x] Toggle 7 random numbers
- [x] Greyed state when draw selected
- [x] Manual toggle lock feature (black outline)
- [x] Respects manually toggled numbers

### 5. Frequency Display

- [ ] Most frequent numbers
- [ ] Pair frequencies
- [ ] Update based on selected range

### 6. Additional UI Elements

- [x] Sum calculation display (with numerology reduction)
- [x] Easter egg (next jackpot)
- [x] Draw details formatting (DD.MM.YY ~ $X million)
- [x] Animations and transitions
- [x] Proper font loading (Lexend, Trispace)
- [x] Responsive sizing with clamp()
- [x] Text shadows on buttons
- [x] Grayscale/opacity states

## Implementation Status

### ✅ Completed Features:

- Main number grid with exact toggle behavior
- Locking functionality (black inset border) for main grid only
- Winning numbers table (no locking, yellow border on toggle)
- Bottom container with draw selectors
- Save/load functionality with localStorage
- Cascade button (random number generator)
- Frequency navigation links
- Sum calculation with numerology
- All visual styling matches original

### 🔧 Key Implementation Details:

- Main grid uses `handleMainGridClick` for lock behavior
- Winning table uses `toggleColor` directly (no lock)
- Black outline: 3px solid #000, -5px offset
- Manually toggled numbers persist through cascade
- Save button animates and grays out when disabled
- Font loading: Lexend and Trispace from Google Fonts

## Verification Steps

1. Compare visual appearance side-by-side
2. Test all toggle behaviors
3. Verify data displays correctly
4. Check all state management
5. Ensure no deviations from original
