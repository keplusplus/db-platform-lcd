let updateCounter;
let station;
let platform;
let mock = false;
let realisticDelay = true;

const platformD = document.getElementById('p');
const stops = document.getElementById('stops');
const destination = document.getElementById('dest');
const departureTime = document.getElementById('dt');
const trainNumber = document.getElementById('tn');
const annotationString = document.getElementById('as');
const folgezug1DepartureTime = document.getElementById('fz1-dep');
const folgezug1Delay = document.getElementById('fz1-del');
const folgezug1TrainNumber = document.getElementById('fz1-tn');
const folgezug1Destination = document.getElementById('fz1-dest');
const folgezug1Platform = document.getElementById('fz1-plat');
const folgezug2DepartureTime = document.getElementById('fz2-dep');
const folgezug2Delay = document.getElementById('fz2-del');
const folgezug2TrainNumber = document.getElementById('fz2-tn');
const folgezug2Destination = document.getElementById('fz2-dest');
const folgezug2Platform = document.getElementById('fz2-plat');

const bar = document.getElementById('bar');

const inputDs100 = document.getElementById('input-ds100');
const inputPlatform = document.getElementById('input-platform');
const buttonUpdate = document.getElementById('button-update');

const checkboxMock = document.getElementById('c-mock');
const checkboxRealisticDelay = document.getElementById('c-realistic-delay');

function setPlatform(p) {
    platformD.innerHTML = p;
}

function setTrain(tn, dest, st, dt, as = '') {
    trainNumber.innerHTML = tn;
    destination.innerHTML = dest;
    stops.innerHTML = st;
    departureTime.innerHTML = dt;
    annotationString.innerHTML = as;
    if(String(as).length < 1) annotationString.classList.remove('bg-w');
    else annotationString.classList.add('bg-w');
}

function setFz1(tn, dest, dt, del, plat) {
    folgezug1TrainNumber.innerHTML = tn;
    folgezug1Destination.innerHTML = dest;
    folgezug1DepartureTime.innerHTML = dt;
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
    folgezug2DepartureTime.innerHTML = dt;
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

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms))
}

function fetch(url, platform) {
    const request = new XMLHttpRequest();

    if(!request) return {};

    request.onreadystatechange = () => {
        if(request.readyState == XMLHttpRequest.DONE && request.status == 200) {
            const res = JSON.parse(request.responseText);
            setDepartures(res, platform);
            return res;
        }
    }

    request.open('GET', url, true);
    request.send();

    return {};
}

function fetchMock(platform) {
    setDepartures(data, platform);
    return data;
}

function fetchData(station, platform) {
    setPlatform(platform);
    return fetch(`https://dbf.finalrewind.org/${station}?mode=json&version=3`, platform);
} 

function getDelay(t) {
    const delayString = delay => {
        if(delay) {
            if(realisticDelay && Math.round(delay / 5) > 0) {
                return '+' + Math.round(delay / 5) * 5;
            }
            if(!realisticDelay) {
                return '+' +delay;
            }
        }
        return '';
    }

    if(t['scheduledDeparture']) {
        return delayString(t['delayDeparture']);
    } else {
        return delayString(t['delayArrival']);
    }
}

function getVias(via) {
    let s = '';
    if(via[0]) s += via[0];
    if(via[1]) s += ' - ' + via[1];
    return s;
}

function getAnnotationString(t) {
    let s = '';
    const delay = String(getDelay(t)).substring(1);

    if(t['isCancelled']) {
        if(s !== '') s += ' - ';
        s += 'Fahrt fällt aus!';
        return s;
    }

    if(delay) {
        if(s !== '') s += ' - ';
        s += `Verspätung ca. ${delay} Min.`;
    }

    if(t['platform'] != t['scheduledPlatform'] && t['platform'] != platform) {
        if(s !== '') s += ' - ';
        s += 'Heute Gleis ' + t['platform']
    }

    if(!t['scheduledDeparture']) {
        if(s !== '') s += ' - ';
        s += 'Bitte nicht einsteigen!';
    }
    return s;
}

function getDestination(t) {
    if(!t['scheduledDeparture']) return `von ${t['route'][0]['name']}`;
    return t['destination'];
}

