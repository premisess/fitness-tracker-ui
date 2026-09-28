// Characters that are easy to tell apart (no 0/O, 1/l/I) and easy to type on phones.
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';
const SYMBOLS = '!@#$%&*?-_+=';

/** A cryptographically random whole number from 0 to n - 1, with no bias. */
function randomInt(n) {
    const value = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / n) * n;
    do crypto.getRandomValues(value); while (value[0] >= limit);
    return value[0] % n;
}

const pick = (chars) => chars[randomInt(chars.length)];

/** A random password with lower and upper case letters, digits and symbols. */
export function generateStrongPassword(length = 16) {
    const all = LOWER + UPPER + DIGITS + SYMBOLS;
    const chars = [pick(LOWER), pick(UPPER), pick(DIGITS), pick(SYMBOLS)];
    while (chars.length < length) chars.push(pick(all));
    // Shuffle (Fisher-Yates) so the guaranteed characters can land anywhere.
    for (let i = chars.length - 1; i > 0; i--) {
        const j = randomInt(i + 1);
        [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return chars.join('');
}
