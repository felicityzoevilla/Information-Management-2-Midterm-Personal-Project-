let currentRole = 'admin';
let booksDatabase = [];
let borrowedBooks = [];
let editingBookId = null;

// Initialize with sample data
function initializeDatabase() {
    booksDatabase = [
        { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '978-0743273565', category: 'Fiction', quantity: 3, status: 'Available', icon: '📗' },
        { id: 2, title: '1984', author: 'George Orwell', isbn: '978-0451524935', category: 'Fiction', quantity: 2, status: 'Available', icon: '📕' },
        { id: 3, title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '978-0553380163', category: 'Science', quantity: 1, status: 'Available', icon: '📘' },
        { id: 4, title: 'The Catcher in the Rye', author: 'J.D. Salinger', isbn: '978-0316769174', category: 'Fiction', quantity: 2, status: 'Available', icon: '📙' },
        { id: 5, title: 'Sapiens', author: 'Yuval Noah Harari', isbn: '978-0062316097', category: 'History', quantity: 1, status: 'Available', icon: '📗' }
    ];
}

function setRole(role) {
    currentRole = role;
    
    const adminBtn = document.getElementById('btn-admin');
    const studentBtn = document.getElementById('btn-student');
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#3498db';
    
    if (role === 'admin') {
        adminBtn.style.background = primaryColor;
        studentBtn.style.background = '#555';
        showBox('login');
    } else {
        studentBtn.style.background = primaryColor;
        adminBtn.style.background = '#555';
        showBox('student-login');
    }
}

function showBox(boxName) {
    document.getElementById('login-box').classList.add('hidden');
    document.getElementById('admin-signup-box').classList.add('hidden');
    document.getElementById('student-login-box').classList.add('hidden');
    document.getElementById('student-signup-box').classList.add('hidden');
    
    switch(boxName) {
        case 'login':
            document.getElementById('login-box').classList.remove('hidden');
            break;
        case 'signup':
            document.getElementById('admin-signup-box').classList.remove('hidden');
            break;
        case 'student-login':
            document.getElementById('student-login-box').classList.remove('hidden');
            break;
        case 'student-signup':
            document.getElementById('student-signup-box').classList.remove('hidden');
            break;
    }
}

function logout() {
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('student-dashboard').classList.add('hidden');
    document.getElementById('auth-container').classList.remove('hidden');
    setRole('admin');
}

// ==================== ADMIN LOGIN ====================
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('login-user').value;
    
    if (username.trim() !== '') {
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('dashboard').classList.remove('hidden');
        loadAdminDashboard();
    }
    this.reset();
});

// ==================== ADMIN SIGNUP ====================
document.getElementById('admin-signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('admin-signup-user').value;
    const password = document.getElementById('admin-signup-pass').value;
    const masterKey = document.getElementById('admin-key').value;
    
    if (masterKey === 'ADMIN_KEY_123') {
        alert('✅ Admin account created successfully!');
        showBox('login');
    } else {
        alert('❌ Invalid System Master Key');
    }
    this.reset();
});

// ==================== STUDENT LOGIN ====================
document.getElementById('student-login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('student-login-user').value;
    
    if (username.trim() !== '') {
        document.getElementById('student-name-display').textContent = username;
        document.getElementById('auth-container').classList.add('hidden');
        document.getElementById('student-dashboard').classList.remove('hidden');
        loadStudentDashboard();
    }
    this.reset();
});

// ==================== STUDENT SIGNUP ====================
document.getElementById('student-signup-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('student-signup-user').value;
    const email = document.getElementById('student-signup-email').value;
    const password = document.getElementById('student-signup-pass').value;
    const studentId = document.getElementById('student-id').value;
    
    if (username.trim() && email.trim() && password.trim() && studentId.trim()) {
        const studentData = { username, email, studentId, registeredDate: new Date().toISOString() };
        let students = JSON.parse(localStorage.getItem('students') || '[]');
        students.push(studentData);
        localStorage.setItem('students', JSON.stringify(students));
        
        alert('✅ Student account created successfully! Please login.');
        showBox('student-login');
    } else {
        alert('❌ Please fill in all fields');
    }
    this.reset();
});

// ==================== ADD NEW BOOK (ADMIN) ====================
function addNewBook(event) {
    if (event) event.preventDefault();
    
    const title = document.getElementById('new-book-title').value;
    const author = document.getElementById('new-book-author').value;
    const isbn = document.getElementById('new-book-isbn').value;
    const category = document.getElementById('new-book-category').value;
    const quantity = parseInt(document.getElementById('new-book-quantity').value) || 1;
    const status = document.getElementById('new-book-status').value;
    
    if (title.trim() && author.trim() && category.trim()) {
        const newBook = {
            id: booksDatabase.length + 1,
            title,
            author,
            isbn: isbn || 'N/A',
            category,
            quantity,
            status,
            icon: getBookIcon(category)
        };
        
        booksDatabase.push(newBook);
        alert(`✅ Book "${title}" added successfully!`);
        
        document.getElementById('new-book-title').value = '';
        document.getElementById('new-book-author').value = '';
        document.getElementById('new-book-isbn').value = '';
        document.getElementById('new-book-category').value = '';
        document.getElementById('new-book-quantity').value = '1';
        
        loadAdminDashboard();
    } else {
        alert('❌ Please fill in all required fields');
    }
}

