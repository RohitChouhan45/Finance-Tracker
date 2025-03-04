document.addEventListener('DOMContentLoaded', () => {
  const state = {
    transactions: JSON.parse(localStorage.getItem('transactions')) || [],
    balance: 0,
    income: 0,
    expenses: 0,
    theme: localStorage.getItem('theme') || 'light'
  };

  const categoryIcons = {
    food: '🍔',
    transport: '🚗',
    shopping: '🛍️',
    entertainment: '🎮',
    bills: '📃',
    salary: '💰',
    investment: '📈',
    other: '📦'
  };

  const addBtn = document.getElementById('add-btn');
  const modal = document.getElementById('transaction-modal');
  const form = document.getElementById('transaction-form');
  const transactionsDiv = document.getElementById('transactions');
  const themeToggle = document.getElementById('theme-toggle');
  const themeIcon = document.getElementById('theme-icon');
  const themeText = document.getElementById('theme-text');
  const searchInput = document.getElementById('search');
  const categoryFilter = document.getElementById('category-filter');

  categoryFilter.innerHTML = `
    <option value="">All Categories</option>
    ${Object.entries(categoryIcons).map(([value, icon]) => 
      `<option value="${value}">${icon} ${value.charAt(0).toUpperCase() + value.slice(1)}</option>`
    ).join('')}
  `;

  function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    themeText.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
    localStorage.setItem('theme', theme);
    state.theme = theme;
  }

  themeToggle.addEventListener('click', () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  });

  setTheme(state.theme);

  function updateDateTime() {
    const timeElement = document.getElementById('current-time');
    const dateElement = document.getElementById('current-date');
    
    const now = new Date();
    
    // Update time - format: HH:MM:SS
    timeElement.textContent = now.toLocaleTimeString();
    
    // Update date - format: Day, Month Date, Year
    dateElement.textContent = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long', 
        day: 'numeric'
      });
  }

  // Update immediately when page loads
  updateDateTime();

  // Update every second
  setInterval(updateDateTime, 1000);

  function updateBalances() {
    state.income = state.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    
    state.expenses = state.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    state.balance = state.income - state.expenses;

    document.getElementById('total-balance').textContent = 
      `₹${state.balance.toFixed(2)}`;
    document.getElementById('total-income').textContent = 
      `₹${state.income.toFixed(2)}`;
    document.getElementById('total-expenses').textContent = 
      `₹${state.expenses.toFixed(2)}`;
  }

  function updateStats() {
    const avgTransaction = state.transactions.length > 0 
      ? state.transactions.reduce((sum, t) => sum + t.amount, 0) / state.transactions.length 
      : 0;

    const currentMonth = new Date().getMonth();
    const monthlyTransactions = state.transactions.filter(t => 
      new Date(t.date).getMonth() === currentMonth
    );
    const monthTotal = monthlyTransactions.reduce((sum, t) => 
      sum + (t.type === 'income' ? t.amount : -t.amount), 0
    );

    const largestExpense = state.transactions
      .filter(t => t.type === 'expense')
      .reduce((max, t) => Math.max(max, t.amount), 0);

    document.getElementById('avg-transaction').textContent = `₹${avgTransaction.toFixed(2)}`;
    document.getElementById('month-total').textContent = `₹${monthTotal.toFixed(2)}`;
    document.getElementById('largest-expense').textContent = `₹${largestExpense.toFixed(2)}`;
  }

  function updateCharts() {
    const categoryChart = Chart.getChart('category-chart');
    const monthlyChart = Chart.getChart('monthly-chart');
    if (categoryChart) categoryChart.destroy();
    if (monthlyChart) monthlyChart.destroy();

    const categoryData = {};
    state.transactions
      .filter(t => t.type === 'expense')  
      .forEach(t => {
        if (!categoryData[t.category]) categoryData[t.category] = 0;
        categoryData[t.category] += t.amount;
      });

    const monthlyData = {};
    const last6Months = [];
    for (let i = 0; i < 6; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short' });
      last6Months.unshift(month);
      monthlyData[month] = { income: 0, expense: 0 };
    }

    state.transactions.forEach(t => {
      const date = new Date(t.date);
      const month = date.toLocaleString('default', { month: 'short' });
      if (monthlyData[month]) {
        if (t.type === 'income') {
          monthlyData[month].income += t.amount;
        } else {
          monthlyData[month].expense += t.amount;
        }
      }
    });

    const categoryCtx = document.getElementById('category-chart').getContext('2d');
    new Chart(categoryCtx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(categoryData).map(cat => `${categoryIcons[cat]} ${cat}`),
        datasets: [{
          data: Object.values(categoryData),
          backgroundColor: [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', 
            '#FF9F40', '#FF6384', '#36A2EB'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text'),
              font: {
                size: 12
              }
            }
          },
          title: {
            display: false
          }
        }
      }
    });

    const monthlyCtx = document.getElementById('monthly-chart').getContext('2d');
    new Chart(monthlyCtx, {
      type: 'bar',
      data: {
        labels: last6Months,
        datasets: [{
          label: 'Income',
          data: last6Months.map(month => monthlyData[month].income),
          backgroundColor: 'rgba(46, 204, 113, 0.5)',
          borderColor: 'rgba(46, 204, 113, 1)',
          borderWidth: 1
        }, {
          label: 'Expenses',
          data: last6Months.map(month => monthlyData[month].expense),
          backgroundColor: 'rgba(231, 76, 60, 0.5)',
          borderColor: 'rgba(231, 76, 60, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true, 
        aspectRatio: 2, 
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--border')
            },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text')
            }
          },
          x: {
            grid: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--border')
            },
            ticks: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text')
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: getComputedStyle(document.documentElement).getPropertyValue('--text')
            }
          }
        }
      }
    });
  }

  searchInput.addEventListener('input', renderTransactions);
  categoryFilter.addEventListener('change', renderTransactions);

  function renderTransactions() {
    const searchTerm = searchInput.value.toLowerCase();
    const categoryFilterValue = categoryFilter.value;

    const filteredTransactions = state.transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm);
      const matchesCategory = !categoryFilterValue || t.category === categoryFilterValue;
      return matchesSearch && matchesCategory;
    });

    transactionsDiv.innerHTML = '';
    filteredTransactions.forEach(transaction => {
      const div = document.createElement('div');
      div.className = 'transaction-item';
      div.innerHTML = `
        <div style="display: flex; align-items: center;">
          <span class="category-icon">${categoryIcons[transaction.category]}</span>
          <div>
            <h3>${transaction.description}</h3>
            <small>${new Date(transaction.date).toLocaleDateString()} • ${transaction.category}</small>
          </div>
        </div>
        <div style="color: ${transaction.type === 'income' ? 'var(--primary)' : '#e74c3c'}">
          ${transaction.type === 'income' ? '+' : '-'}₹${transaction.amount.toFixed(2)}
        </div>
      `;
      transactionsDiv.appendChild(div);
    });
  }

  addBtn.addEventListener('click', () => {
    modal.style.display = 'block';
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.style.display = 'none';
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const transaction = {
      description: document.getElementById('description').value,
      amount: parseFloat(document.getElementById('amount').value),
      type: document.getElementById('type').value,
      category: document.getElementById('category').value,
      date: new Date().toISOString()
    };

    state.transactions.unshift(transaction);
    localStorage.setItem('transactions', JSON.stringify(state.transactions));
    
    updateBalances();
    updateStats();
    updateCharts();
    renderTransactions();
    
    modal.style.display = 'none';
    form.reset();
  });

  updateBalances();
  updateStats();
  updateCharts();
  renderTransactions();

  // Add budget functionality
  const budgetForm = document.getElementById('budget-form');
  const budgetList = document.getElementById('budget-list');

  if (budgetForm) {  // Check if we're on the budget page
  budgetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const budgetAmount = parseFloat(document.getElementById('budget-amount').value);
    const budgetDescription = document.getElementById('budget-description').value;

    if (budgetAmount && budgetDescription) {
      const listItem = document.createElement('li');
        listItem.innerHTML = `
          <div class="budget-item">
            <span>${budgetDescription}</span>
            <span>₹${budgetAmount.toFixed(2)}</span>
          </div>
        `;
      budgetList.appendChild(listItem);
      budgetForm.reset();

        // Save to localStorage
        const budgets = JSON.parse(localStorage.getItem('budgets') || '[]');
        budgets.push({ description: budgetDescription, amount: budgetAmount });
        localStorage.setItem('budgets', JSON.stringify(budgets));
      }
    });

    // Load existing budgets
    const savedBudgets = JSON.parse(localStorage.getItem('budgets') || '[]');
    savedBudgets.forEach(budget => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <div class="budget-item">
          <span>${budget.description}</span>
          <span>₹${budget.amount.toFixed(2)}</span>
        </div>
      `;
      budgetList.appendChild(listItem);
    });
  }
}); 

let totalIncome = parseFloat(localStorage.getItem('totalIncome')) || 0;
let totalExpenses = parseFloat(localStorage.getItem('totalExpenses')) || 0;
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
let budgetPieChart = null;

// Add this function to save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('totalIncome', totalIncome);
    localStorage.setItem('totalExpenses', totalExpenses);
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Add this function to load and display saved expenses
function loadSavedExpenses() {
    const expenseList = document.getElementById('expenseList');
    expenseList.innerHTML = ''; // Clear existing list

    expenses.forEach(expense => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div class="expense-item">
                <span class="expense-description">${expense.description}</span>
                <span class="expense-amount">₹${expense.amount.toFixed(2)}</span>
            </div>
        `;
        expenseList.appendChild(listItem);
    });

    // Update displays
    updateRemainingBudget();
    updateBudgetChart();
    updateTotalExpenses();
}

