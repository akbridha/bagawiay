document.addEventListener('DOMContentLoaded', () => {
    // Get elements
    const barContainer = document.querySelector('.bar-container');
    const valueDisplay = document.querySelector('.value-display');
    const tableBody = document.getElementById('table-body');
    const addPointBtn = document.getElementById('add-point');
    const removePointBtn = document.getElementById('remove-point');
    const exportDataBtn = document.getElementById('export-data');
    const timeLabelsContainer = document.querySelector('.time-labels');
    
    // Time range constants (7:00 - 17:00)
    const MIN_HOUR = 7;
    const MAX_HOUR = 17;
    const HOUR_RANGE = MAX_HOUR - MIN_HOUR;
    
    let points = [];
    let pointsData = []; // Will store problem and solution data
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
        
        // Create a label for each hour and half hour
        for (let hour = MIN_HOUR; hour <= MAX_HOUR; hour++) {
            // Full hour label
            addTimeLabel(hour, 0);
            
            // Half hour label (except for the last hour)
            if (hour < MAX_HOUR) {
                addTimeLabel(hour, 30);
            }
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
        const totalMinutes = (MAX_HOUR - MIN_HOUR) * 60;
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
        points[1].style.left = '50%';     // 12:00
        points[2].style.left = '100%';    // 17:00
        
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
        
        // Remove from DOM
        barContainer.removeChild(points[points.length - 1]);
        valueDisplay.removeChild(valueDisplay.lastChild);
        
        // Remove from arrays
        points.pop();
        pointsData.pop();
        
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
            const currentTime = MIN_HOUR + (currentPercentage / 100 * HOUR_RANGE);
            
            let durationMinutes;
            if (index === 0) {
                // For first point, calculate duration from 7:00
                durationMinutes = Math.round((currentTime - MIN_HOUR) * 60);
            } else {
                // For other points, calculate duration from previous point
                const previousPoint = points[index - 1];
                const previousLeft = parseFloat(previousPoint.style.left || getComputedStyle(previousPoint).left);
                const previousPercentage = Math.max(0, Math.min(100, parseFloat(previousLeft)));
                const previousTime = MIN_HOUR + (previousPercentage / 100 * HOUR_RANGE);
                durationMinutes = Math.round((currentTime - previousTime) * 60);
            }
            
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
                const hours = Math.floor(time);
                const minutes = Math.round((time - hours) * 60);
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
            cellNo.style.cursor = 'pointer'; // Add pointer cursor to indicate clickable
            
            // Variable to track row color state
            let isRed = false;
            
            cellNo.addEventListener('click', () => {
                // Toggle between red and black
                isRed = !isRed;
                const newColor = isRed ? 'red' : 'black';
                
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
            const startTime = index === 0 ? '07:00' : formatTime(pointTimes[sortedIndices[index - 1]]);
            const endTime = formatTime(currentTime);
            cellTimeRange.textContent = `${startTime} - ${endTime}`;
            row.appendChild(cellTimeRange);
            
            // Duration cell
            const cellDuration = document.createElement('td');
            const durationFormatted = formatMinutesToTime(durationMinutes);
            cellDuration.textContent = durationFormatted;
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
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
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
}); 