function getBookIcon(category) {
    const icons = {
        'Fiction': '📕',
        'Science': '📘',
        'History': '📗',
        'Mystery': '📙',
        'Biography': '📓'
    };
    return icons[category] || '📕';
}

// ==================== INLINE EDIT - QUANTITY ====================
function makeQuantityEditable(bookId, currentValue) {
    const book = booksDatabase.find(b => b.id === bookId);
    if (!book) return;
    
    const cell = event.target.closest('td');
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.value = currentValue;
    input.style.cssText = 'width: 60px; padding: 8px; border: 2px solid #3498db; border-radius: 4px; font-size: 16px; font-weight: 600;';
    
    cell.innerHTML = '';
    cell.appendChild(input);
    input.focus();
    input.select();
    
    function saveQuantity() {
        const newQuantity = parseInt(input.value);
        if (newQuantity < 0) {
            alert('❌ Quantity cannot be negative');
            loadAdminBooksTable();
            return;
        }
        
        book.quantity = newQuantity;
        if (newQuantity === 0) {
            book.status = 'Loaned';
        } else if (book.status === 'Loaned' && newQuantity > 0) {
            book.status = 'Available';
        }
        
        loadAdminBooksTable();
    }
    
    input.addEventListener('blur', saveQuantity);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') saveQuantity();
        if (e.key === 'Escape') loadAdminBooksTable();
    });
}

// ==================== INLINE EDIT - STATUS ====================
function makeStatusEditable(bookId, currentStatus) {
    const book = booksDatabase.find(b => b.id === bookId);
    if (!book) return;
    
    const cell = event.target.closest('td');
    const select = document.createElement('select');
    select.style.cssText = 'padding: 8px; border: 2px solid #3498db; border-radius: 4px; font-size: 14px; font-weight: 600;';
    
    const options = [
        { value: 'Available', label: '✅ Available' },
        { value: 'Loaned', label: '🔴 Loaned' },
        { value: 'Maintenance', label: '🔧 Maintenance' }
    ];
    
    options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.label;
        option.selected = opt.value === currentStatus;
        select.appendChild(option);
    });
    
    cell.innerHTML = '';
    cell.appendChild(select);
    select.focus();
    
    function saveStatus() {
        const newStatus = select.value;
        book.status = newStatus;
        loadAdminBooksTable();
    }
    
    select.addEventListener('blur', saveStatus);
    select.addEventListener('change', saveStatus);
    select.addEventListener('keypress', (e) => {
        if (e.key === 'Escape') loadAdminBooksTable();
    });
}

// ==================== DELETE BOOK (ADMIN) ====================
function deleteBook(bookId) {
    const book = booksDatabase.find(b => b.id === bookId);
    if (!book) return;
    
    if (confirm(`Are you sure you want to delete "${book.title}"?`)) {
        booksDatabase = booksDatabase.filter(b => b.id !== bookId);
        alert('✅ Book deleted successfully!');
        loadAdminDashboard();
    }
}

// ==================== LOAD ADMIN DASHBOARD ====================
function loadAdminDashboard() {
     document.getElementById('book-count').textContent = booksDatabase.length;
    document.getElementById('loan-count').textContent = booksDatabase.filter(b => b.status === 'Loaned').length;
    document.getElementById('student-count').textContent = JSON.parse(localStorage.getItem('students') || '[]').length;
    
    // Add this new line:
    const borrowerStats = getBorrowerStats();
    document.getElementById('borrower-count').textContent = borrowerStats.uniqueBorrowers;
    
    loadAdminBooksTable();
}

function getBorrowerStats() {
    // Count unique students who have borrowed books
    const uniqueBorrowers = new Set();
    borrowedBooks.forEach(borrow => {
        uniqueBorrowers.add(borrow.student);
    });
    
    return {
        totalActiveBorrows: borrowedBooks.length,
        uniqueBorrowers: uniqueBorrowers.size,
        borrowersList: Array.from(uniqueBorrowers)
    };
}

