export function validateAnswerCharacters(answer: string): string | null {
  // Unicode Cc entspricht Rusts char::is_control an der Command-Grenze.
  return /\p{Cc}/u.test(answer)
    ? 'In deiner Antwort steckt ein unsichtbares Sonderzeichen. Lösche die Eingabe und tippe sie neu.'
    : null;
}
