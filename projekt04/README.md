Tablica Ogłoszeń
Aplikacja do zarządzania ogłoszeniami zbudowana w technologii Node.js z wykorzystaniem bazy danych SQLite.

Rejestracja i logowanie użytkowników z szyfrowaniem haseł (bcrypt).
Autoryzacja i obsługa sesji użytkownika.
Przeglądanie ogłoszeń wszystkich użytkowników na wspólnej tablicy.
Dodawanie, edytowanie oraz usuwanie własnych postów.
Uprawnienia administratora: możliwość edycji i usuwania dowolnego posta.
Wybór motywu kolorystycznego (jasny/ciemny).
Pasek informacyjny o wykorzystaniu plików cookies (Cookie Consent).


Instalacja bibliotek:
npm install express express-session cookie-parser sqlite3 bcryptjs

Uruchomienie serwera:
node app.js

Adres lokalny:
http://localhost:8000

Testowanie aplikacji
W celu szybkiego przetestowania funkcji, po uruchomieniu serwera można wejść pod adres:
http://localhost:8000/populate

Spowoduje to utworzenie przykładowych kont:
Administrator: login: admin, hasło: haslo123
Użytkownik: login: user1, hasło: haslo123

Struktura projektu
app.js: Główny plik aplikacji zawierający konfigurację i trasy.
database.js: Konfiguracja połączenia z bazą danych i inicjalizacja tabel.
public/style.css: Style CSS obsługujące wygląd kontenerów oraz tryby kolorystyczne.