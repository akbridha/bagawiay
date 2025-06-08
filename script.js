document.addEventListener('DOMContentLoaded', () => {
    // Get elements
    const barContainer = document.querySelector('.bar-container');
    const valueDisplay = document.querySelector('.value-display');
    const tableBody = document.getElementById('table-body');
    const addPointBtn = document.getElementById('add-point');
    const removePointBtn = document.getElementById('remove-point');
    const exportDataBtn = document.getElementById('export-data');
    const timeLabelsContainer = document.querySelector('.time-labels');
    
    // Initialize notification system
    showDragNotification();
    
    // Time range constants (7:00 - 17:30)
    const MIN_HOUR = 7;
    const MAX_HOUR = 17.5;
    const HOUR_RANGE = MAX_HOUR - MIN_HOUR;
    
    let points = [];
    let pointsData = []; // Will store problem and solution data
    let redRowStates = {}; // Will store which rows are red
    let lunchBreakStates = {}; // Will store which rows are set to lunch break (12:00-13:00)
    let activePoint = null;
    let offsetX = 0;
    let pointCounter = 3; // Start with 3 points
    
    // Initialize
    createInitialPoints();
    createTimeLabels();
    updateTable();
    
    // Add event listeners for buttons
    addPointBtn.addEventListener('click', addPoint);
    removePointBtn.addEventListener('click', removePoint);
    exportDataBtn.addEventListener('click', exportData);
    
    // Function to create time labels
    function createTimeLabels() {
        // Clear any existing labels
        timeLabelsContainer.innerHTML = '';
        
        // Create a label for each hour and half hour from 7:00 to 17:30
        for (let hour = MIN_HOUR; hour <= Math.floor(MAX_HOUR); hour++) {
            // Full hour label
            addTimeLabel(hour, 0);
            
            // Half hour label - only add if we haven't reached the maximum time
            if (hour + 0.5 <= MAX_HOUR) {
                addTimeLabel(hour, 30);
            }
        }
        
        // Add final 17:30 label if MAX_HOUR is exactly 17.5
        if (MAX_HOUR % 1 === 0.5 && Math.floor(MAX_HOUR) + 0.5 === MAX_HOUR) {
            addTimeLabel(Math.floor(MAX_HOUR), 30);
        }
    }
    
    // Function to add a time label
    function addTimeLabel(hour, minute) {
        const label = document.createElement('div');
        label.className = 'time-label';
        
        // Format time (e.g., "7:00", "7:30")
        const timeText = `${hour}:${minute === 0 ? '00' : minute}`;
        label.textContent = timeText;
        
        // Calculate position as percentage
        const totalMinutes = (MAX_HOUR - MIN_HOUR) * 60; // 10.5 * 60 = 630 minutes
        const currentMinutes = (hour - MIN_HOUR) * 60 + minute;
        const percentage = (currentMinutes / totalMinutes) * 100;
        
        // Set position
        label.style.left = `${percentage}%`;
        
        // Make full hours bold
        if (minute === 0) {
            label.style.fontWeight = 'bold';
        } else {
            label.style.fontSize = '8px'; // Smaller text for half hours
            label.style.opacity = '0.7';  // Less visible
        }
        
        // Add to container
        timeLabelsContainer.appendChild(label);
    }
    
    // Function to create initial points
    function createInitialPoints() {
        const initialPoints = document.querySelectorAll('.point');
        points = Array.from(initialPoints);
        
        // Initialize pointsData with empty values
        pointsData = points.map(() => ({
            problem: '',
            solution: ''
        }));
        
        // Set initial positions
        points[0].style.left = '0%';      // 7:00
        points[1].style.left = '50%';     // 12:15 (5.25 hours from 7:00 = 50% of 10.5 hours)
        points[2].style.left = '100%';    // 17:30
        
        // Add event listeners to points
        points.forEach((point, index) => {
            addPointEventListeners(point, index);
        });
        
        // Update bar color
        updateBarColor();
        
        // Update value display
        updateValueDisplay();
    }
    
    // Function to add event listeners to a point
    function addPointEventListeners(point, index) {
        point.addEventListener('mousedown', (e) => {
            activePoint = { element: point, index: index };
            offsetX = e.clientX - point.getBoundingClientRect().left;
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        });
        
        // Touch support
        point.addEventListener('touchstart', (e) => {
            activePoint = { element: point, index: index };
            const touch = e.touches[0];
            offsetX = touch.clientX - point.getBoundingClientRect().left;
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);
            e.preventDefault();
        });
    }
    
    // Function to add a new point
    function addPoint() {
        if (points.length >= 10) return; // Limit to 10 points
        
        pointCounter++;
        
        // Create new point
        const newPoint = document.createElement('div');
        newPoint.className = 'point';
        newPoint.id = `point${pointCounter}`;
        
        // Find the rightmost point position
        let rightmostPosition = 0;
        points.forEach(point => {
            const position = parseFloat(point.style.left || getComputedStyle(point).left);
            rightmostPosition = Math.max(rightmostPosition, position);
        });
        
        // Set new position to rightmost + 10% (but not exceeding 100%)
        const position = Math.min(rightmostPosition + 10, 98);
        newPoint.style.left = `${position}%`;
        
        // Set random color
        const hue = Math.random() * 360;
        newPoint.style.backgroundColor = `hsl(${hue}, 70%, 60%)`;
        
        // Add to DOM
        barContainer.appendChild(newPoint);
        
        // Add to points array
        points.push(newPoint);
        
        // Add to pointsData
        pointsData.push({
            problem: '',
            solution: ''
        });
        
        // Add event listeners
        addPointEventListeners(newPoint, points.length - 1);
        
        // Add to value display
        const newValueElement = document.createElement('div');
        newValueElement.innerHTML = `Sesi ${points.length}: <span id="value${points.length}"></span>`;
        newValueElement.style.color = `hsl(${hue}, 70%, 60%)`;
        valueDisplay.appendChild(newValueElement);
        
        // Update bar color
        updateBarColor();
        
        // Update display
        updateValueDisplay();
        updateTable();
    }
    
    // Function to remove the last point
    function removePoint() {
        if (points.length <= 2) return; // Keep at least 2 points
        
        // Get the point index that will be removed
        const removedPointIndex = points.length - 1;
        
        // Remove from DOM
        barContainer.removeChild(points[points.length - 1]);
        valueDisplay.removeChild(valueDisplay.lastChild);
        
        // Remove from arrays
        points.pop();
        pointsData.pop();
        
        // Clean up red row state for removed point
        delete redRowStates[removedPointIndex];
        
        // Clean up lunch break state for removed point
        delete lunchBreakStates[removedPointIndex];
        
        // Update bar color
        updateBarColor();
        
        // Update display
        updateTable();
    }
    
    // Handle mouse/touch movement
    function handleMouseMove(e) {
        if (!activePoint) return;
        movePoint(e.clientX);
    }
    
    function handleTouchMove(e) {
        if (!activePoint) return;
        const touch = e.touches[0];
        movePoint(touch.clientX);
        e.preventDefault();
    }
    
    function movePoint(clientX) {
        const barRect = barContainer.getBoundingClientRect();
        const minX = barRect.left;
        const maxX = barRect.right;
        
        // Calculate new position
        let newX = clientX - offsetX;
        
        // Convert to percentage
        let percentage = ((newX - minX) / (maxX - minX)) * 100;
        
        // Constrain to bar boundaries
        percentage = Math.max(0, Math.min(100, percentage));
        
        // Check if the moved point is involved in lunch break and cancel it
        if (activePoint) {
            cancelLunchBreakIfMoved(activePoint.index);
        }
        
        // Update point position
        activePoint.element.style.left = `${percentage}%`;
        
        // Update bar color based on rightmost point
        updateBarColor();
        
        // Update display
        updateValueDisplay();
        updateTable();
    }
    
    // Function to update bar color based on dominant point
    function updateBarColor() {
        const bar = document.querySelector('.bar');
        
        // Remove any existing color sections
        const existingSections = bar.querySelectorAll('.color-section');
        existingSections.forEach(section => section.remove());
        
        // Create color stops based on point positions
        const colorStops = points.map(point => {
            const position = parseFloat(point.style.left || getComputedStyle(point).left);
            const color = getComputedStyle(point).backgroundColor;
            return {
                position: position,
                color: color
            };
        }).sort((a, b) => a.position - b.position);

        // Create color sections
        for (let i = 0; i < colorStops.length; i++) {
            const currentStop = colorStops[i];
            const nextStop = colorStops[i + 1];
            
            // Calculate the width and position for this color section
            const startPos = i === 0 ? 0 : colorStops[i - 1].position; // Start from previous point's position
            const endPos = currentStop.position; // End at current point's position
            const width = endPos - startPos;
            
            // Create a new div for this color section
            const section = document.createElement('div');
            section.className = 'color-section';
            section.style.position = 'absolute';
            section.style.left = `${startPos}%`;
            section.style.width = `${width}%`;
            section.style.height = '100%';
            section.style.backgroundColor = currentStop.color;
            
            // Add the section to the bar
            bar.appendChild(section);
        }
    }
    
    // Update the value display
    function updateValueDisplay() {
        points.forEach((point, index) => {
            const valueEl = document.getElementById(`value${index + 1}`);
            if (!valueEl) return;
            
            // Calculate duration for all points
            const currentPoint = point;
            const currentLeft = parseFloat(currentPoint.style.left || getComputedStyle(currentPoint).left);
            const currentPercentage = Math.max(0, Math.min(100, parseFloat(currentLeft)));
            
            // Convert to time
            const timeValue = MIN_HOUR + (currentPercentage / 100 * HOUR_RANGE);
            
            let durationMinutes;
            if (index === 0) {
                // For first point, calculate duration from 7:00
                durationMinutes = Math.round((timeValue - MIN_HOUR) * 60);
            } else {
                // For other points, calculate duration from previous point
                const previousPoint = points[index - 1];
                const previousLeft = parseFloat(previousPoint.style.left || getComputedStyle(previousPoint).left);
                const previousPercentage = Math.max(0, Math.min(100, parseFloat(previousLeft)));
                const previousTime = MIN_HOUR + (previousPercentage / 100 * HOUR_RANGE);
                durationMinutes = Math.round((timeValue - previousTime) * 60);
            }
            
            // Format duration to HH:MM
            valueEl.textContent = formatMinutesToTime(durationMinutes);
        });
    }
    
    // Update the table
    function updateTable() {
        // Clear table
        tableBody.innerHTML = '';
        
        // Get point positions and convert to time values
        const pointTimes = points.map(point => {
            const leftValue = parseFloat(point.style.left || getComputedStyle(point).left);
            const percentage = Math.max(0, Math.min(100, parseFloat(leftValue)));
            return MIN_HOUR + (percentage / 100 * HOUR_RANGE);
        });
        
        // Sort points by position (left to right)
        const sortedIndices = pointTimes
            .map((time, index) => ({ time, index }))
            .sort((a, b) => a.time - b.time)
            .map(item => item.index);
        
        // Create table rows for each point
        sortedIndices.forEach((pointIndex, index) => {
            const currentPoint = points[pointIndex];
            const currentLeft = parseFloat(currentPoint.style.left || getComputedStyle(currentPoint).left);
            const currentPercentage = Math.max(0, Math.min(100, parseFloat(currentLeft)));
            const currentTime = MIN_HOUR + (currentPercentage / 100 * HOUR_RANGE);
            
            // Format time for display
            const formatTime = (time) => {
                let hours = Math.floor(time);
                let minutes = Math.round((time - hours) * 60);
                
                // Handle case where rounding might cause 60 minutes
                if (minutes >= 60) {
                    hours += Math.floor(minutes / 60);
                    minutes = minutes % 60;
                }
                
                return `${hours}:${minutes < 10 ? '0' + minutes : minutes}`;
            };
            
            // Calculate duration using the same method as updateValueDisplay
            let durationMinutes;
            if (index === 0) {
                // For first point, calculate duration from 7:00
                durationMinutes = Math.round((currentTime - MIN_HOUR) * 60);
            } else {
                // For other points, calculate duration from previous point
                const previousPoint = points[sortedIndices[index - 1]];
                const previousLeft = parseFloat(previousPoint.style.left || getComputedStyle(previousPoint).left);
                const previousPercentage = Math.max(0, Math.min(100, parseFloat(previousLeft)));
                const previousTime = MIN_HOUR + (previousPercentage / 100 * HOUR_RANGE);
                durationMinutes = Math.round((currentTime - previousTime) * 60);
            }
            
            // Create table row
            const row = document.createElement('tr');
            
            // Row number
            const cellNo = document.createElement('td');
            cellNo.textContent = index + 1;
            cellNo.style.cursor = 'pointer';
            
            // Check states
            const isRowRed = redRowStates[pointIndex] || false;
            const hasLunchBreak = lunchBreakStates[pointIndex] || false;
            
            // Add visual indicators for different states
            if (hasLunchBreak) {
                cellNo.style.backgroundColor = 'rgba(255, 193, 7, 0.3)';
                cellNo.style.fontWeight = 'bold';
                cellNo.title = 'Single click: Remove lunch break | Double click: Toggle red marker';
                cellNo.textContent = `${index + 1} 🍽️`;
            } else {
                cellNo.style.backgroundColor = 'transparent';
                cellNo.style.fontWeight = 'normal';
                cellNo.title = 'Single click: Set lunch break | Double click: Toggle red marker';
            }
            
            // Click handler with single/double click detection
            let clickTimeout;
            cellNo.addEventListener('click', (e) => {
                if (clickTimeout) {
                    // Double click detected
                    clearTimeout(clickTimeout);
                    clickTimeout = null;
                    
                    // Handle red marker toggle (double click)
                    redRowStates[pointIndex] = !redRowStates[pointIndex];
                    const newColor = redRowStates[pointIndex] ? 'red' : 'black';
                    
                    // Get all cells in the row
                    const allCells = row.getElementsByTagName('td');
                    // Change color of each cell
                    Array.from(allCells).forEach(cell => {
                        cell.style.color = newColor;
                        // If the cell contains a textarea, also change its color
                        const textarea = cell.querySelector('textarea');
                        if (textarea) {
                            textarea.style.color = newColor;
                        }
                    });
                    
                    console.log(`Double click: Red marker ${redRowStates[pointIndex] ? 'enabled' : 'disabled'} for point ${pointIndex}`);
                    
                } else {
                    // Single click - set timeout for double click detection
                    clickTimeout = setTimeout(() => {
                        clickTimeout = null;
                        
                        // Handle lunch break toggle (single click)
                        toggleLunchBreak(pointIndex, index, row);
                        console.log(`Single click: Lunch break toggled for point ${pointIndex}`);
                        
                    }, 300); // 300ms timeout for double click detection
                }
            });
            
            row.appendChild(cellNo);
            
            // Problem cell with input
            const cellProblem = document.createElement('td');
            const problemInput = document.createElement('textarea');
            problemInput.placeholder = 'Enter problem';
            problemInput.value = pointsData[pointIndex].problem || '';
            problemInput.addEventListener('input', (e) => {
                pointsData[pointIndex].problem = e.target.value;
            });
            cellProblem.appendChild(problemInput);
            row.appendChild(cellProblem);
            
            // Solution cell with input
            const cellSolution = document.createElement('td');
            const solutionInput = document.createElement('textarea');
            solutionInput.placeholder = 'Enter solution';
            solutionInput.value = pointsData[pointIndex].solution || '';
            solutionInput.addEventListener('input', (e) => {
                pointsData[pointIndex].solution = e.target.value;
            });
            cellSolution.appendChild(solutionInput);
            row.appendChild(cellSolution);
            
            // Time range cell
            const cellTimeRange = document.createElement('td');
            
            // Check if this row is set to lunch break
            const isLunchBreakRow = lunchBreakStates[pointIndex] || false;
            
            if (isLunchBreakRow) {
                // If lunch break, show 12:00-13:00
                cellTimeRange.textContent = '12:00 - 13:00';
                cellTimeRange.style.fontWeight = 'bold';
                cellTimeRange.style.color = '#ff9800';
                cellTimeRange.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
                cellTimeRange.style.borderRadius = '4px';
                cellTimeRange.style.padding = '4px 8px';
            } else {
                // Normal time range calculation
                const startTime = index === 0 ? '07:00' : formatTime(pointTimes[sortedIndices[index - 1]]);
                const endTime = formatTime(currentTime);
                cellTimeRange.textContent = `${startTime} - ${endTime}`;
                cellTimeRange.style.fontWeight = 'normal';
                cellTimeRange.style.color = 'inherit';
                cellTimeRange.style.backgroundColor = 'transparent';
                cellTimeRange.style.padding = 'inherit';
            }
            
            row.appendChild(cellTimeRange);
            
            // Duration cell
            const cellDuration = document.createElement('td');
            
            if (isLunchBreakRow) {
                // If lunch break, duration is always 1 hour
                cellDuration.textContent = '01:00';
                cellDuration.style.fontWeight = 'bold';
                cellDuration.style.color = '#ff9800';
                cellDuration.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
                cellDuration.style.borderRadius = '4px';
                cellDuration.style.padding = '4px 8px';
            } else {
                // Normal duration calculation
                const durationFormatted = formatMinutesToTime(durationMinutes);
                cellDuration.textContent = durationFormatted;
                cellDuration.style.fontWeight = 'normal';
                cellDuration.style.color = 'inherit';
                cellDuration.style.backgroundColor = 'transparent';
                cellDuration.style.padding = 'inherit';
            }
            
            // Apply the saved red state if it exists
            if (isRowRed) {
                setTimeout(() => {
                    const allCells = row.getElementsByTagName('td');
                    Array.from(allCells).forEach(cell => {
                        cell.style.color = 'red';
                        const textarea = cell.querySelector('textarea');
                        if (textarea) {
                            textarea.style.color = 'red';
                        }
                    });
                }, 0);
            }
            
            row.appendChild(cellDuration);
            
            // Add row to table
            tableBody.appendChild(row);
        });
    }
    
    // Mouse/touch event handlers
    function handleMouseUp() {
        activePoint = null;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    }
    
    function handleTouchEnd() {
        activePoint = null;
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
    }

    // Function to format minutes to HH:MM
    function formatMinutesToTime(minutes) {
        let hours = Math.floor(minutes / 60);
        let mins = minutes % 60;
        
        // Handle case where rounding might cause 60 minutes
        if (mins >= 60) {
            hours += Math.floor(mins / 60);
            mins = mins % 60;
        }
        
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    }

    // Function to convert time string (HH:MM) to minutes
    function timeStringToMinutes(timeString) {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    }

    // Function to get duration between two time strings
    function getDurationBetweenTimes(startTime, endTime) {
        const startMinutes = timeStringToMinutes(startTime);
        const endMinutes = timeStringToMinutes(endTime);
        return endMinutes - startMinutes;
    }

    // Function to export data to clipboard
    function exportData() {
        // Get all table rows
        const rows = tableBody.getElementsByTagName('tr');
        let exportText = '';

        // Add header
        exportText += 'No\tProblem\tSolution\tTime Range\tDuration\n';

        // Add each row's data
        Array.from(rows).forEach(row => {
            const cells = row.getElementsByTagName('td');
            const rowData = Array.from(cells).map(cell => {
                // For problem and solution cells, get the textarea value
                if (cell.querySelector('textarea')) {
                    return cell.querySelector('textarea').value;
                }
                return cell.textContent;
            });
            exportText += rowData.join('\t') + '\n';
        });

        // Copy to clipboard
        navigator.clipboard.writeText(exportText).then(() => {
            // Show success message
            const originalText = exportDataBtn.textContent;
            exportDataBtn.textContent = 'Copied!';
            exportDataBtn.style.backgroundColor = '#2ecc71';
            
            // Reset button after 2 seconds
            setTimeout(() => {
                exportDataBtn.textContent = originalText;
                exportDataBtn.style.backgroundColor = '';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy data to clipboard');
        });
    }

    // Example usage:
    // formatMinutesToTime(90) returns "01:30"
    // timeStringToMinutes("01:30") returns 90
    // getDurationBetweenTimes("09:00", "10:30") returns 90
    
    // Function to show drag notification balloon
    function showDragNotification() {
        const notification = document.getElementById('drag-notification');
        const notificationText = document.getElementById('notification-text');
        
        // Array of different tip messages
        const tipMessages = [
            '<strong>Tip:</strong> Klik dan geser titik-titik untuk mengatur waktu!',
            '<strong>Info:</strong> Titik-titik bisa digeser untuk menyesuaikan jadwal!',
            '<strong>Panduan:</strong> Drag titik untuk mengubah waktu sesi!',
            '<strong>Petunjuk:</strong> Geser bulatan untuk mengatur timeline!',
            '<strong>Tips:</strong> Tarik titik untuk menyesuaikan durasi waktu!'
        ];
        
        // Select random message
        const randomMessage = tipMessages[Math.floor(Math.random() * tipMessages.length)];
        notificationText.innerHTML = randomMessage;
        
        console.log('🎈 Showing notification on page load...');
        
        // Add slight random variation to timing (1-2.5 seconds)
        const randomDelay = 1000 + Math.random() * 1500;
        
        // Always show notification on page load/refresh
        // Show notification after a random delay
        setTimeout(() => {
            notification.style.display = 'block';
            notification.classList.remove('hide'); // Remove any previous hide class
            notification.classList.add('show');
            
            // Auto-hide after 6 seconds
            setTimeout(() => {
                notification.classList.remove('show');
                notification.classList.add('hide');
                
                // Remove from DOM after animation completes
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 500);
            }, 6000); // Hide after 6 seconds
            
        }, randomDelay); // Show after random delay (1-2.5 seconds)
        
        // Add click handler to close notification manually
        notification.addEventListener('click', () => {
            console.log('🖱️ Notification clicked, hiding...');
            notification.classList.remove('show');
            notification.classList.add('hide');
            setTimeout(() => {
                notification.style.display = 'none';
            }, 500);
        });
    }
    
    // Function to reset notification (for manual trigger)
    function resetDragNotification() {
        console.log('🔄 Manually triggering drag notification...');
        const notification = document.getElementById('drag-notification');
        
        // Reset notification state
        notification.style.display = 'block';
        notification.className = 'notification-balloon'; // Reset classes
        
        // Force show notification
        setTimeout(() => {
            notification.classList.add('show');
            console.log('🎈 Notification manually triggered!');
            
            // Auto-hide after 6 seconds
            setTimeout(() => {
                notification.classList.remove('show');
                notification.classList.add('hide');
                
                setTimeout(() => {
                    notification.style.display = 'none';
                }, 500);
            }, 6000);
        }, 100);
    }
    
    // Make reset function available globally for console testing
    window.resetDragNotification = resetDragNotification;

    // Function to toggle lunch break for a specific row
    function toggleLunchBreak(pointIndex, rowIndex, rowElement) {
        const isCurrentlyLunchBreak = lunchBreakStates[pointIndex] || false;
        
        if (!isCurrentlyLunchBreak) {
            // Set to lunch break (12:00-13:00)
            lunchBreakStates[pointIndex] = true;
            
            // Calculate position for 12:00 and 13:00 in the time scale
            const lunchStartTime = 12; // 12:00
            const lunchEndTime = 13;   // 13:00
            
            // Convert to percentage positions
            const startPercentage = ((lunchStartTime - MIN_HOUR) / HOUR_RANGE) * 100;
            const endPercentage = ((lunchEndTime - MIN_HOUR) / HOUR_RANGE) * 100;
            
            // Create lunch break range
            createLunchBreakRange(pointIndex, startPercentage, endPercentage);
            
            // Show feedback
            showLunchBreakFeedback(rowElement, true);
            
        } else {
            // Remove lunch break
            lunchBreakStates[pointIndex] = false;
            console.log(`Removing lunch break from point ${pointIndex}`);
            
            // Reset point styling
            resetLunchBreakStyling(pointIndex);
            
            // Show feedback
            showLunchBreakFeedback(rowElement, false);
        }
        
        // Update visual elements
        updateBarColor();
        updateValueDisplay();
        updateTable();
    }
    
    // Function to create proper lunch break range
    function createLunchBreakRange(selectedPointIndex, startPercentage, endPercentage) {
        // Get current point positions and sort them
        const pointTimes = points.map((point, index) => {
            const leftValue = parseFloat(point.style.left || getComputedStyle(point).left);
            const percentage = Math.max(0, Math.min(100, parseFloat(leftValue)));
            const time = MIN_HOUR + (percentage / 100 * HOUR_RANGE);
            return { index, time, percentage: leftValue };
        });
        
        const sortedPoints = pointTimes.sort((a, b) => a.time - b.time);
        const selectedPointPosition = sortedPoints.findIndex(p => p.index === selectedPointIndex);
        
        // Move the selected point to 13:00 (end of lunch)
        const selectedPoint = points[selectedPointIndex];
        selectedPoint.style.left = `${endPercentage}%`;
        
        // Handle the previous point for lunch start (12:00)
        if (selectedPointPosition > 0) {
            // Move the previous point to 12:00
            const previousPointData = sortedPoints[selectedPointPosition - 1];
            const previousPoint = points[previousPointData.index];
            previousPoint.style.left = `${startPercentage}%`;
            
            // Add visual styling to indicate lunch break points
            selectedPoint.style.backgroundColor = '#FF9800'; // Orange for lunch end
            selectedPoint.style.boxShadow = '0 0 0 3px rgba(255, 152, 0, 0.3)';
            selectedPoint.title = 'Lunch Break End (13:00)';
            
            previousPoint.style.backgroundColor = '#FFC107'; // Yellow for lunch start
            previousPoint.style.boxShadow = '0 0 0 3px rgba(255, 193, 7, 0.3)';
            previousPoint.title = 'Lunch Break Start (12:00)';
            
            console.log(`Lunch break: Point ${previousPointData.index} → 12:00, Point ${selectedPointIndex} → 13:00`);
        } else {
            // This is the first point, need to create a new point for 12:00
            console.log(`Creating new point at 12:00 for lunch break start`);
            addLunchStartPoint(startPercentage);
            
            // Style the selected point as lunch end
            selectedPoint.style.backgroundColor = '#FF9800'; // Orange for lunch end
            selectedPoint.style.boxShadow = '0 0 0 3px rgba(255, 152, 0, 0.3)';
            selectedPoint.title = 'Lunch Break End (13:00)';
        }
    }
    
    // Function to add a new point for lunch break start
    function addLunchStartPoint(startPercentage) {
        // Only add if we don't have too many points
        if (points.length >= 10) {
            console.log('Cannot add lunch start point - maximum points reached');
            return;
        }
        
        pointCounter++;
        
        // Create new point for lunch start (12:00)
        const newPoint = document.createElement('div');
        newPoint.className = 'point';
        newPoint.id = `point${pointCounter}`;
        newPoint.style.left = `${startPercentage}%`;
        
        // Set color to indicate it's a lunch-related point
        newPoint.style.backgroundColor = '#FFC107'; // Yellow for lunch
        newPoint.style.boxShadow = '0 0 0 3px rgba(255, 193, 7, 0.3)';
        newPoint.title = 'Lunch Break Start (12:00)';
        
        // Add to DOM
        barContainer.appendChild(newPoint);
        
        // Add to points array
        points.push(newPoint);
        
        // Add to pointsData
        pointsData.push({
            problem: 'Lunch Break Start',
            solution: 'Meal time begins'
        });
        
        // Add event listeners
        addPointEventListeners(newPoint, points.length - 1);
        
        // Add to value display
        const newValueElement = document.createElement('div');
        newValueElement.innerHTML = `Sesi ${points.length}: <span id="value${points.length}"></span>`;
        newValueElement.style.color = '#FFC107';
        valueDisplay.appendChild(newValueElement);
    }
    
    // Function to show visual feedback when lunch break is toggled
    function showLunchBreakFeedback(rowElement, isLunchBreak) {
        if (isLunchBreak) {
            rowElement.style.backgroundColor = 'rgba(255, 193, 7, 0.1)';
            rowElement.style.border = '2px solid #FFC107';
            rowElement.style.transform = 'scale(1.02)';
            
            // Reset styling after animation
            setTimeout(() => {
                rowElement.style.transform = 'scale(1)';
                rowElement.style.border = 'none';
                rowElement.style.backgroundColor = '';
            }, 1000);
        } else {
            rowElement.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            rowElement.style.transform = 'scale(0.98)';
            
            // Reset styling after animation
            setTimeout(() => {
                rowElement.style.transform = 'scale(1)';
                rowElement.style.backgroundColor = '';
            }, 500);
        }
    }

    // Function to reset point styling when lunch break is disabled
    function resetLunchBreakStyling(pointIndex) {
        const point = points[pointIndex];
        if (!point) return;
        
        // Reset to original point styling based on point ID
        const pointId = point.id;
        
        // Remove lunch break styling
        point.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
        point.title = '';
        
        // Restore original colors based on point ID
        if (pointId === 'point1') {
            point.style.backgroundColor = '#e74c3c'; // Red for first point
        } else if (pointId === 'point2') {
            point.style.backgroundColor = '#f39c12'; // Orange for second point
        } else if (pointId === 'point3') {
            point.style.backgroundColor = '#2ecc71'; // Green for third point
        } else {
            // For additional points, use blue or random color
            point.style.backgroundColor = '#3498db'; // Blue for additional points
        }
        
        // Also reset any related lunch break points
        resetRelatedLunchBreakPoints(pointIndex);
        
        console.log(`Reset styling for point ${pointIndex} (${pointId})`);
    }
    
    // Function to reset related lunch break points
    function resetRelatedLunchBreakPoints(cancelledPointIndex) {
        // Get current point positions and sort them
        const pointTimes = points.map((point, index) => {
            const leftValue = parseFloat(point.style.left || getComputedStyle(point).left);
            const percentage = Math.max(0, Math.min(100, parseFloat(leftValue)));
            const time = MIN_HOUR + (percentage / 100 * HOUR_RANGE);
            return { index, time };
        });
        
        const sortedPoints = pointTimes.sort((a, b) => a.time - b.time);
        const cancelledPosition = sortedPoints.findIndex(p => p.index === cancelledPointIndex);
        
        // Reset the previous point if it exists (lunch start point)
        if (cancelledPosition > 0) {
            const previousPointIndex = sortedPoints[cancelledPosition - 1].index;
            const previousPoint = points[previousPointIndex];
            if (previousPoint) {
                resetSinglePointStyling(previousPoint, previousPointIndex);
            }
        }
        
        // Reset the next point if it was affected (lunch end point)
        if (cancelledPosition < sortedPoints.length - 1) {
            const nextPointIndex = sortedPoints[cancelledPosition + 1].index;
            const nextPoint = points[nextPointIndex];
            if (nextPoint && lunchBreakStates[nextPointIndex]) {
                resetSinglePointStyling(nextPoint, nextPointIndex);
            }
        }
    }
    
    // Helper function to reset styling for a single point
    function resetSinglePointStyling(point, pointIndex) {
        const pointId = point.id;
        
        // Remove lunch break styling
        point.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.2)';
        point.title = '';
        
        // Restore original colors based on point ID
        if (pointId === 'point1') {
            point.style.backgroundColor = '#e74c3c'; // Red for first point
        } else if (pointId === 'point2') {
            point.style.backgroundColor = '#f39c12'; // Orange for second point
        } else if (pointId === 'point3') {
            point.style.backgroundColor = '#2ecc71'; // Green for third point
        } else {
            // For additional points, use blue or random color
            point.style.backgroundColor = '#3498db'; // Blue for additional points
        }
    }

    // Function to cancel lunch break if moved
    function cancelLunchBreakIfMoved(movedPointIndex) {
        let lunchBreakCancelled = false;
        
        // Check if the moved point itself has lunch break status
        if (lunchBreakStates[movedPointIndex]) {
            console.log(`Canceling lunch break: Point ${movedPointIndex} was moved`);
            lunchBreakStates[movedPointIndex] = false;
            resetLunchBreakStyling(movedPointIndex);
            lunchBreakCancelled = true;
        }
        
        // Check if any other point has lunch break that involves this moved point
        Object.keys(lunchBreakStates).forEach(pointIndexStr => {
            const pointIndex = parseInt(pointIndexStr);
            if (lunchBreakStates[pointIndex] && pointIndex !== movedPointIndex) {
                // Find if this moved point is related to the lunch break
                if (isPointRelatedToLunchBreak(movedPointIndex, pointIndex)) {
                    console.log(`Canceling lunch break: Point ${pointIndex} lunch break cancelled because related point ${movedPointIndex} was moved`);
                    lunchBreakStates[pointIndex] = false;
                    resetLunchBreakStyling(pointIndex);
                    lunchBreakCancelled = true;
                }
            }
        });
        
        // Show notification if lunch break was cancelled
        if (lunchBreakCancelled) {
            showLunchBreakCancelledNotification();
        }
    }
    
    // Function to check if a point is related to another point's lunch break
    function isPointRelatedToLunchBreak(movedPointIndex, lunchBreakPointIndex) {
        // Get current point positions and sort them
        const pointTimes = points.map((point, index) => {
            const leftValue = parseFloat(point.style.left || getComputedStyle(point).left);
            const percentage = Math.max(0, Math.min(100, parseFloat(leftValue)));
            const time = MIN_HOUR + (percentage / 100 * HOUR_RANGE);
            return { index, time };
        });
        
        const sortedPoints = pointTimes.sort((a, b) => a.time - b.time);
        const lunchBreakPosition = sortedPoints.findIndex(p => p.index === lunchBreakPointIndex);
        
        // Check if the moved point is the previous point (lunch start) for this lunch break
        if (lunchBreakPosition > 0) {
            const previousPointIndex = sortedPoints[lunchBreakPosition - 1].index;
            return previousPointIndex === movedPointIndex;
        }
        
        return false;
    }
    
    // Function to show notification when lunch break is cancelled
    function showLunchBreakCancelledNotification() {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.textContent = '🍽️ Lunch break cancelled - point moved';
        notification.style.cssText = `
            position: fixed;
            top: 80px;
            right: 20px;
            background: rgba(255, 87, 34, 0.9);
            color: white;
            padding: 10px 15px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        `;
        
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Hide and remove notification after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}); 