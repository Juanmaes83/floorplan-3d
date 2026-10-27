/* SunCalc 2.1.1 solar position subset; Copyright (c) 2026 Volodymyr Agafonkin.
 * BSD-2-Clause: see LICENSE. Upstream 21449f34820c3c80a27a78cdc940747ff19ca1e3.
 * Only dependency closure through getPosition retained; UMD wrapper added; calculations unchanged. */
(function(root){

// shortcuts for easier to read formulas
const {PI, sin, cos, tan, asin, atan2: atan, acos, sqrt, abs, round, floor} = Math;
const rad = PI / 180;

// date/time constants and conversions

const dayMs = 1000 * 60 * 60 * 24;
const J1970 = 2440588;
const J2000 = 2451545;
const earthRadius = 6378.14; // equatorial radius in km, for the Moon's topocentric parallax

function fromJulian(j) {
    return new Date((j + 0.5 - J1970) * dayMs);
}
function toDays(date) {
    return date.valueOf() / dayMs - 0.5 + J1970 - J2000;
}

// ΔT = TT − UT in seconds (Espenak & Meeus polynomial fits, good ~1900–2150). The Meeus position
// series are defined in Terrestrial Time, but SunCalc's input Dates are UT — so the position math
// runs on days-since-J2000 shifted by deltaT, while sidereal time stays on UT. ~69 s today;
// negligible for the Sun (<0.001°), real for the Moon. d only needs ~month accuracy here (ΔT
// changes <1 s/yr), so the decimal year is derived arithmetically from d rather than from the Date.
function deltaT(d) {
    const y = 2000 + d / 365.2425;
    let t;
    if (y < 1920) { t = y - 1900; return -2.79 + t * (1.494119 + t * (-0.0598939 + t * (0.0061966 - t * 0.000197))); }
    if (y < 1941) { t = y - 1920; return 21.20 + t * (0.84493 + t * (-0.076100 + t * 0.0020936)); }
    if (y < 1961) { t = y - 1950; return 29.07 + t * (0.407 + t * (-1 / 233 + t / 2547)); }
    if (y < 1986) { t = y - 1975; return 45.45 + t * (1.067 + t * (-1 / 260 - t / 718)); }
    if (y < 2005) { t = y - 2000; return 63.86 + t * (0.3345 + t * (-0.060374 + t * (0.0017275 + t * (0.000651814 + t * 0.00002373599)))); }
    if (y < 2050) { t = y - 2000; return 62.92 + t * (0.32217 + t * 0.005589); }
    t = (y - 1820) / 100; return -20 + 32 * t * t - 0.5628 * (2150 - y);
}
function toDaysTT(d) {
    return d + deltaT(d) / 86400;
}

// general calculations for position

// north-based clockwise azimuth in degrees (0 = N, 90 = E, 180 = S, 270 = W)
function azimuth(H, phi, dec) {
    return (atan(sin(H), cos(H) * sin(phi) - tan(dec) * cos(phi)) / rad + 540) % 360;
}
function altitude(H, phi, dec) {
    return asin(sin(phi) * sin(dec) + cos(phi) * cos(dec) * cos(H));
}

// Greenwich mean sidereal time, formula 12.4 of Meeus (linear term; sub-arcsec T^2/T^3 dropped)
function siderealTime(d, lw) {
    return rad * (280.46061837 + 360.98564736629 * d) - lw;
}

function astroRefraction(h) {
    if (h < 0) h = 0; // formula valid for positive altitudes only

    // Meeus 16.4: 1.02 / tan(h + 10.26 / (h + 5.10)), h in degrees, arcmin result — folded into rad
    return 0.0002967 / tan(h + 0.00312536 / (h + 0.08901179));
}

// general sun calculations

// Sun's apparent equatorial coordinates, Meeus ch. 25. d = days since J2000 (TT); t = Julian centuries.
function sunCoords(d) {
    const t = d / 36525;
    const L0 = rad * (280.46646 + t * (36000.76983 + t * 0.0003032)); // 25.2 geometric mean longitude
    const M = rad * (357.52911 + t * (35999.05029 - t * 0.0001537)); // 25.3 mean anomaly
    const sinM = sin(M);
    const cosM = cos(M);
    const C = rad * ((1.914602 - t * (0.004817 + t * 0.000014)) * sinM + // equation of center
        (0.019993 - 0.000101 * t) * 2 * sinM * cosM + 0.000289 * sinM * (3 - 4 * sinM * sinM));
    const Om = rad * (125.04 - 1934.136 * t); // longitude of the ascending node
    const L = L0 + C - rad * (0.00569 + 0.00478 * sin(Om)); // apparent longitude (nutation + aberration)
    // 22.2 mean obliquity + 25.8 correction for apparent position
    const e = rad * (23.439291 - t * (0.0130042 + t * (0.00000016 - t * 0.000000504))) + rad * 0.00256 * cos(Om);

    return {
        ra: atan(cos(e) * sin(L), cos(L)), // 25.6
        dec: asin(sin(e) * sin(L)),        // 25.7
        lon: L
    };
}

// calculates sun position for a given date and latitude/longitude
function getPosition(date, lat, lng) {
    const lw = rad * -lng;
    const phi = rad * lat;
    const d = toDays(date);

    const c = sunCoords(toDaysTT(d)); // position series run on Terrestrial Time
    const H = siderealTime(d, lw) - c.ra; // sidereal time stays on UT
    const h = altitude(H, phi, c.dec);

    return {
        azimuth: azimuth(H, phi, c.dec),
        // apparent (refraction-corrected) altitude in degrees
        altitude: (h + astroRefraction(h)) / rad
    };
}


const api={getPosition};if(typeof module==='object')module.exports=api;else root.SunCalc=api;
})(globalThis);

