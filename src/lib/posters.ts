// Map of film title → poster image path
// Only includes films we have poster images for
const POSTER_MAP: Record<string, string> = {
  'Marty Supreme': '/movie-images/marty-supreme.jpg',
  'Sinners': '/movie-images/sinners.jpg',
  'Frankenstein': '/movie-images/frankenstein.jpg',
  'Sentimental Value': '/movie-images/sentimental-value.jpg',
  'One Battle after Another': '/movie-images/one-battle.jpg',
  'Bugonia': '/movie-images/bugonia.jpg',
  'The Ugly Stepsister': '/movie-images/ugly-stepsister.jpg',
  'Blue Moon': '/movie-images/blue-moon.jpg',
  'Hamnet': '/movie-images/hamnet.jpg',
  'The Smashing Machine': '/movie-images/smashing-machine.jpg',
  'F1': '/movie-images/f1.jpg',
  'Avatar: Fire and Ash': '/movie-images/avatar.jpg',
  'Elio': '/movie-images/elio.jpg',
  'Zootopia 2': '/movie-images/zootopia-2.jpg',
  'Song Sung Blue': '/movie-images/song-sung-blue.jpg',
  'Train Dreams': '/movie-images/train-dreams.jpg',
  'The Secret Agent': '/movie-images/secret-agent.jpg',
  'If I Had Legs I\'d Kick You': '/movie-images/kick-you.jpg',
}

export function getPosterForFilm(film: string): string | undefined {
  return POSTER_MAP[film]
}
