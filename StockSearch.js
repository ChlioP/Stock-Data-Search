document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('searchForm');
    const clearBtn = document.getElementById('clearBtn');
    const resultsDiv = document.getElementById('results');

    searchForm.addEventListener('submit', function(event) {
        event.preventDefault(); // Prevent the default form submission
        const symbol = document.getElementById('symbol').value.trim();
        if (!symbol) {
            alert('Please fill out this field');
            return;
        }
    
        fetchStockData(symbol);
        fetchLatestNews(); 
    });
    

    clearBtn.addEventListener('click', function() {
        document.getElementById('symbol').value = '';
        clearTabContent();
        fetchLatestNews(); 
    });

    setupTabs();
});

function fetchStockData(symbol) {
    fetch(`/company-outlook?symbol=${symbol}`)
        .then(handleResponse)
        .then(data => {
            displayResults(data, 'outlook');
            openTab('outlook');
        })
        .catch(error => handleError(error, 'company-outlook'));

    fetch(`/stock-summary?symbol=${symbol}`)
        .then(handleResponse)
        .then(data => {
            displayStockResults(data);
            openTab('summary');
        })
        .catch(error => handleError(error, 'stock-summary'));
}

function fetchLatestNews() {
    fetch('/news')
        .then(handleResponse)
        .then(data => {
            displayNews(data);
            openTab('news');
        })
        .catch(error => handleError(error));
}

function displayStockResults(data) {
    if (data.error) {
        const infoDiv = document.getElementById('stockInfoTable');
        infoDiv.innerHTML = `<tr><td colspan="2" class="error">${data.error}</td></tr>`;
        return;
    }

    // Update elements with data
    document.getElementById('stockTicker').textContent = data['Ticker Symbol'] || 'N/A';
    document.getElementById('stockDay').textContent = data['Trading Day'] || 'N/A';
    document.getElementById('stockPrevClose').textContent = data['Previous Close'] || 'N/A';
    document.getElementById('stockOpen').textContent = data['Opening Price'] || 'N/A';
    document.getElementById('stockHigh').textContent = data['High Price'] || 'N/A';
    document.getElementById('stockLow').textContent = data['Low Price'] || 'N/A';
    document.getElementById('stockLast').textContent = data['Last Price'] || 'N/A';
    document.getElementById('stockChange').innerHTML = `${data['Change'] || 'N/A'} ${data['Change'] >= 0 ? '<span class="arrow-up">&#9650;</span>' : '<span class="arrow-down">&#9660;</span>'}`;
    document.getElementById('stockChangePercent').innerHTML = `${data['Change Percent'] || 'N/A'}% ${data['Change Percent'] >= 0 ? '<span class="arrow-up">&#9650;</span>' : '<span class="arrow-down">&#9660;</span>'}`;
    document.getElementById('stockVolume').textContent = data['Volume'] || 'N/A';
}

function handleResponse(response) {
    if (!response.ok) {
        throw new Error('Failed to fetch data: ' + response.statusText);
    }
    return response.json();
}

function handleError(error, section) {
    const errorDiv = document.getElementById(`${section}-error`);
    errorDiv.textContent = error.message;
}

function displayResults(data, tabName) {
    // Check if there is an error in the data and handle it
    if (data.error) {
        const infoDiv = document.getElementById('companyInfoTable');
        infoDiv.innerHTML = `<tr><td colspan="2" class="error">${data.error}</td></tr>`;
        return;
    }

    // Assign data to each cell by targeting their individual IDs
    document.getElementById('companyName').textContent = data['Company Name'] || 'N/A';
    document.getElementById('tickerSymbol').textContent = data['Ticker Symbol'] || 'N/A';
    document.getElementById('exchangeCode').textContent = data['Exchange Code'] || 'N/A';
    document.getElementById('startDate').textContent = data['Company Start Date'] || 'N/A';
    document.getElementById('description').textContent = data['Description'] || 'N/A';
}

function displayStockResults(data) {
    if (data.error) {
        const infoDiv = document.getElementById('stockInfoTable');
        infoDiv.innerHTML = `<tr><td colspan="2" class="error">${data.error}</td></tr>`;
        return;
    }

    // Update elements with data and handle null or undefined data
    document.getElementById('stockTicker').textContent = data['Ticker Symbol'] || 'N/A';
    document.getElementById('stockDay').textContent = data['Trading Day'] || 'N/A';
    document.getElementById('stockPrevClose').textContent = data['Previous Close'] || 'N/A';
    document.getElementById('stockOpen').textContent = data['Opening Price'] || 'N/A';
    document.getElementById('stockHigh').textContent = data['High Price'] || 'N/A';
    document.getElementById('stockLow').textContent = data['Low Price'] || 'N/A';
    document.getElementById('stockLast').textContent = data['Last Price'] || 'N/A';
    let change = data['Change'] || 'N/A';
    let changePercent = data['Change Percent'] || 'N/A';
    document.getElementById('stockChange').innerHTML = `${change} ${(change !== 'N/A' && change >= 0) ? '<span class="arrow-up">&#9650;</span>' : '<span class="arrow-down">&#9660;</span>'}`;
    document.getElementById('stockChangePercent').innerHTML = `${changePercent}% ${(changePercent !== 'N/A' && changePercent >= 0) ? '<span class="arrow-up">&#9650;</span>' : '<span class="arrow-down">&#9660;</span>'}`;
    document.getElementById('stockVolume').textContent = data['Volume'] || 'N/A';
}

function displayNews(newsItems) {
    const newsDiv = document.getElementById('news');
    if (newsItems.length === 0) {
        newsDiv.innerHTML = '<p>No news found for this ticker.</p>';
        return;
    }
    newsDiv.innerHTML = newsItems.map(item => 
        `<div>
            <h4>${item.title}</h4>
            <p>${item.description}</p>
            <a href="${item.url}" target="_blank">Read more</a>
        </div>`
    ).join('');
}

function setupTabs() {
    const tablinks = document.getElementsByClassName("tablink");
    Array.from(tablinks).forEach(link => {
        link.addEventListener('click', function(evt) {
            openTab(link.getAttribute('data-tab'));
        });
    });
}

function openTab(tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablink");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    document.querySelector(`.tablink[data-tab="${tabName}"]`).className += " active";
}


function clearTabContent() {
    const tabcontents = document.getElementsByClassName("tabcontent");
    Array.from(tabcontents).forEach(tc => {
        tc.innerHTML = '';
    });
}
