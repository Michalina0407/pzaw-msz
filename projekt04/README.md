# Tablica Ogłoszeń

Prosta aplikacja webowa do zarządzania ogłoszeniami napisana w Node.js z użyciem Express oraz SQLite. Projekt umożliwia rejestrację użytkowników, logowanie oraz tworzenie, edycję i usuwanie ogłoszeń.

## Funkcjonalności
- Rejestracja i logowanie użytkowników
- Zabezpieczenie haseł
- System sesji użytkowników
- Dodawanie ogłoszeń
- Przeglądanie ogłoszeń wszystkich użytkowników
- Edycja i usuwanie własnych ogłoszeń
- Uprawnienia administratora
- Tryb jasny / ciemny (cookies)
- Dane testowe (seed bazy)

## Bezpieczeństwo
- Hasła przechowywane jako hash (argon2)
- Ochrona przed HTML Injection / XSS (escapeHtml)
- Kontrola dostępu do edycji i usuwania postów
- Sesje użytkowników z ograniczonym czasem życia

# Instalacja i uruchomienie

## Wymagania
- Node.js
- npm

## Instalacja 
W terminalu należy wpisać:
``npm install``

## Utworzenie danych testowych
Również w terminalu: 
``npm run seed``

Stworzy to konta: 
- admin 
- user1 
z hasłami 
- haslo123

## Uruchomienie
W terminalu należy wpisać
``node app.js``

Wyświetli się link 
http://localhost:8000
na który trzymając (lewy) ctrl naciskasz. Przenosi cie to na przeglądarke


## Struktura projektu
projekt04 /
|--- app.js
|--- routes/
|   |--- auth.js
|   |--- posts.js
|--- database.js
|--- seed.js
|--- baza.db
|--- public/
|   |--- style.css
|--- package.json
|--- README.md

