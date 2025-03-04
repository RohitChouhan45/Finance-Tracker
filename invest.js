let totalInvestment = parseFloat(localStorage.getItem('totalInvestment')) || 0;
let totalInvested = parseFloat(localStorage.getItem('totalInvested')) || 0;
let investments = JSON.parse(localStorage.getItem('investments')) || [];
let investmentPieChart = null;
let investmentTypeChart = null;

// Investment type icons
const investmentIcons = {
    stocks: '📈',
    mutual_funds: '📊',
    fixed_deposit: '🏦',
    real_estate: '🏠',
    gold: '💰',
    crypto: '₿',
    other: '💎'
};

// Save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('totalInvestment', totalInvestment);
    localStorage.setItem('totalInvested', totalInvested);
    localStorage.setItem('investments', JSON.stringify(investments));
}

// Load and display saved investments
function loadSavedInvestments() {
    const investmentList = document.getElementById('investmentList');
    investmentList.innerHTML = '';

    investments.forEach(investment => {
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div class="investment-item">
                <div class="investment-icon">${investmentIcons[investment.type]}</div>
                <div class="investment-details">
                    <span class="investment-description">${investment.description}</span>
                    <span class="investment-type">${investment.type.replace('_', ' ').toUpperCase()}</span>
                </div>
                <span class="investment-amount">₹${investment.amount.toFixed(2)}</span>
            </div>
        `;
        investmentList.appendChild(listItem);
    });

    updateInvestmentSummary();
    updateCharts();
}

// Add investment event listener
document.getElementById('addInvestment').addEventListener('click', function() {
    const investmentType = document.getElementById('investment-type').value;
    const investmentDescription = document.getElementById('investment').value;
    const investmentAmount = parseFloat(document.getElementById('amount').value);

    if (investmentDescription && !isNaN(investmentAmount) && investmentAmount > 0) {
        const newInvestment = {
            type: investmentType,
            description: investmentDescription,
            amount: investmentAmount
        };

        investments.push(newInvestment);
        totalInvested += investmentAmount;

        const investmentList = document.getElementById('investmentList');
        const listItem = document.createElement('li');
        listItem.innerHTML = `
            <div class="investment-item">
                <div class="investment-icon">${investmentIcons[investmentType]}</div>
                <div class="investment-details">
                    <span class="investment-description">${investmentDescription}</span>
                    <span class="investment-type">${investmentType.replace('_', ' ').toUpperCase()}</span>
                </div>
                <span class="investment-amount">₹${investmentAmount.toFixed(2)}</span>
            </div>
        `;
        investmentList.appendChild(listItem);

        // Clear input fields
        document.getElementById('investment').value = '';
        document.getElementById('amount').value = '';

        saveToLocalStorage();
        updateInvestmentSummary();
        updateCharts();
    } else {
        alert('Please enter valid investment details.');
    }
});

// Update Goal button event listener
document.getElementById('calculateInvestment').addEventListener('click', function() {
    const newInvestment = parseFloat(document.getElementById('total-investment').value) || 0;
    if (newInvestment !== totalInvestment) {
        totalInvestment = newInvestment;
        saveToLocalStorage();
        updateInvestmentSummary();
        updateCharts();
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('total-investment').value = totalInvestment || '';
    loadSavedInvestments();
    updateCharts();
});

// Add this reset button event listener
document.getElementById('resetInvestment').addEventListener('click', function() {
    if (confirm('⚠️ Warning: This will delete all your investment data!\n\nAre you sure you want to continue?')) {
        // Clear all data
        totalInvestment = 0;
        totalInvested = 0;
        investments = [];
        
        // Clear localStorage
        localStorage.removeItem('totalInvestment');
        localStorage.removeItem('totalInvested');
        localStorage.removeItem('investments');
        
        // Clear input fields
        document.getElementById('total-investment').value = '';
        document.getElementById('investment').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('investment-type').selectedIndex = 0;
        document.getElementById('typeFilter').selectedIndex = 0;
        document.getElementById('investmentList').innerHTML = '';
        
        // Update displays
        updateInvestmentSummary();
        updateCharts();

        // Show success message
        alert('✅ All investment data has been reset successfully!');
    }
});

// Update both charts
function updateCharts() {
    updateInvestmentChart();
    updateTypeChart();
}

// Update investment distribution chart
function updateInvestmentChart() {
    const ctx = document.getElementById('investmentPieChart').getContext('2d');
    
    if (investmentPieChart) {
        investmentPieChart.destroy();
    }

    const colors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', 
        '#9966FF', '#FF9F40', '#2ecc71', '#e74c3c',
        '#3498db', '#f1c40f', '#9b59b6', '#1abc9c'
    ];

    // Group investments by type
    const typeData = {};
    investments.forEach(inv => {
        if (!typeData[inv.type]) {
            typeData[inv.type] = 0;
        }
        typeData[inv.type] += inv.amount;
    });

    const labels = Object.keys(typeData).map(type => type.replace('_', ' ').toUpperCase());
    const data = Object.values(typeData);
    
    if (totalInvestment > 0) {
        const remaining = Math.max(0, totalInvestment - totalInvested);
        if (remaining > 0) {
            labels.push('Remaining to Invest');
            data.push(remaining);
            colors.push('#2ecc71');
        }
    }

    investmentPieChart = new Chart(ctx, {
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
                            const percentage = ((value / totalInvestment) * 100).toFixed(1);
                            return `₹${value.toFixed(2)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Update investment type chart
function updateTypeChart() {
    const ctx = document.getElementById('investmentTypeChart').getContext('2d');
    
    if (investmentTypeChart) {
        investmentTypeChart.destroy();
    }

    const typeData = {};
    investments.forEach(inv => {
        typeData[inv.type] = (typeData[inv.type] || 0) + inv.amount;
    });

    investmentTypeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(typeData).map(type => type.replace('_', ' ').toUpperCase()),
            datasets: [{
                data: Object.values(typeData),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#2ecc71'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        color: getComputedStyle(document.documentElement).getPropertyValue('--text')
                    }
                }
            }
        }
    });
}

// Update the investment summary
function updateInvestmentSummary() {
    const progress = totalInvestment > 0 ? (totalInvested / totalInvestment) * 100 : 0;
    document.getElementById('investmentProgress').style.width = `${Math.min(progress, 100)}%`;
    document.getElementById('investmentGoal').textContent = `₹${totalInvestment.toFixed(2)}`;
    document.getElementById('totalInvestmentsDisplay').textContent = `₹${totalInvested.toFixed(2)}`;
    
    // Update the progress bar color based on progress
    const progressBar = document.getElementById('investmentProgress');
    if (progress >= 100) {
        progressBar.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
    } else if (progress >= 50) {
        progressBar.style.background = 'linear-gradient(90deg, #f1c40f, #f39c12)';
    } else {
        progressBar.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
    }
}

// Type filter functionality
document.getElementById('typeFilter').addEventListener('change', function(e) {
    const filterType = e.target.value;
    const items = document.querySelectorAll('.investment-item');
    
    items.forEach(item => {
        if (filterType === 'all' || item.querySelector('.investment-type').textContent === filterType.toUpperCase()) {
            item.style.display = 'grid';
        } else {
            item.style.display = 'none';
        }
    });
}); 