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


// The tertile sentence split into its comparison word, the rest of the sentence, and the
// class the word takes. Split rather than returned whole because the three renditions that
// use it need it three ways: the expanded panel and the print row want the word wrapped in
// its .comp-* class, and the collapsed row's screen-reader copy wants plain text. One source
// so a reader who meets the same fact in two places does not meet it in two vocabularies
const getTertileSentenceParts = (rank, rankReverse) => {

    const r = String(rank);
    const reverse = isRankReversed(rankReverse);

    if (r === '1') {
        return reverse
            ? { word: 'Lower', rest: ' than most neighborhoods', cssClass: 'comp-good' }
            : { word: 'Higher', rest: ' than most neighborhoods', cssClass: 'comp-bad' };
    }

    if (r === '2') {
        return { word: 'In the middle', rest: ' of neighborhoods', cssClass: 'comp-null' };
    }

    if (r === '3') {
        return reverse
            ? { word: 'Higher', rest: ' than most neighborhoods', cssClass: 'comp-bad' }
            : { word: 'Lower', rest: ' than most neighborhoods', cssClass: 'comp-good' };
    }

    return { word: '', rest: '', cssClass: '' };

};


// Expands the same rank into a full sentence fragment with the judgment word colored
const getTertileInlineLabel = (rank, rankReverse) => {

    const parts = getTertileSentenceParts(rank, rankReverse);

    if (!parts.word) return '';

    return '<span class="' + parts.cssClass + '">' + parts.word + '</span>' + parts.rest;

};


// The same sentence as plain text, for the collapsed row's screen-reader copy. That row shows
// only the bare word, and which way it goes is carried by the pill's background colour — so
// the tree gets the sentence and the pixels get a glyph (assets/scss/theme.scss)
const getTertileSentence = (rank, rankReverse) => {

    const parts = getTertileSentenceParts(rank, rankReverse);

    return parts.word ? parts.word + parts.rest : '';

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
