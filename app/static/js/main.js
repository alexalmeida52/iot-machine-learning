const CHANNEL = 196384;
const FIELD_NUMBER_1 = 1;
const FIELD_NUMBER_2 = 2;
const FIELD_NUMBER_3 = 3;
const FIELD_NUMBER_4 = 4;

// Exutando funções quando a tela carregar
window.onload = function() {
    // Aguardar enquanto libs são carregadas
    google.charts.load('current', {'packages':['corechart', 'scatter', 'line']});
    setTimeout(() => {
        drawChart(FIELD_NUMBER_1);
        drawChart(FIELD_NUMBER_1, true);
        drawChart(FIELD_NUMBER_2);
        drawChart(FIELD_NUMBER_2, true);
        drawChart(FIELD_NUMBER_3);
        drawChart(FIELD_NUMBER_3, true);
        drawChart(FIELD_NUMBER_4);
        drawChart(FIELD_NUMBER_4, true);
    }, 500);

    // Atualizar gráficos de 5 em 5 segundos
    setInterval(() => {
        drawChart(FIELD_NUMBER_1);
        drawChart(FIELD_NUMBER_2);
        drawChart(FIELD_NUMBER_3);
        drawChart(FIELD_NUMBER_4);
    }, 5*60000);
}



// Buscando dados do ThingSpeak de acordo com o cannel e field
function pullData(data) {
    return new Promise(async (resolve, reject) => {
        
        axios.get(`https://api.thingspeak.com/channels/${data.channel}/field/${data.field_number}/?results=720&timescale=20`).then(res => {
            return resolve(res.data);
        }).catch(err => reject(err));
        
    });
}

// Formatando resposta da api do ThingSpeak
function formatResponseFromApi(data, field, deviation) {
    const dataFormat = data.feeds.map((elm, i) => {
        
        if(deviation) {
            return [
                new Date(elm.created_at),
                Number(calcStandardDeviation(data.feeds.map(elm => Number(elm[field])).splice(0, i+1))),
            ];
        } else {
            return [
                new Date(elm.created_at),
                Number(elm[field]),
                Number(calcAverage(data.feeds.map(elm => Number(elm[field])).splice(0, i+1))),
            ];
        }
    });
    return dataFormat;
}

// Obter lista de valores capturados pela api do thingspeak
function getListOfValues(data, field) {
    const dataFormat = data.feeds.map(elm => Number(elm[field]));
    return dataFormat;
}

// Desenhar gráfico em linhas
async function drawChart(field_number, deviation) {

    const response = await pullData({ channel: CHANNEL, field_number: field_number });
    
    const rows = formatResponseFromApi(response, `field${field_number}`, deviation);
    var data = new google.visualization.DataTable();
    if(deviation) {
        data.addColumn('date');
        data.addColumn('number', 'Variação')
    } else {
        let tempNameField = field_number < 3 ? 'Temperatura' : field_number == 3 ? 'Pressão' : 'Humidade' 
        data.addColumn('date');
        data.addColumn('number', tempNameField)
        data.addColumn('number', 'Média')
    }

    data.addRows(rows);

    const info_chart = getInfoFields(field_number);
    
    var options = {
        title: info_chart.title,
        curveType: 'function',
        legend: { position: 'top'},
        hAxis: {
            title: 'Time',
            format: 'HH:mm',
        },
        vAxis: {
            title: info_chart.vAxisText
        },
    };

    var chart = new google.visualization.LineChart(document.getElementById(deviation ? `field_${field_number}_deviation` : `field_${field_number}`));
    
    chart.draw(data, google.charts.Scatter.convertOptions(options));

    let listOfValues = getListOfValues(response, `field${field_number}`);
    
    let temperature = listOfValues[listOfValues.length - 1];
    let standardDeviation = calcStandardDeviation(listOfValues);
    let average = calcAverage(listOfValues);
    document.getElementById(`temperature_field_${field_number}`).innerHTML = Number(temperature.toFixed(2));
    document.getElementById(`deviation_field_${field_number}`).innerHTML = Number(standardDeviation.toFixed(2));
    document.getElementById(`average_field_${field_number}`).innerHTML = Number(average.toFixed(2));
    
}    

function getInfoFields(field_number) {
    switch(field_number) {
        case 1: 
            return {
                title: 'Outdoor Temperature (DS18B20)',
                vAxisText: null
            }
        case 2: 
            return {
                title: 'Temperature (Si7021)',
                vAxisText: null//'Temperature [C]'
            }
        case 3: 
            return {
                title: 'Air Pressure (BMP280)',
                vAxisText: null //'Temperature [mmHg]'
            }
        case 4: 
            return {
                title: 'Humidity (Si7021)',
                vAxisText: null // 'Humidity [%]'
            }
    }
}

// Calcular desvio padrão
function calcStandardDeviation(listOfValues) {
    let average = listOfValues.reduce((amount, value) => amount+value/listOfValues.length, 0);
    let variance = listOfValues.reduce((amount, value) => amount + Math.pow(average - value, 2)/listOfValues.length, 0);
    let standardDeviation = Math.sqrt(variance);
    return standardDeviation;
}

// Calcular média
function calcAverage(listOfValues) {
    return (listOfValues.reduce((amount, value) => amount + value, 0))/listOfValues.length;
}