// Modify the addExpense event listener
document.getElementById('addExpense').addEventListener('click', function() {
    const expenseDescription = document.getElementById('expense').value;
    const expenseAmount = parseFloat(document.getElementById('amount').value);

    if (expenseDescription && !isNaN(expenseAmount) && expenseAmount > 0) {
        expenses.push({
            description: expenseDescription,
            amount: expenseAmount
        });

        const expenseList = document.getElementById('expenseList');
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div class="expense-item">
                <span class="expense-description">${expenseDescription}</span>
                <span class="expense-amount">₹${expenseAmount.toFixed(2)}</span>
            </div>
        `;
        expenseList.appendChild(listItem);

        totalExpenses += expenseAmount;

        // Clear input fields
        document.getElementById('expense').value = '';
        document.getElementById('amount').value = '';

        // Save to localStorage
        saveToLocalStorage();

        updateRemainingBudget();
        updateBudgetChart();
        updateTotalExpenses();
    } else {
        alert('Please enter valid expense details.');
    }
});

// Modify the calculateBudget event listener
document.getElementById('calculateBudget').addEventListener('click', function() {
    const newIncome = parseFloat(document.getElementById('income').value) || 0;
    if (newIncome !== totalIncome) {
        totalIncome = newIncome;
        
        // Save to localStorage
        saveToLocalStorage();

        updateRemainingBudget();
        updateBudgetChart();
    }
});

// Add this to initialize the income input with saved value
document.addEventListener('DOMContentLoaded', function() {
    // Set the income input value
    document.getElementById('income').value = totalIncome || '';
    
    // Load and display saved expenses
    loadSavedExpenses();
});

// Add a reset button functionality (optional)
function addResetButton() {
    const buttonContainer = document.querySelector('.button-container');
    const resetButton = document.createElement('button');
    resetButton.id = 'resetBudget';
    resetButton.textContent = 'Reset Budget';
    resetButton.style.background = '#e74c3c';
    buttonContainer.appendChild(resetButton);

    resetButton.addEventListener('click', function() {
        if (confirm('Are you sure you want to reset all budget data?')) {
            // Clear all data
            totalIncome = 0;
            totalExpenses = 0;
            expenses = [];
            
            // Clear localStorage
            localStorage.removeItem('totalIncome');
            localStorage.removeItem('totalExpenses');
            localStorage.removeItem('expenses');
            
            // Clear input fields
            document.getElementById('income').value = '';
            document.getElementById('expense').value = '';
            document.getElementById('amount').value = '';
            
            // Clear expense list
            document.getElementById('expenseList').innerHTML = '';
            
            // Update displays
            updateRemainingBudget();
            updateBudgetChart();
            updateTotalExpenses();
        }
    });
}

// Call this function when the page loads
addResetButton();

function updateBudgetChart() {
    const ctx = document.getElementById('budgetPieChart').getContext('2d');
    
    // Destroy existing chart if it exists
    if (budgetPieChart) {
        budgetPieChart.destroy();
    }

    // Generate colors for each expense
    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#2ecc71', '#e74c3c',
        '#3498db', '#f1c40f', '#9b59b6', '#1abc9c'
    ];

    // Prepare data for the pie chart
    const labels = expenses.map(exp => exp.description);
    const data = expenses.map(exp => exp.amount);
    
    // Add remaining budget as a segment if there's income
    if (totalIncome > 0) {
        labels.push('Remaining Budget');
        data.push(Math.max(0, totalIncome - totalExpenses));
        colors.push('#2ecc71'); // Green color for remaining budget
    }

    budgetPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors.slice(0, data.length),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Budget Distribution',
                    color: getComputedStyle(document.documentElement).getPropertyValue('--text')
                },
                legend: {
                    position: 'right',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text')
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            const percentage = ((value / totalIncome) * 100).toFixed(1);
                            return `₹${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

document.getElementById('theme').addEventListener('change', function() {
    const selectedTheme = this.value;
    document.body.className = selectedTheme;
    document.querySelector('.container').className = `container ${selectedTheme}`;
});

function updateRemainingBudget() {
    const remainingBudget = totalIncome - totalExpenses;
    const remainingBudgetElement = document.getElementById('remainingBudget');
    
    // Change background color based on remaining budget
    if (remainingBudget > totalIncome * 0.5) {
        remainingBudgetElement.style.background = 'linear-gradient(135deg, #2ecc71, #27ae60)';
    } else if (remainingBudget > totalIncome * 0.2) {
        remainingBudgetElement.style.background = 'linear-gradient(135deg, #f1c40f, #f39c12)';
    } else {
        remainingBudgetElement.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    }
    
    remainingBudgetElement.textContent = `Remaining Budget: ₹${remainingBudget.toFixed(2)}`;
}

// Add this new function to update total expenses display
function updateTotalExpenses() {
    const totalExpensesDisplay = document.getElementById('totalExpensesDisplay');
    totalExpensesDisplay.textContent = `Total: ₹${totalExpenses.toFixed(2)}`;
}

if ('WebSocket' in window) {
  (function () {
    function refreshCSS() {
      var sheets = [].slice.call(document.getElementsByTagName("link"));
      var head = document.getElementsByTagName("head")[0];
      for (var i = 0; i < sheets.length; ++i) {
        var elem = sheets[i];
        var parent = elem.parentElement || head;
        parent.removeChild(elem);
        var rel = elem.rel;
        if (elem.href && typeof rel != "string" || rel.length == 0 || rel.toLowerCase() == "stylesheet") {
          var url = elem.href.replace(/(&|\?)_cacheOverride=\d+/, '');
          elem.href = url + (url.indexOf('?') >= 0 ? '&' : '?') + '_cacheOverride=' + (new Date().valueOf());
        }
        parent.appendChild(elem);
      }
    }
    var protocol = window.location.protocol === 'http:' ? 'ws://' : 'wss://';
    var address = protocol + window.location.host + window.location.pathname + '/ws';
    var socket = new WebSocket(address);
    socket.onmessage = function (msg) {
      if (msg.data == 'reload') window.location.reload();
      else if (msg.data == 'refreshcss') refreshCSS();
    };
    if (sessionStorage && !sessionStorage.getItem('IsThisFirstTime_Log_From_LiveServer')) {
      console.log('Live reload enabled.');
      sessionStorage.setItem('IsThisFirstTime_Log_From_LiveServer', true);
    }
  })();
}
else {
  console.error('Upgrade your browser. This Browser is NOT supported WebSocket for Live-Reloading.');
}