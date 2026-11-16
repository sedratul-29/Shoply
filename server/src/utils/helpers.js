const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

module.exports = { escapeRegex, round2, OBJECT_ID_RE };
