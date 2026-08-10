// ======================================================================= //
// tertiles.js
// ======================================================================= //

// ----------------------------------------------------------------------- //
// tertile and comparison helpers
// ----------------------------------------------------------------------- //

// rankReverse marks indicators where lower values are directionally better. It
// arrives as a boolean from some report payloads and as the string 'true' from
// others, so every consumer has to accept both
const isRankReversed = value => value === true || value === 'true';


// Reduces a tertile rank to the bare "Higher"/"Lower" word shown on the card pill
const getTertileLabel = (rank, rankReverse) => {

    // Normalize rank values that may arrive as numbers or strings
    const r = String(rank);
    const reverse = isRankReversed(rankReverse);

    if (r === '1') {
        return reverse ? 'Lower' : 'Higher';
    }

    if (r === '2') {
        return '';
    }

    if (r === '3') {
        return reverse ? 'Higher' : 'Lower';
    }

    return '';

};


// Returns the pill class the production report styling expects: worse, better, or middle
const getTertilePillClass = (rank, rankReverse) => {

    const r = String(rank);
    const reverse = isRankReversed(rankReverse);

    if (r === '1') return reverse ? 'better' : 'worse';
    if (r === '3') return reverse ? 'worse' : 'better';
    if (r === '2') return 'middle';

    return '';

};


// Expands the same rank into a full sentence fragment with the judgment word colored
const getTertileInlineLabel = (rank, rankReverse) => {

    const r = String(rank);
    const reverse = isRankReversed(rankReverse);

    if (r === '1') {
        return reverse
            ? '<span class="comp-good">Lower</span> than most neighborhoods'
            : '<span class="comp-bad">Higher</span> than most neighborhoods';
    }

    if (r === '2') {
        return '<span class="comp-null">In the middle</span> of neighborhoods';
    }

    if (r === '3') {
        return reverse
            ? '<span class="comp-bad">Higher</span> than most neighborhoods'
            : '<span class="comp-good">Lower</span> than most neighborhoods';
    }

    return '';

};


// Compares a neighborhood value against a borough or city value, with the judgment class.
// The judgment word and its preposition are returned separately because only the word is
// styled — the preposition belongs to the sentence around it, and "Equal" takes "to"
// where the other two take "than"
const getComparison = (neighVal, refVal, rankReverse) => {

    // Parse defensively because the source payload can contain string numerics
    const n = Number(neighVal);
    const r = Number(refVal);
    const reverse = isRankReversed(rankReverse);

    // When either side is not numeric, omit comparison messaging
    if (isNaN(n) || isNaN(r)) {
        return { word: '', preposition: '', cssClass: '' };
    }

    let word;
    let preposition;
    let cls;

    // rankReverse flips "good" vs "bad" judgment for metrics where lower values are better
    if (n > r) {
        word = 'Higher';
        preposition = 'than';
        cls = reverse ? 'comp-good' : 'comp-bad';
    } else if (n < r) {
        word = 'Lower';
        preposition = 'than';
        cls = reverse ? 'comp-bad' : 'comp-good';
    } else {
        word = 'Equal';
        preposition = 'to';
        cls = 'comp-null';
    }

    return { word: word, preposition: preposition, cssClass: cls };

};
