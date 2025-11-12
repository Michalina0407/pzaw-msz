# Projekt 02 – Sekcja komentarzy

## Opis projektu
Prosta aplikacja typu sekcja komentarzy, napisana w Node.js z użyciem Express i EJS.  
Pozwala przeglądać listę postów, zobaczyć komentarze oraz dodać własny komentarz.

## Struktura projektu
- `index.js` – serwer Express + routing  
- `models/komentarze.js` – dane w pamięci (lista postów i komentarzy)  
- `views/` – pliki EJS (`posty.ejs`, `post.ejs`, `forms/new_card.ejs`)  
- `public/` – pliki statyczne (CSS)

## Wymagania
- Node.js >= 18
- npm

## Uruchomienie projektu
1. Sklonuj repozytorium:
git clone <link-do-twojego-repozytorium>
2. Przejdź do folderu projektu:
cd projekt02
3. Zainstaluj zależności:
npm install
4. Uruchom serwer:
node index.js
5. Otwórz przeglądarkę i przejdź na:
http://localhost:8000