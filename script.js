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
    const noteFilterInput = document.getElementById('noteFilter');
    
    // Tab elements
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    const numbersList = document.querySelector('.numbers-list');
    
    // Notes elements
    const phoneNumberInput = document.getElementById('phoneNumberInput');
    const descriptionInput = document.getElementById('descriptionInput');
    const addNoteButton = document.getElementById('addNoteButton');
    const saveNotesButton = document.getElementById('saveNotesButton');
    const notesList = document.querySelector('.notes-list');
    
    // API URL - Tự động nhận diện môi trường
    const API_URL = window.location.hostname === 'cuongdevv.github.io'
        ? 'https://web-production-6b6c7.up.railway.app/api'
        : window.location.port === '5500' 
            ? 'http://localhost:5000/api'  // Khi chạy qua Live Server
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
    
    // Store phone notes
    let phoneNotes = [];
    let notesCurrentPage = 1;
    let notesTotalPages = 1;
    
    // Store current numbers and their notes
    let currentNumbers = [];
    let currentNotes = [];
    
    // Create toast container
    const popupContainer = document.createElement('div');
    popupContainer.className = 'popup-container';
    document.body.appendChild(popupContainer);
    
    // Toast message templates
    const toastTemplates = {
        success: `
            <div class="popup-icon success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="success-svg">
                    <path fill-rule="evenodd" d="m12 1c-6.075 0-11 4.925-11 11s4.925 11 11 11 11-4.925 11-11-4.925-11-11-11zm4.768 9.14c.0878-.1004.1546-.21726.1966-.34383.0419-.12657.0581-.26026.0477-.39319-.0105-.13293-.0475-.26242-.1087-.38085-.0613-.11844-.22342-.22342-.30879-.1024-.08536-.2209-.14938-.3484-.18828s-.2616-.0519-.3942-.03823c-.1327.01366-.2612.05372-.3782.1178-.1169.06409-.2198.15091-.3027.25537l-4.3 5.159-2.225-2.226c-.1886-.1822-.4412-.283-.7034-.2807s-.51301.1075-.69842.2929-.29058.4362-.29285.6984c-.00228.2622.09851.5148.28067.7034l3 3c.0983.0982.2159.1748.3454.2251.1295.0502.2681.0729.4069.0665.1387-.0063.2747-.0414.3991-.1032.1244-.0617.2347-.1487.3236-.2554z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <div class="success-message">MESSAGE</div>
            <div class="popup-icon close-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="close-svg">
                    <path d="m15.8333 5.34166-1.175-1.175-4.6583 4.65834-4.65833-4.65834-1.175 1.175 4.65833 4.65834-4.65833 4.6583 1.175 1.175 4.65833-4.6583 4.6583 4.6583 1.175-1.175-4.6583-4.6583z" class="close-path"></path>
                </svg>
            </div>`,
        error: `
            <div class="popup-icon error-icon">
                <svg class="error-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <div class="error-message">MESSAGE</div>
            <div class="popup-icon close-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="close-svg">
                    <path d="m15.8333 5.34166-1.175-1.175-4.6583 4.65834-4.65833-4.65834-1.175 1.175 4.65833 4.65834-4.65833 4.6583 1.175 1.175 4.65833-4.6583 4.6583 4.6583 1.175-1.175-4.6583-4.6583z" class="close-path"></path>
                </svg>
            </div>`,
        info: `
            <div class="popup-icon info-icon">
                <svg aria-hidden="true" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg" class="info-svg">
                    <path clip-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" fill-rule="evenodd"></path>
                </svg>
            </div>
            <div class="info-message">MESSAGE</div>
            <div class="popup-icon close-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="close-svg">
                    <path d="m15.8333 5.34166-1.175-1.175-4.6583 4.65834-4.65833-4.65834-1.175 1.175 4.65833 4.65834-4.65833 4.6583 1.175 1.175 4.65833-4.6583 4.6583 4.6583 1.175-1.175-4.6583-4.6583z" class="close-path"></path>
                </svg>
            </div>`,
        alert: `
            <div class="popup-icon alert-icon">
                <svg class="alert-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" aria-hidden="true">
                    <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
                </svg>
            </div>
            <div class="alert-message">MESSAGE</div>
            <div class="popup-icon close-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" class="close-svg">
                    <path d="m15.8333 5.34166-1.175-1.175-4.6583 4.65834-4.65833-4.65834-1.175 1.175 4.65833 4.65834-4.65833 4.6583 1.175 1.175 4.65833-4.6583 4.6583 4.6583 1.175-1.175-4.6583-4.6583z" class="close-path"></path>
                </svg>
            </div>`
    };

    // Show toast message function
    function showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `popup ${type}-popup`;
        toast.innerHTML = toastTemplates[type].replace('MESSAGE', message);
        
        // Add click event to close button
        toast.querySelector('.close-icon').addEventListener('click', () => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        });
        
        popupContainer.appendChild(toast);
        
        // Auto remove after duration
        setTimeout(() => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Replace alert function
    window.alert = function(message) {
        showToast(message, 'info');
    };
    
    // Check server connection
    checkServerConnection();
    
    // Load saved phone numbers from server
    loadNumbersFromServer();
    
    // Load phone notes from server
    loadPhoneNotes();
    
    // Định kỳ kiểm tra kết nối server (mỗi 30 giây)
    setInterval(checkServerConnection, 30000);
    
    // Add event listeners
    filterButton.addEventListener('click', filterPhoneNumbers);
    copyUniqueButton.addEventListener('click', () => copyNumbers(uniqueNumbersArray));
    copyDuplicateButton.addEventListener('click', () => copyNumbers(duplicateNumbersArray));
    copyAllNumbersButton.addEventListener('click', () => {
        // First get total pages from stats
        fetch(`${API_URL}/stats`)
            .then(response => response.json())
            .then(async data => {
                if (data.success && data.stats) {
                    const totalPages = Math.ceil(data.stats.uniqueCount / 100); // Thay đổi từ 10 thành 100
                    let allNumbers = [];
                    
                    // Show loading toast
                    showToast('Đang tải danh sách số...', 'info');
                    
                    // Fetch all pages
                    for (let page = 1; page <= totalPages; page++) {
                        try {
                            const response = await fetch(`${API_URL}/numbers?page=${page}`);
                            const pageData = await response.json();
                            if (pageData.success && pageData.uniqueNumbers) {
                                allNumbers = allNumbers.concat(pageData.uniqueNumbers);
                            }
                        } catch (error) {
                            console.error(`Error fetching page ${page}:`, error);
                        }
                    }
                    
                    if (allNumbers.length > 0) {
                        copyNumbers(allNumbers);
                    } else {
                        showToast('Không có số nào để sao chép', 'alert');
                    }
                } else {
                    showToast('Không thể tải thông tin số điện thoại', 'error');
                }
            })
            .catch(error => {
                console.error('Error loading stats:', error);
                showToast('Không thể tải thông tin số điện thoại', 'error');
            });
    });
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
    
    // Add event listeners for notes
    addNoteButton.addEventListener('click', addPhoneNote);
    saveNotesButton.addEventListener('click', savePhoneNotes);
    
    // Add event listener for note filter
    noteFilterInput.addEventListener('input', function() {
        displayUniqueNumbers(currentNumbers);
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

        // Store current numbers for filtering
        currentNumbers = numbers;
        
        // Get filter value
        const filterValue = noteFilterInput.value.toLowerCase();
        
        // Filter numbers based on notes
        const filteredNumbers = filterValue 
            ? numbers.filter(number => {
                const note = phoneNotes.find(note => note.number === number);
                return note && note.description.toLowerCase().includes(filterValue);
            })
            : numbers;

        // Tạo container cho các nút
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'button-container';
        
        // Thêm nút copy
        const copyButton = document.createElement('button');
        copyButton.className = 'copy-selected-button';
        copyButton.innerHTML = `
            <div class="tooltip">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
                    <path d="M20 2H10c-1.103 0-2 .897-2 2v4H4c-1.103 0-2 .897-2 2v10c0 1.103.897 2 2 2h10c1.103 0 2-.897 2-2v-4h4c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zM4 20V10h10l.002 10H4zm16-6h-4v-4c0-1.103-.897-2-2-2h-4V4h10v10z"/>
                </svg>
            </div>
        `;
        copyButton.onclick = () => {
            const selectedNumbers = Array.from(document.querySelectorAll('.number-checkbox:checked')).map(cb => cb.value);
            if (selectedNumbers.length === 0) {
                showToast('Vui lòng chọn ít nhất một số để sao chép', 'alert');
                return;
            }
            copyNumbers(selectedNumbers);
        };
        
        // Thêm nút xóa
        const deleteButton = document.createElement('button');
        deleteButton.className = 'delete-selected-button';
        deleteButton.innerHTML = `
            <div class="tooltip">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20" height="25" width="25">
                    <path d="M8.78842 5.03866C8.86656 4.96052 8.97254 4.91663 9.08305 4.91663H11.4164C11.5269 4.91663 11.6329 4.96052 11.711 5.03866C11.7892 5.11681 11.833 5.22279 11.833 5.33329V5.74939H8.66638V5.33329C8.66638 5.22279 8.71028 5.11681 8.78842 5.03866ZM7.16638 5.74939V5.33329C7.16638 4.82496 7.36832 4.33745 7.72776 3.978C8.08721 3.61856 8.57472 3.41663 9.08305 3.41663H11.4164C11.9247 3.41663 12.4122 3.61856 12.7717 3.978C13.1311 4.33745 13.333 4.82496 13.333 5.33329V5.74939H15.5C15.9142 5.74939 16.25 6.08518 16.25 6.49939C16.25 6.9136 15.9142 7.24939 15.5 7.24939H15.0105L14.2492 14.7095C14.2382 15.2023 14.0377 15.6726 13.6883 16.0219C13.3289 16.3814 12.8414 16.5833 12.333 16.5833H8.16638C7.65805 16.5833 7.17054 16.3814 6.81109 16.0219C6.46176 15.6726 6.2612 15.2023 6.25019 14.7095L5.48896 7.24939H5C4.58579 7.24939 4.25 6.9136 4.25 6.49939C4.25 6.08518 4.58579 5.74939 5 5.74939H6.16667H7.16638ZM7.91638 7.24996H12.583H13.5026L12.7536 14.5905C12.751 14.6158 12.7497 14.6412 12.7497 14.6666C12.7497 14.7771 12.7058 14.8831 12.6277 14.9613C12.5495 15.0394 12.4436 15.0833 12.333 15.0833H8.16638C8.05588 15.0833 7.94989 15.0394 7.87175 14.9613C7.79361 14.8831 7.74972 14.7771 7.74972 14.6666C7.74972 14.6412 7.74842 14.6158 7.74584 14.5905L6.99681 7.24996H7.91638Z" clip-rule="evenodd" fill-rule="evenodd"></path>
                </svg>
            </div>
        `;
        deleteButton.onclick = deleteSelectedNumbers;
        
        // Thêm các nút vào container
        buttonContainer.appendChild(copyButton);
        buttonContainer.appendChild(deleteButton);
        
        numbersList.innerHTML = '';
        numbersList.appendChild(buttonContainer);
        
        // Tạo bảng số điện thoại
        const table = document.createElement('table');
        table.className = 'phone-table';
        
        // Tạo header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th><input type="checkbox" id="selectAll" title="Chọn tất cả"></th>
                <th>Số điện thoại</th>
                <th>Ghi chú</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Tạo body
        const tbody = document.createElement('tbody');
        filteredNumbers.forEach(number => {
            const tr = document.createElement('tr');
            const note = phoneNotes.find(note => note.number === number);
            
            tr.innerHTML = `
                <td><input type="checkbox" class="number-checkbox" value="${number}"></td>
                <td>${number}</td>
                <td>${note ? note.description : ''}</td>
            `;
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        numbersList.appendChild(table);
        
        // Thêm event listener cho checkbox chọn tất cả
        const selectAllCheckbox = document.getElementById('selectAll');
        selectAllCheckbox.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.number-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }
    
    function deleteSelectedNumbers() {
        const selectedNumbers = Array.from(document.querySelectorAll('.number-checkbox:checked')).map(cb => cb.value);
        
        if (selectedNumbers.length === 0) {
            showToast('Vui lòng chọn ít nhất một số để xóa', 'alert');
            return;
        }
        
        if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedNumbers.length} số đã chọn?`)) {
            return;
        }
        
        fetch(`${API_URL}/numbers/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                numbers: selectedNumbers
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Đã xóa các số đã chọn', 'success');
                loadUniqueNumbers(); // Tải lại danh sách
            } else {
                showToast('Lỗi khi xóa số: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error deleting numbers:', error);
            showToast('Không thể xóa số điện thoại', 'error');
        });
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
            showToast('Vui lòng nhập số điện thoại', 'alert');
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
            showToast('Không có số nào để sao chép', 'alert');
            return;
        }
        
        const textToCopy = numbersArray.join('\n');
        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                showToast('Đã sao chép số điện thoại vào clipboard', 'success');
            })
            .catch(err => {
                console.error('Failed to copy: ', err);
                showToast('Không thể sao chép số điện thoại', 'error');
            });
    }
    
    function loadPhoneNotes() {
        fetch(`${API_URL}/notes`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    phoneNotes = data.phoneNotes;
                    displayPhoneNotes();
                }
            })
            .catch(error => {
                console.error('Error loading phone notes:', error);
                notesList.innerHTML = '<p class="empty-message">Không thể tải danh sách ghi chú</p>';
            });
    }
    
    function addPhoneNote() {
        const numbers = phoneNumberInput.value.trim().split('\n')
            .map(number => number.trim())
            .filter(number => number !== '');
        const description = descriptionInput.value.trim();
        
        console.log('Số lượng số điện thoại nhập vào:', numbers.length);
        console.log('Số điện thoại:', numbers);
        
        if (numbers.length === 0) {
            showToast('Vui lòng nhập ít nhất một số điện thoại', 'alert');
            return;
        }
        
        if (!description) {
            showToast('Vui lòng nhập ghi chú', 'alert');
            return;
        }

        // Giới hạn số lượng ghi chú
        const maxNotes = 50;
        console.log('Số lượng ghi chú hiện tại:', phoneNotes.length);
        if (phoneNotes.length + numbers.length > maxNotes) {
            showToast(`Số lượng ghi chú đã đạt giới hạn (tối đa ${maxNotes} ghi chú)`, 'alert');
            return;
        }
        
        let addedCount = 0;
        let updatedCount = 0;
        // Thêm hoặc cập nhật ghi chú cho từng số
        numbers.forEach(number => {
            const existingNoteIndex = phoneNotes.findIndex(note => note.number === number);
            if (existingNoteIndex !== -1) {
                // Cập nhật ghi chú cho số điện thoại đã tồn tại
                phoneNotes[existingNoteIndex].description = description;
                updatedCount++;
            } else {
                // Thêm ghi chú mới
                phoneNotes.push({
                    number: number,
                    description: description
                });
                addedCount++;
            }
        });
        
        console.log('Số ghi chú đã thêm mới:', addedCount);
        console.log('Số ghi chú đã cập nhật:', updatedCount);
        console.log('Tổng số ghi chú sau khi thêm:', phoneNotes.length);
        
        // Clear inputs và giữ focus
        const noteTab = document.getElementById('notesTab');
        phoneNumberInput.value = '';
        descriptionInput.value = '';
        
        // Hiển thị lại danh sách và thông báo
        displayPhoneNotes();
        showToast(`Đã thêm ${addedCount} ghi chú mới và cập nhật ${updatedCount} ghi chú`, 'success');
        
        // Cuộn lên đầu tab ghi chú
        noteTab.scrollTop = 0;
    }
    
    function displayPhoneNotes() {
        if (!phoneNotes || phoneNotes.length === 0) {
            notesList.innerHTML = '<p class="empty-message">Chưa có ghi chú nào</p>';
            return;
        }

        // Tính toán phân trang
        const perPage = 100;
        const startIndex = (notesCurrentPage - 1) * perPage;
        const endIndex = startIndex + perPage;
        const notesOnCurrentPage = phoneNotes.slice(startIndex, endIndex);
        notesTotalPages = Math.ceil(phoneNotes.length / perPage);

        // Hiển thị số lượng ghi chú
        const notesCount = document.createElement('div');
        notesCount.className = 'notes-count';
        notesCount.textContent = `Số lượng ghi chú: ${phoneNotes.length}/50`;

        // Tạo container cho danh sách ghi chú
        const notesContainer = document.createElement('div');
        notesContainer.className = 'notes-container';
        notesContainer.innerHTML = notesOnCurrentPage.map((note, index) => `
            <div class="note-item">
                <div class="note-content">
                    <div class="note-number">${note.number}</div>
                    <div class="note-description">${note.description}</div>
                </div>
                <div class="note-actions">
                    <button class="delete-note" data-number="${note.number}">×</button>
                </div>
            </div>
        `).join('');

        // Tạo phân trang
        const pagination = document.createElement('div');
        pagination.className = 'pagination';
        pagination.innerHTML = `
            <button id="notesPrevPage" class="page-button" ${notesCurrentPage <= 1 ? 'disabled' : ''}>
                &lt; Trang trước
            </button>
            <span class="page-info">
                Trang <span id="notesCurrentPage">${notesCurrentPage}</span>/<span id="notesTotalPages">${notesTotalPages}</span>
            </span>
            <button id="notesNextPage" class="page-button" ${notesCurrentPage >= notesTotalPages ? 'disabled' : ''}>
                Trang sau &gt;
            </button>
        `;

        // Xóa nội dung cũ và thêm các phần tử mới
        notesList.innerHTML = '';
        notesList.appendChild(notesCount);
        notesList.appendChild(notesContainer);
        notesList.appendChild(pagination);

        // Thêm event listener cho các nút xóa
        notesList.querySelectorAll('.delete-note').forEach(button => {
            button.addEventListener('click', function() {
                const number = this.getAttribute('data-number');
                deletePhoneNote(number);
            });
        });

        // Thêm event listener cho các nút phân trang
        const prevPageBtn = document.getElementById('notesPrevPage');
        const nextPageBtn = document.getElementById('notesNextPage');

        prevPageBtn.addEventListener('click', () => {
            if (notesCurrentPage > 1) {
                notesCurrentPage--;
                displayPhoneNotes();
            }
        });

        nextPageBtn.addEventListener('click', () => {
            if (notesCurrentPage < notesTotalPages) {
                notesCurrentPage++;
                displayPhoneNotes();
            }
        });
    }
    
    function deletePhoneNote(number) {
        // Xóa số khỏi mảng phoneNotes
        phoneNotes = phoneNotes.filter(note => note.number !== number);
        // Cập nhật lại giao diện
        displayPhoneNotes();
    }
    
    function savePhoneNotes() {
        fetch(`${API_URL}/notes/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phoneNumbers: phoneNotes
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showToast('Đã lưu ghi chú thành công', 'success');
            } else {
                showToast('Lỗi khi lưu ghi chú: ' + data.message, 'error');
            }
        })
        .catch(error => {
            console.error('Error saving phone notes:', error);
            showToast('Không thể lưu ghi chú', 'error');
        });
    }
}); 