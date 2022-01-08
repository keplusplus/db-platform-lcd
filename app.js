
const platform = document.getElementById('p');
const stops = document.getElementById('stops');
const destination = document.getElementById('dest');
const depatureTime = document.getElementById('dt');
const trainNumber = document.getElementById('tn');
const folgezug1DepatureTime = document.getElementById('fz1-dep');
const folgezug1Delay = document.getElementById('fz1-del');
const folgezug1TrainNumber = document.getElementById('fz1-tn');
const folgezug1Destination = document.getElementById('fz1-dest');
const folgezug1Platform = document.getElementById('fz1-plat');
const folgezug2DepatureTime = document.getElementById('fz2-dep');
const folgezug2Delay = document.getElementById('fz2-del');
const folgezug2TrainNumber = document.getElementById('fz2-tn');
const folgezug2Destination = document.getElementById('fz2-dest');
const folgezug2Platform = document.getElementById('fz2-plat');

function setPlatform(p) {
    platform.innerHTML = p;
}

function setTrain(tn, dest, st, dt) {
    trainNumber.innerHTML = tn;
    destination.innerHTML = dest;
    stops.innerHTML = st;
    depatureTime.innerHTML = dt;
}

function setFz1(tn, dest, dt, del, plat) {
    folgezug1TrainNumber.innerHTML = tn;
    folgezug1Destination.innerHTML = dest;
    folgezug1DepatureTime.innerHTML = dt;
    folgezug1Delay.innerHTML = del;
    if(!del) folgezug1Delay.classList.remove('bg-w');
    else folgezug1Delay.classList.add('bg-w');
    folgezug1Platform.innerHTML = plat;
    if(!plat) folgezug1Platform.classList.remove('bg-w');
    else folgezug1Platform.classList.add('bg-w');
}

function clearFz1() {
    setFz1('', '', '', '', '');
}

function setFz2(tn, dest, dt, del, plat) {
    folgezug2TrainNumber.innerHTML = tn;
    folgezug2Destination.innerHTML = dest;
    folgezug2DepatureTime.innerHTML = dt;
    folgezug2Delay.innerHTML = del;
    if(!del) folgezug2Delay.classList.remove('bg-w');
    else folgezug2Delay.classList.add('bg-w');
    folgezug2Platform.innerHTML = plat;
    if(!plat) folgezug2Platform.classList.remove('bg-w');
    else folgezug2Platform.classList.add('bg-w');
}

function clearFz2() {
    setFz2('', '', '', '', '');
}

console.log("Depature board initalization");

function test1() {
    setPlatform(22);
    setTrain('IC 2157', 'Gera Hbf', 'Warburg - KS-Wilhelmshöhe', '18:04');
    clearFz1();
    clearFz2();
}

function test2v1() {
    setPlatform(9);
    setTrain('ICE 372', 'Berlin Ostbahnhof', 'Fulda - KS-Wilhelmshöhe', '11:14');
    setFz1('ICE 595', 'München Hbf', '11:50', '+15', '');
    setFz2('ICE 27', 'Wien Hbf', '12:22', '', '');
}

function test2v2() {
    setPlatform(9);
    setTrain('', '', '', '');
    setFz1('ICE 595', 'München Hbf', '11:50', '+15', '');
    setFz2('ICE 27', 'Wien Hbf', '12:22', '', '');
}

function test2v3() {
    setPlatform(9);
    setTrain('ICE 595', 'München Hbf', 'Mannheim - Stuttgart', '11:50');
    setFz1('ICE 27', 'Wien Hbf', '12:22', '', '');
    clearFz2();
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms))
}

async function start() {
    test2v1();
    await sleep(5000);
    test2v2();
    await sleep(1840);
    test2v3();
}

function fetch(url) {
    const request = new XMLHttpRequest();

    if(!request) return {};

    request.onreadystatechange = () => {
        if(request.readyState == XMLHttpRequest.DONE && request.status == 200) {
            return JSON.parse(request.responseText);
        } else {
            console.log('error');
        }
    }

    request.open('GET', url, true);
    request.send();

    return {};
}

function fetchMock() {
    return data;
}

function fetchData() {
    return fetch('https://dbf.finalrewind.org/Altenbeken?mode=json&version=3&limit=20');
} 

function getDelay(t) {
    if(t['scheduledDeparture']) {
        if(t['delayDeparture']) {
            return '+' + t['delayDeparture'];
        }
    } else {
        if(t['delayArrival']) {
            return '+' + t['delayArrival'];
        }
    }

    return '';
}

function setDepartures(d, p) {
    const departures = d.departures;
    const filtered = departures.filter(e => e.scheduledPlatform == String(p));
    const t1 = filtered[0];
    const t2 = filtered[1];
    const t3 = filtered[2];
    setPlatform(p);
    setTrain(fixTrainNumber(t1['train']), t1['destination'], t1['via'][0], t1['scheduledDeparture'] ? t1['scheduledDeparture'] : t1['scheduledArrival']);
    setFolgezug(setFz1, t2);
    setFolgezug(setFz2, t3);
}

function setFolgezug(setFunction, t) {
    setFunction(    fixTrainNumber(t['train']),
                    t['scheduledDeparture'] ? String(t['destination']).substring(0, 19) : 'von ' + String(t['route'][0]['name']).substring(0, 15),
                    t['scheduledDeparture'] ? t['scheduledDeparture'] : t['scheduledArrival'],
                    getDelay(t), t['platform'] != t['scheduledPlatform'] ? 'Gleis ' + t['platform'] : '');
}

function fixTrainNumber(train) {
    if(String(train).includes('IC')) return train;
    return String(train).replace(' ', '');
}

setDepartures(fetchMock(), 21);
