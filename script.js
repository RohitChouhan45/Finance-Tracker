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
    const now = new Date();
    
    document.getElementById('current-time').textContent = 
      now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      });
    
    document.getElementById('current-date').textContent = 
      now.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      });
  }

  updateDateTime();
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
});
