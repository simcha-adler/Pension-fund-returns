// מחכה שהדף כולו ייטען לפני הרצת הקוד
$(document).ready(function() {
    // מזהה את אלמנט ה-select על ידי ה-id שלו ומאזין לשינויים
    $('#pensionFundSelect').on('change', function() {
        // קורא את הערך שנבחר מתוך רשימת הבחירה
        var selectedFundId = $(this).val();

        // בודק אם הערך שנבחר אינו ריק (כלומר, המשתמש בחר בקרן ספציפית)
        if (selectedFundId) {
            // הכתובת של ה-API
            var apiUrl = 'https://data.gov.il/api/action/datastore_search_sql';
            
            // השאילתה ל-API. חשוב להחליף את 'your_resource_id' במזהה האמיתי של מאגר הנתונים
            var sqlQuery = "SELECT * from \"your_resource_id\" WHERE \"FUND_ID\" = '" + selectedFundId + "' ORDER BY \"REPORT_DATE\" DESC LIMIT 100";

            // מבצע קריאת AJAX ל-API
            $.ajax({
                url: apiUrl,
                data: { sql: sqlQuery },
                dataType: "jsonp", // משתמש ב-JSONP לצורך מעבר בין דומיינים (CORS)
                success: function(data) {
                    // בודק אם הנתונים התקבלו בהצלחה
                    if (data && data.result && data.result.records) {
                        var records = data.result.records;

                        // מעבד את הנתונים לצורך הגרף
                        var labels = records.map(function(record) {
                            return record.REPORT_DATE.substring(0, 7); // מעצב את התאריך לחודש ושנה
                        }).reverse(); // הופך את המערך כדי שהתאריכים יהיו בסדר עולה

                        var performanceData = records.map(function(record) {
                            return record.YIELD_VAL; // שם השדה המייצג את התשואה, ייתכן שצריך להתאים את השם
                        }).reverse(); // הופך את המערך בהתאם

                        // יוצר את הגרף
                        var ctx = document.getElementById('pension-chart').getContext('2d');
                        
                        // אם קיים גרף קודם, הורס אותו כדי למנוע כפילויות
                        if (window.myChart) {
                            window.myChart.destroy();
                        }
                        
                        // יוצר אובייקט גרף חדש ומציג אותו
                        window.myChart = new Chart(ctx, {
                            type: 'line',
                            data: {
                                labels: labels,
                                datasets: [{
                                    label: 'תשואה (%)',
                                    data: performanceData,
                                    borderColor: 'rgba(75, 192, 192, 1)',
                                    borderWidth: 2,
                                    fill: false
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                    y: {
                                        beginAtZero: false // מאפשר לגרף להתחיל מערך שאינו אפס אם יש ערכים שליליים
                                    }
                                }
                            }
                        });

                    } else {
                        console.error('No data received from API');
                    }
                },
                error: function(jqXHR, textStatus, errorThrown) {
                    // מטפל בשגיאות בקריאת ה-API
                    console.error("AJAX Error: " + textStatus, errorThrown);
                }
            });
        }
    });
});