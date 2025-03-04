let paymentBreakdownChart = null;
let balanceChart = null;

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
function calculateAmortization() {
  // Get input values
  const loanAmount = parseFloat(document.getElementById('loanAmount').value);
  const annualRate = parseFloat(document.getElementById('interestRate').value) / 100;
  const years = parseInt(document.getElementById('loanTerm').value);

  // Calculate monthly rate and number of payments
  const monthlyRate = annualRate / 12;
  const numberOfPayments = years * 12;

  // Calculate monthly payment using compound interest formula
  // Formula: PMT = P * (r * (1 + r)^n) / ((1 + r)^n - 1)
  // Where: PMT = Monthly Payment, P = Principal, r = Monthly Rate, n = Number of Payments
  const monthlyPayment = loanAmount * 
    (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / 
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1);

  // Generate amortization schedule
  let balance = loanAmount;
  const schedule = [];
  const balanceData = [];
  let totalInterest = 0;

  for (let payment = 1; payment <= numberOfPayments; payment++) {
    const interest = balance * monthlyRate;
    const principal = monthlyPayment - interest;
    balance = balance - principal;
    totalInterest += interest;

    schedule.push({
      payment,
      monthlyPayment,
      principal,
      interest,
      balance: Math.max(0, balance)
    });

    balanceData.push(Math.max(0, balance));
  }

  const totalPayment = monthlyPayment * numberOfPayments;

  // Update summary
  document.getElementById('monthlyPayment').textContent = formatCurrency(monthlyPayment);
  document.getElementById('totalInterest').textContent = formatCurrency(totalInterest);
  document.getElementById('totalPayment').textContent = formatCurrency(totalPayment);

  // Update amortization table
  updateAmortizationTable(schedule);

  // Update charts
  updateCharts(loanAmount, totalInterest, schedule, balanceData);
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value).replace('₹', '₹');
}

function updateAmortizationTable(schedule) {
  const tbody = document.querySelector('#amortizationTable tbody');
  tbody.innerHTML = '';

  schedule.forEach(row => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.payment}</td>
      <td>${formatCurrency(row.monthlyPayment)}</td>
      <td>${formatCurrency(row.principal)}</td>
      <td>${formatCurrency(row.interest)}</td>
      <td>${formatCurrency(row.balance)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function updateCharts(loanAmount, totalInterest, schedule, balanceData) {
  // Payment Breakdown Chart
  const ctx1 = document.getElementById('paymentBreakdown').getContext('2d');
  if (paymentBreakdownChart) {
    paymentBreakdownChart.destroy();
  }
  
  paymentBreakdownChart = new Chart(ctx1, {
    type: 'pie',
    data: {
      labels: ['Principal', 'Interest'],
      datasets: [{
        data: [loanAmount, totalInterest],
        backgroundColor: ['#2ecc71', '#e74c3c']
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Total Payment Breakdown'
        }
      }
    }
  });

  // Balance Over Time Chart
  const ctx2 = document.getElementById('balanceChart').getContext('2d');
  if (balanceChart) {
    balanceChart.destroy();
  }

  balanceChart = new Chart(ctx2, {
    type: 'line',
    data: {
      labels: Array.from({ length: balanceData.length }, (_, i) => i + 1),
      datasets: [{
        label: 'Loan Balance',
        data: balanceData,
        borderColor: '#3498db',
        fill: false
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Loan Balance Over Time'
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => formatCurrency(value)
          }
        }
      }
    }
  });
}

// Calculate on page load
document.addEventListener('DOMContentLoaded', calculateAmortization);
