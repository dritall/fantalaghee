/**
 * Formato unico delle copertine Gazzetta.
 * Larghezza CSS del template: 900px (.page-container). Lo screenshot è scalato
 * in modo che il file pubblicato non superi COVER_MAX_WIDTH, WebP qualità 80.
 * Gli hero committati usano gli stessi limiti: sono il materiale per rigenerare
 * la copertina, non serve tenerli a 2K.
 */
const COVER_CSS_WIDTH = 900;
const COVER_MAX_WIDTH = 1600;
const COVER_WEBP_QUALITY = 80;

function coverScaleFactor() {
    return COVER_MAX_WIDTH / COVER_CSS_WIDTH;
}

module.exports = {
    COVER_CSS_WIDTH,
    COVER_MAX_WIDTH,
    COVER_WEBP_QUALITY,
    coverScaleFactor,
};
