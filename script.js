$(document).ready(function() {
    const API_URL = 'https://data.gov.il/api/action/datastore_search_sql';
    // ID המשאב עבור "גמל נט - תשואות חודשיות"
    const RESOURCE_ID = 'a30b3d9f-9914-4369-b5b2-3814c711a13b'; 
    let myChart; // משתנה שיחזיק את הגרף הגלובלי

    // פונקציה כללית לביצוע קריאות API
    function fetchData(sqlQuery, callback) {
        $.ajax({
            method: "POST",
            url: API_URL,
            data: { sql: sqlQuery },
            dataType: "json",
            success: function(data) {
                if (data && data.success && data.result.records) {
                    callback(data.result.records);
                } else {
                    console.error('Error fetching data or no records found:', data);
                    callback([]); // שלח מערך ריק במקרה של שגיאה
                }
            },
            error: function(jqXHR, textStatus, errorThrown) {
                console.error("AJAX Error: " + textStatus, errorThrown);
                callback([]); // שלח מערך ריק במקרה של שגיאה
            }
        });
    }

    // שלב 1: טעינת רשימת החברות
    function loadCompanies() {
        // שאילתה לשליפת שמות חברות ייחודיים
        const sql = `SELECT DISTINCT "GUMAR_HEVRA" FROM "${RESOURCE_ID}" ORDER BY "GUMAR_HEVRA"`;
        fetchData(sql, function(records) {
            const companiesList = $('#companiesList');
            companiesList.empty(); // נקה רשימה קיימת
            records.forEach(function(record) {
                // הוסף כל חברה כפריט לרשימה
                companiesList.append(`<li>${record.GUMAR_HEVRA}</li>`);
            });
        });
    }

    // שלב 2: טעינת קרנות עבור חברה ספציפית
    function loadFunds(companyName) {
        // שאילתה לשליפת קרנות המשויכות לחברה
        const sql = `SELECT DISTINCT "SHEM_KUPA", "ID_KUPA" FROM "${RESOURCE_ID}" WHERE "GUMAR_HEVRA" = '${companyName}' ORDER BY "SHEM_KUPA"`;
        fetchData(sql, function(records) {
            const fundsList = $('#fundsList');
            $('#fundsHeader').text('קרנות של: ' + companyName);
            $('#fundsSection').show(); // הצג את אזור הקרנות
            fundsList.empty(); // נקה רשימה קיימת
            records.forEach(function(record) {
                // הוסף כל קרן כפריט לרשימה עם מזהה ייחודי
                fundsList.append(`<li data-fund-id="${record.ID_KUPA}">${record.SHEM_KUPA}</li>`);
            });
        });
    }

    // שלב 3: הצגת גרף תשואות עבור קרן ספציפית
    function displayChart(fundId, fundName) {
        // שאילתה לשליפת נתוני התשואה ב-12 החודשים האחרונים
        const sql = `SELECT "TKUFAT_DIVUACH", "TSUA_NETO_MITZTABERET_12_HODASHIM" FROM "${RESOURCE_ID}" WHERE "ID_KUPA" = '${fundId}' ORDER BY "TKUFAT_DIVUACH" ASC LIMIT 12`;
        fetchData(sql, function(records) {
            if (records.length === 0) {
                $('#chartContainer').hide();
                return;
            }

            // מיפוי הנתונים לצורה שהגרף דורש
            const labels = records.map(r => r.TKUFAT_DIVUACH.substring(0, 7)).reverse();
            const performanceData = records.map(r => r.TSUA_NETO_MITZTABERET_12_HODASHIM).reverse();

            const ctx = document.getElementById('pensionChart').getContext('2d');
            
            // הרס גרף קודם אם קיים
            if (myChart) {
                myChart.destroy();
            }

            // יצירת גרף חדש
            myChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: `תשואה שנתית נטו של ${fundName} (%)`,
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
                                // הוספת סימן אחוז לערכים בציר Y
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        }
                    }
                }
            });

            $('#chartContainer').show(); // הצג את אזור הגרף
        });
    }

    // --- רישום מאזינים לאירועים (Event Listeners) ---

    // מאזין ללחיצה על שם חברה
    $('#companiesList').on('click', 'li', function() {
        const companyName = $(this).text();
        // הדגשת החברה שנבחרה
        $(this).addClass('selected').siblings().removeClass('selected');
        $('#chartContainer').hide(); // הסתר גרף קודם
        loadFunds(companyName);
    });

    // מאזין ללחיצה על שם קרן
    $('#fundsList').on('click', 'li', function() {
        const fundId = $(this).data('fund-id');
        const fundName = $(this).text();
        // הדגשת הקרן שנבחרה
        $(this).addClass('selected').siblings().removeClass('selected');
        displayChart(fundId, fundName);
    });

    // התחלת התהליך: טען את רשימת החברות כשהדף מוכן
    loadCompanies();
});