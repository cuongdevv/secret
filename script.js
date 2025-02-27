document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const phoneInput = document.getElementById('phoneInput');
    const filterButton = document.getElementById('filterButton');
    const copyUniqueButton = document.getElementById('copyUniqueButton');
    const copyDuplicateButton = document.getElementById('copyDuplicateButton');
    const copyAllNumbersButton = document.getElementById('copyAllNumbersButton');
    const uniqueNumbersContainer = document.getElementById('uniqueNumbers');
    const duplicateNumbersContainer = document.getElementById('duplicateNumbers');
    const uniqueCountElement = document.getElementById('uniqueCount');
    const duplicateCountElement = document.getElementById('duplicateCount');
    const serverStatusElement = document.getElementById('serverStatus');
    const historyList = document.querySelector('.history-list');
    const loadNumbersButton = document.getElementById('loadNumbersButton');
    const prevPageButton = document.getElementById('prevPage');
    const nextPageButton = document.getElementById('nextPage');
    const currentPageElement = document.getElementById('currentPage');
    const totalPagesElement = document.getElementById('totalPages');
    
    // Tab elements
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const numbersList = document.querySelector('.numbers-list');
    
    // API URL - Tự động nhận diện môi trường
    const API_URL = window.location.hostname === 'cuongdevv.github.io'
        ? 'https://web-production-1e4b.up.railway.app/api'
        : `http://${window.location.hostname}:5000/api`;
    
    // Store filtered numbers for copy functionality
    let uniqueNumbersArray = [];
    let duplicateNumbersArray = [];
    let allUniqueNumbers = []; // Mảng lưu tất cả số không trùng
    
    // Server connection status
    let isServerConnected = false;
    
    // Pagination state
    let currentPage = 1;
    let totalPages = 1;
    
    // Check server connection
    checkServerConnection();
    
    // Load saved phone numbers from server
    loadNumbersFromServer();
    
    // Định kỳ kiểm tra kết nối server (mỗi 30 giây)
    setInterval(checkServerConnection, 30000);
    
    // Add event listeners
    filterButton.addEventListener('click', filterPhoneNumbers);
    copyUniqueButton.addEventListener('click', () => copyNumbers(uniqueNumbersArray));
    copyDuplicateButton.addEventListener('click', () => copyNumbers(duplicateNumbersArray));
    copyAllNumbersButton.addEventListener('click', () => copyNumbers(allUniqueNumbers));
    loadNumbersButton.addEventListener('click', loadUniqueNumbers);
    prevPageButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            loadUniqueNumbers();
        }
    });
    nextPageButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            loadUniqueNumbers();
        }
    });
    
    // Tab switching
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            switchTab(tabName);
            
            if (tabName === 'history') {
                loadHistory();
            }
        });
    });
    
    // Add event listener to save phone numbers when they change
    phoneInput.addEventListener('input', function() {
        localStorage.setItem('phoneNumbers', phoneInput.value);
    });
    
    function switchTab(tabName) {
        // Update active button
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            }
        });
        
        // Update active content
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === tabName + 'Tab') {
                content.classList.add('active');
            }
        });
    }
    
    function loadHistory() {
        fetch(`${API_URL}/history`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayHistory(data.history);
                }
            })
            .catch(error => {
                console.error('Error loading history:', error);
                historyList.innerHTML = '<p class="empty-message">Không thể tải lịch sử</p>';
            });
    }
    
    function displayHistory(history) {
        if (!history || history.length === 0) {
            historyList.innerHTML = '<p class="empty-message">Chưa có lịch sử lọc số</p>';
            return;
        }
        
        historyList.innerHTML = history.map(session => `
            <div class="history-item">
                <div class="history-header">
                    <div class="history-time">Thời gian: ${session.created_at}</div>
                </div>
                <div class="history-stats">
                    <div class="history-stat">
                        <div class="history-stat-label">Số không trùng</div>
                        <div class="history-stat-value">${session.unique_count}</div>
                    </div>
                    <div class="history-stat">
                        <div class="history-stat-label">Số trùng</div>
                        <div class="history-stat-value">${session.duplicate_count}</div>
                    </div>
                    <div class="history-stat">
                        <div class="history-stat-label">Tổng số</div>
                        <div class="history-stat-value">${session.total_count}</div>
                    </div>
                </div>
                <div class="history-numbers">
                    <div class="history-numbers-section">
                        <div class="history-numbers-title">Danh sách số:</div>
                        <div class="history-numbers-list">
                            ${session.numbers.map(number => `
                                <div class="history-number">${number}</div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    function loadUniqueNumbers() {
        fetch(`${API_URL}/numbers?page=${currentPage}`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayUniqueNumbers(data.uniqueNumbers);
                    updatePagination(data.pagination);
                    allUniqueNumbers = data.uniqueNumbers; // Lưu tất cả số không trùng
                }
            })
            .catch(error => {
                console.error('Error loading unique numbers:', error);
                numbersList.innerHTML = '<p class="empty-message">Không thể tải danh sách số điện thoại</p>';
            });
    }
    
    function displayUniqueNumbers(numbers) {
        if (!numbers || numbers.length === 0) {
            numbersList.innerHTML = '<p class="empty-message">Chưa có số điện thoại nào</p>';
            return;
        }
        
        numbersList.innerHTML = numbers.map(number => `
            <div class="number-item">
                <div class="number-text">${number}</div>
            </div>
        `).join('');
    }
    
    function updatePagination(pagination) {
        currentPage = pagination.currentPage;
        totalPages = pagination.totalPages;
        
        currentPageElement.textContent = currentPage;
        totalPagesElement.textContent = totalPages;
        
        prevPageButton.disabled = currentPage <= 1;
        nextPageButton.disabled = currentPage >= totalPages;
    }
    
    // Function to check server connection
    function checkServerConnection() {
        fetch(`${API_URL}/stats`)
            .then(response => {
                if (response.ok) {
                    isServerConnected = true;
                    return response.json();
                } else {
                    isServerConnected = false;
                    serverStatusElement.textContent = 'Không thể kết nối server';
                    serverStatusElement.className = 'status-offline';
                    throw new Error('Server response not OK');
                }
            })
            .then(data => {
                if (data.success && data.stats) {
                    // Hiển thị loại lưu trữ đang được sử dụng
                    const storageType = data.stats.storage_type || 'MongoDB';
                    if (storageType === 'MongoDB') {
                        serverStatusElement.textContent = 'Đã kết nối MongoDB';
                    } else {
                        serverStatusElement.textContent = 'Đang sử dụng bộ nhớ tạm';
                        serverStatusElement.className = 'status-memory';
                    }
                    console.log(`Thống kê từ ${storageType}: ${data.stats.uniqueCount} số không trùng, ${data.stats.duplicateCount} số trùng lặp`);
                }
            })
            .catch(error => {
                console.error('Server connection error:', error);
                isServerConnected = false;
                serverStatusElement.textContent = 'Không thể kết nối server';
                serverStatusElement.className = 'status-offline';
            });
    }
    
    // Function to load numbers from server
    function loadNumbersFromServer() {
        fetch(`${API_URL}/numbers`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    uniqueNumbersArray = data.uniqueNumbers;
                    duplicateNumbersArray = data.duplicateNumbers;
                    
                    // Display results
                    displayResults(uniqueNumbersArray, uniqueNumbersContainer, uniqueCountElement);
                    displayResults(duplicateNumbersArray, duplicateNumbersContainer, duplicateCountElement);
                    
                    // Reconstruct input from saved numbers
                    const allNumbers = [...uniqueNumbersArray, ...duplicateNumbersArray];
                    if (allNumbers.length > 0) {
                        phoneInput.value = allNumbers.join('\n');
                        localStorage.setItem('phoneNumbers', phoneInput.value);
                    } else {
                        // If no saved numbers, load from localStorage or use example data
                        const savedPhoneNumbers = localStorage.getItem('phoneNumbers');
                        if (savedPhoneNumbers) {
                            phoneInput.value = savedPhoneNumbers;
                            filterPhoneNumbers(); // Automatically filter on load if there are saved numbers
                        } else {
                            // Add example data to the textarea for demonstration
                            phoneInput.value = "0123456789\n0987654321\n0123456789\n0123456789\n0111222333\n0444555666";
                        }
                    }
                } else {
                    console.error('Failed to load numbers from server:', data.message);
                    
                    // Fall back to localStorage
                    const savedPhoneNumbers = localStorage.getItem('phoneNumbers');
                    if (savedPhoneNumbers) {
                        phoneInput.value = savedPhoneNumbers;
                        filterPhoneNumbers();
                    } else {
                        phoneInput.value = "0123456789\n0987654321\n0123456789\n0123456789\n0111222333\n0444555666";
                    }
                }
            })
            .catch(error => {
                console.error('Error loading numbers from server:', error);
                
                // Fall back to localStorage
                const savedPhoneNumbers = localStorage.getItem('phoneNumbers');
                if (savedPhoneNumbers) {
                    phoneInput.value = savedPhoneNumbers;
                    filterPhoneNumbers();
                } else {
                    phoneInput.value = "0123456789\n0987654321\n0123456789\n0123456789\n0111222333\n0444555666";
                }
            });
    }
    
    // Function to save numbers to server
    function saveNumbersToServer() {
        if (!isServerConnected) {
            console.log('Server not connected, skipping save');
            return;
        }
        
        const data = {
            uniqueNumbers: uniqueNumbersArray,
            duplicateNumbers: duplicateNumbersArray
        };
        
        fetch(`${API_URL}/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log('Numbers saved to MongoDB successfully');
                // Cập nhật trạng thái kết nối
                checkServerConnection();
            } else {
                console.error('Failed to save numbers to server:', data.message);
            }
        })
        .catch(error => {
            console.error('Error saving numbers to server:', error);
            isServerConnected = false;
            serverStatusElement.textContent = 'Không thể kết nối MongoDB';
            serverStatusElement.className = 'status-offline';
        });
    }
    
    // Function to filter phone numbers
    function filterPhoneNumbers() {
        // Get input text and split by new line
        const inputText = phoneInput.value.trim();
        
        if (!inputText) {
            alert('Vui lòng nhập số điện thoại');
            return;
        }
        
        const phoneNumbers = inputText.split('\n')
            .map(number => number.trim())
            .filter(number => number !== '');
        
        // Find unique and duplicate numbers
        const numberCount = {};
        uniqueNumbersArray = [];
        duplicateNumbersArray = [];
        
        // Count occurrences of each number
        phoneNumbers.forEach(number => {
            numberCount[number] = (numberCount[number] || 0) + 1;
        });
        
        // Separate unique and duplicate numbers
        for (const number in numberCount) {
            if (numberCount[number] === 1) {
                uniqueNumbersArray.push(number);
            } else {
                duplicateNumbersArray.push(number);
            }
        }
        
        // Display results
        displayResults(uniqueNumbersArray, uniqueNumbersContainer, uniqueCountElement);
        displayResults(duplicateNumbersArray, duplicateNumbersContainer, duplicateCountElement);
        
        // Save to server
        saveNumbersToServer();
    }
    
    // Function to display results in the specified container
    function displayResults(numbers, container, countElement) {
        container.innerHTML = '';
        
        if (numbers.length === 0) {
            container.innerHTML = '<p class="empty-message">Không tìm thấy số nào</p>';
        } else {
            numbers.forEach(number => {
                const numberElement = document.createElement('div');
                numberElement.className = 'phone-number';
                numberElement.textContent = number;
                container.appendChild(numberElement);
            });
        }
        
        // Update count
        countElement.textContent = numbers.length;
    }
    
    // Function to copy numbers to clipboard
    function copyNumbers(numbersArray) {
        if (numbersArray.length === 0) {
            alert('Không có số nào để sao chép');
            return;
        }
        
        const textToCopy = numbersArray.join('\n');
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                alert('Đã sao chép số điện thoại vào clipboard');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                alert('Không thể sao chép số điện thoại');
            });
    }
}); 