function loadAdminBooksTable() {
    const bookList = document.getElementById('book-list');
    bookList.innerHTML = '';
    
    booksDatabase.forEach(book => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${book.title}</strong></td>
            <td>${book.author}</td>
            <td>${book.isbn}</td>
            <td><span style="background: #ecf0f1; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${book.category}</span></td>
            <td class="quantity-cell" onclick="makeQuantityEditable(${book.id}, ${book.quantity})" style="cursor: pointer; font-weight: 600; color: #3498db; padding: 15px; user-select: none;">
                <strong style="font-size: 16px;">📦 ${book.quantity}</strong>
                <span style="font-size: 11px; color: #7f8c8d; display: block;">Click to edit</span>
            </td>
            <td class="status-cell" onclick="makeStatusEditable(${book.id}, '${book.status}')" style="cursor: pointer; user-select: none;">
                <span style="padding: 6px 10px; border-radius: 4px; font-size: 12px; font-weight: 600; display: block;
                    ${book.status === 'Available' ? 'background: #d4edda; color: #155724;' : book.status === 'Loaned' ? 'background: #f8d7da; color: #721c24;' : 'background: #fff3cd; color: #856404;'}">
                    ${book.status}
                </span>
                <span style="font-size: 11px; color: #7f8c8d; display: block; margin-top: 3px;">Click to edit</span>
            </td>
            <td>
                <button class="delete" onclick="deleteBook(${book.id})" style="background: #e74c3c; padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; color: white; font-weight: 600;">🗑️ Delete</button>
            </td>
        `;
        bookList.appendChild(row);
    });
}

// ==================== LOAD STUDENT DASHBOARD ====================
function loadStudentDashboard() {
    loadStudentBooksShelf();
    loadBorrowedBooks();
    attachSearchListener();
}

function loadStudentBooksShelf() {
    const grid = document.getElementById('student-books-grid');
    grid.innerHTML = '';
    
    booksDatabase.forEach(book => {
        const card = document.createElement('div');
        card.className = `book-card ${book.category.toLowerCase()}`;
        card.innerHTML = `
            <div class="book-cover">${book.icon}</div>
            <div class="book-info">
                <div class="book-title">${book.title}</div>
                <div class="book-author">by ${book.author}</div>
                <span class="book-category">${book.category}</span>
                <span class="book-status ${book.status.toLowerCase().replace(' ', '-')}">${book.status}</span>
                <button onclick="borrowBook(${book.id}, '${book.title.replace(/'/g, "\\'")}', '${book.author.replace(/'/g, "\\'")}')" 
                    ${book.status !== 'Available' ? 'disabled' : ''}>
                    ${book.status === 'Available' ? '📚 Borrow Book' : '❌ Not Available'}
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

function attachSearchListener() {
    const searchInput = document.getElementById('student-search');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        const cards = document.querySelectorAll('.book-card');
        
        cards.forEach(card => {
            const title = card.querySelector('.book-title').textContent.toLowerCase();
            const author = card.querySelector('.book-author').textContent.toLowerCase();
            
            if (title.includes(query) || author.includes(query)) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

function borrowBook(bookId, bookTitle, bookAuthor) {
    const studentName = document.getElementById('student-name-display').textContent;
    const today = new Date();
    const dueDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
    
    const borrowRecord = {
        id: borrowedBooks.length + 1,
        bookId,
        title: bookTitle,
        author: bookAuthor,
        borrowedDate: today.toLocaleDateString(),
        dueDate: dueDate.toLocaleDateString(),
        student: studentName
    };
    
    borrowedBooks.push(borrowRecord);
    
    // Update book status
    const book = booksDatabase.find(b => b.id === bookId);
    if (book) {
        book.quantity--;
        if (book.quantity === 0) {
            book.status = 'Loaned';
        }
    }
    
    alert(`✅ "${bookTitle}" borrowed successfully!\n📅 Due Date: ${dueDate.toLocaleDateString()}`);
    loadStudentDashboard();
}

function returnBook(borrowId) {
    const borrow = borrowedBooks.find(b => b.id === borrowId);
    if (borrow) {
        const book = booksDatabase.find(b => b.id === borrow.bookId);
        if (book) {
            book.quantity++;
            if (book.quantity > 0) {
                book.status = 'Available';
            }
        }
        borrowedBooks = borrowedBooks.filter(b => b.id !== borrowId);
        alert(`✅ "${borrow.title}" returned successfully!`);
        loadStudentDashboard();
    }
}

function loadBorrowedBooks() {
    const tbody = document.getElementById('borrowed-book-list');
    tbody.innerHTML = '';
    
    if (borrowedBooks.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: #7f8c8d;">No borrowed books yet.</td></tr>';
        return;
    }
    
    borrowedBooks.forEach(borrow => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${borrow.title}</strong></td>
            <td>${borrow.author}</td>
            <td>${borrow.borrowedDate}</td>
            <td>${borrow.dueDate}</td>
            <td><button class="delete" onclick="returnBook(${borrow.id})" style="background: var(--success); padding: 6px 12px; border: none; border-radius: 4px; cursor: pointer; color: white; font-weight: 600;">↩️ Return</button></td>
        `;
        tbody.appendChild(row);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    initializeDatabase();
    setRole('admin');
});
