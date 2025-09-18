$(document).ready(function() {
    const API_URL = 'https://data.gov.il/api/3/action/datastore_search';
    // ID המשאב עבור "גמל נט - תשואות חודשיות"
    const RESOURCE_ID = '6d47d6b5-cb08-488b-b333-f1e717b1e1bd'; 
    let myChart; // משתנה שיחזיק את הגרף הגלובלי
    let allRecords = [];

    // פונקציה כללית לביצוע קריאות API
    function fetchData(params, callback) {
        $.ajax({
            method: "GET",
            url: API_URL,
            data: params,
            dataType: "json",
            success: function(data) {
                if (data && data.success && data.result.records) {
                    callback(data.result.records);
                } else {
                    console.error('Error fetching data or no records found:', data);
                    callback([]); 
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("AJAX Error: " + textStatus, errorThrown);
                callback([]);
            }
        });
    }

    // שלב 1: טעינת רשימת החברות
    function loadCompanies() {
        fetchData({
            resource_id: RESOURCE_ID,
            limit: 10000
        }, function(records) {
            allRecords = records;
            const companiesList = $('#companiesList');
            companiesList.empty();

            // קבלת שמות ייחודיים
            const companies = [...new Set(records.map(r => r.MANAGING_CORPORATION))].sort();
            
            companies.forEach(function(company) {
                companiesList.append(`<li class="company-button">${company}</li>`);
            });
        });
    }


        // שלב 2: טעינת קרנות עבור חברה ספציפית
    function loadFunds(companyName) {
        const fundsList = $('#fundsList');
        $('#fundsHeader').text('קרנות של: ' + companyName);
        $('#companiesSection').hide();
        $('#fundsSection').show();
        fundsList.empty();
        
        // סינון הרשומות לפי שם החברה שנבחרה
        const filteredRecords = allRecords.filter(record => 
            record.MANAGING_CORPORATION === companyName
        );
        
        // קבלת קרנות ייחודיות מתוך הרשומות המסוננות
        const uniqueFunds = {};
        filteredRecords.forEach(function(record) {
            if (!uniqueFunds[record.FUND_ID]) {
                uniqueFunds[record.FUND_ID] = record.FUND_NAME;
            }
        });
        
        Object.entries(uniqueFunds).forEach(([id, name]) => {
            fundsList.append(`<li data-fund-id="${id}" class="company-button">${name}</li>`);
        });
    }
    
    
    function displayChart(fundId, fundName) {
        // סינון הרשומות של הקרן הספציפית
        const fundRecords = allRecords.filter(record => record.FUND_ID === fundId);
        
        if (fundRecords.length === 0) {
            $('#chartContainer').hide();
            return;
        }
        $('#fundsSection').hide();
        
        // מיון הרשומות לפי תקופת הדיווח (REPORT_PERIOD) בסדר עולה
        fundRecords.sort((a, b) => a.REPORT_PERIOD - b.REPORT_PERIOD);
        
        // יצירת תוויות (labels) לגרף מהשדה REPORT_PERIOD
        // לדוגמה, המרה מ-202506 ל-"2025-06"
        const labels = fundRecords.map(r => {
            const year = String(r.REPORT_PERIOD).substring(0, 4);
            const month = String(r.REPORT_PERIOD).substring(4, 6);
            return `${year}-${month}`;
        });
        
        // יצירת מערך נתוני התשואה מהשדה MONTHLY_YIELD
    const performanceData = fundRecords.map(r => r.MONTHLY_YIELD);
    
    // קוד הגרף ממשיך מכאן...
    const ctx = document.getElementById('pensionChart').getContext('2d');
    
    if (myChart) {
        myChart.destroy();
    }
    
    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: `תשואה חודשית של ${fundName} (%)`,
                data: performanceData,
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                fill: false,
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: function(value) {
                            return value + '%';
                        }
                    }
                }
            }
        }
    });

    $('#chartContainer').show();
}

    // --- רישום מאזינים לאירועים ---

    $('#companiesList').on('click', 'li', function() {
        const companyName = $(this).text();
        $(this).addClass('selected').siblings().removeClass('selected');
        $('#chartContainer').hide();
        loadFunds(companyName);
    });

    $('#fundsList').on('click', 'li', function() {
        const fundId = $(this).data('fund-id');
        const fundName = $(this).text();
        $(this).addClass('selected').siblings().removeClass('selected');
        displayChart(fundId, fundName);
    });

    // התחלה
    loadCompanies();
});
