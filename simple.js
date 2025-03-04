let paymentBreakdownChart = null;
let balanceChart = null;

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

  // Calculate monthly payment using simple interest formula
  const totalInterestSimple = loanAmount * annualRate * years; // Total interest for simple interest
  const totalPaymentSimple = loanAmount + totalInterestSimple; // Total payment for simple interest
  const monthlyPaymentSimple = totalPaymentSimple / numberOfPayments; // Monthly payment for simple interest

  // Generate amortization schedule
  let balance = loanAmount;
  const schedule = [];
  const balanceData = [];

  for (let payment = 1; payment <= numberOfPayments; payment++) {
    const interest = balance * monthlyRate;
    const principal = monthlyPaymentSimple - interest;
    balance -= principal;

    schedule.push({
      payment,
      monthlyPayment: monthlyPaymentSimple,
      principal,
      interest,
      balance: Math.max(0, balance)
    });

    balanceData.push(Math.max(0, balance));
}
  // Update summary
document.getElementById('monthlyPayment').textContent = formatCurrency(monthlyPaymentSimple);
document.getElementById('totalInterest').textContent = formatCurrency(totalInterestSimple);
document.getElementById('totalPayment').textContent = formatCurrency(totalPaymentSimple);

// Update amortization table
updateAmortizationTable(schedule);

// Update charts
updateCharts(loanAmount, totalInterestSimple, schedule, balanceData);
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