function setDepartures(d, p) {
    const departures = d.departures;
    if(!departures) return;
    departures.sort((e1, e2) => {
        const dep1 = e1['scheduledDeparture'] ? e1['scheduledDeparture'].split(':') : e1['scheduledArrival'].split(':');
        const dep2 = e2['scheduledDeparture'] ? e2['scheduledDeparture'].split(':') : e2['scheduledArrival'].split(':');
        let dt1 = new Date();
        let dt2 = new Date();
        if(dt1.getHours >= 12 && dep1[0] < 12) dt1.setDate(dt1.getDate() + 1);
        if(dt2.getHours >= 12 && dep2[0] < 12) dt2.setDate(dt2.getDate() + 1);
        dt1.setHours(dep1[0], dep1[1], 0, 0);
        dt2.setHours(dep2[0], dep2[1], 0, 0);

        if(e1['scheduledDeparture']) dt1.setMinutes(dt1.getMinutes() + (e1['delayDeparture'] ? e1['delayDeparture'] : 0));
        else dt1.setMinutes(dt1.getMinutes() + (e1['delayArrival'] ? e1['delayArrival'] : 0));
        if(e2['scheduledDeparture']) dt2.setMinutes(dt2.getMinutes() + (e2['delayDeparture'] ? e2['delayDeparture'] : 0));
        else dt2.setMinutes(dt2.getMinutes() + (e2['delayArrival'] ? e2['delayArrival'] : 0));
        
        return dt1 - dt2;
    })
    const filtered = departures.filter(e => e['platform'] == String(p) || e['scheduledPlatform'] == String(p));
    const t1 = filtered[0];
    const t2 = filtered[1];
    const t3 = filtered[2];
    p ? setPlatform(p) : setPlatform('');
    t1 ? setTrain(fixTrainNumber(t1['train']), getDestination(t1), getVias(t1['via']), t1['scheduledDeparture'] ? t1['scheduledDeparture'] : t1['scheduledArrival'], getAnnotationString(t1)): setTrain('', '', '', '', '');
    t2 ? setFolgezug(setFz1, t2) : setFz1('', '', '', '', '');
    t3 ? setFolgezug(setFz2, t3) : setFz2('', '', '', '', '');
}

function getFolgezugAnnotation(t) {
    if(t['isCancelled']) return 'fällt aus';
    if(t['platform'] != t['scheduledPlatform'] && t['platform'] != platform) return 'Gleis ' + t['platform'];
    return '';
}

function setFolgezug(setFunction, t) {
    setFunction(    fixTrainNumber(t['train']),
                    t['scheduledDeparture'] ? String(t['destination']).substring(0, 19) : 'von ' + String(t['route'][0]['name']).substring(0, 15),
                    t['scheduledDeparture'] ? t['scheduledDeparture'] : t['scheduledArrival'],
                    getDelay(t), getFolgezugAnnotation(t));
}

function fixTrainNumber(train) {
    if(String(train).includes('IC')) return train;
    return String(train).replace(' ', '');
}

function initForm() {
    buttonUpdate.addEventListener('click', () => {
        station = String(inputDs100.value).toUpperCase();
        platform = inputPlatform.value;
        updateCookie();
        updateCounter = 100;
    })

    checkboxMock.checked = mock;
    checkboxMock.addEventListener('change', () => {
        mock = checkboxMock.checked;
        updateCookie();
        updateCounter = 100;
    });
    checkboxRealisticDelay.checked = realisticDelay;
    checkboxRealisticDelay.addEventListener('change', () => {
        realisticDelay = checkboxRealisticDelay.checked;
        updateCookie();
        updateCounter = 100;
    });
}

function updateCookie() {
    const values = { station, platform, mock, realisticDelay };
    const expiry = new Date();
    expiry.setMonth(expiry.getMonth() + 6);
    if(!station || !platform) expiry.setTime(0);
    const cookie = `stationMonitorData=${JSON.stringify(values)}; expires=${expiry.toUTCString()}; SameSite=Lax`
    document.cookie = cookie;
}

function loadCookie() {
    const cookie = String(document.cookie.split(';').filter(v => v.includes('stationMonitorData')));
    if(!cookie) return;
    const json = cookie.substring(cookie.indexOf('=') + 1);
    const values = JSON.parse(json);
    if(values['station'] && values['platform']) {
        station = values['station'];
        inputDs100.value = values['station'];
        platform = values['platform'];
        inputPlatform.value = values['platform'];

        mock = values['mock'];
        realisticDelay = values['realisticDelay'];
    }
}

async function update() {
    initForm();
    setPlatform(platform ? platform : '');
    updateCounter = 100.0;
    while(true) {
        if(updateCounter >= 100.0) {
            updateCounter = 0.0;
            if(platform) {
                if(!mock && station) fetchData(station, platform);
                else fetchMock(platform);
            }
        }
        bar.setAttribute('style', `width: ${updateCounter}%;`);
        await sleep(30);
        updateCounter += 0.025;
    }
}

loadCookie();
update();
