import { useState, useEffect } from 'react';
// 1. IMPORTUJEMY GNIAZDO
import { io } from 'socket.io-client'; 

import Header from './assets/components/Header';
import MessageForm from './assets/components/MessageForm';
import Login from './assets/components/Login';
import Message from './assets/components/Message';

// 2. PODŁĄCZAMY SIĘ DO SERWERA GŁÓWNEGO NAUCZYCIELA
// (Jeśli zrobiłeś własny serwer, wpisz tu 'http://localhost:3000')
const SOCKET_URL = 'https://apichat.m89.pl'; 
const API_URL = 'https://apichat.m89.pl/api/messages';

// Tworzymy połączenie przed komponentem (aby nie łączyło się od nowa przy każdej zmianie na ekranie)
const socket = io(SOCKET_URL);

function App() {
  const [wiadomosci, setWiadomosci] = useState([]);
   // NOWOŚĆ 1: Stan przechowujący nick osoby, która aktualnie pisze
  const [ktoPisze, setKtoPisze] = useState(null);

  useEffect(() => {
    socket.on('chat_update', (noweWiadomosci) => {
      setWiadomosci(noweWiadomosci);
        // NOWOŚĆ 2: Nasłuchujemy, czy ktoś inny pisze
    let typingTimer;
    socket.on('is_typing', (nick) => {
      setKtoPisze(nick); // Zapisujemy nick
       // Magia UX: Czekamy 2 sekundy. Jeśli w tym czasie nie przyleci 
      // nowy sygnał 'is_typing', uznajemy, że osoba przestała pisać.
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => {
        setKtoPisze(null);
      }, 2000);
    });

    return () => {
      socket.off('chat_update');
      socket.off('is_typing'); // <-- Sprzątamy po sobie!
    };
  }, []);

  // NOWOŚĆ 3: Funkcja, która odpala się, gdy MY piszemy
  const handleTyping = () => {
    socket.emit('typing', mojNick);
  // --- ODBIERANIE WIADOMOŚCI (WEBSOCKET) ---
  useEffect(() => {
    // 3. Nasłuchujemy na sygnał z serwera. Kiedy wpadnie, aktualizujemy Stan!
    socket.on('chat_update', (noweWiadomosci) => {
      setWiadomosci(noweWiadomosci);
    });

    // 4. Funkcja sprzątająca wyłącza nasłuch przy zamknięciu komponentu
    return () => {
      socket.off('chat_update');
    };
  }, []); // <- Pusta tablica: podłączamy się tylko raz

  // --- WYSYŁANIE (HTTP POST) ---
  const handleDodajWiadomosc = async (nowyTekst) => {
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: mojNick, text: nowyTekst })
      });
      // Nie musimy już ręcznie odświeżać! Serwer sam wypchnie nową tablicę!
    } catch (error) { console.error(error); }
  };

  // --- LAJKOWANIE (HTTP PATCH) ---
  const handleLajkuj = async (id) => {
    try {
      await fetch(`${API_URL}/${id}/like`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: mojNick })
      });
    } catch (error) { console.error(error); }
  };

  // --- USUWANIE (HTTP DELETE) ---
  const handleUsun = async (id) => {
    if (!window.confirm("Czy na pewno chcesz usunąć tę wiadomość?")) return;
    try {
      await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    } catch (error) { console.error(error); }
  };
  

  if (!mojNick) {
    return (
      <div className="app-container">
        <Header />
        <Login onZaloguj={setMojNick} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header />
      <div className="chat-window">
        {wiadomosci.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>Ładowanie wiadomości...</p>
        ) : (
          wiadomosci.map((msg) => (
            <Message 
              key={msg.id} 
              msg={msg} 
              mojNick={mojNick} 
              onLike={handleLajkuj} 
              onDelete={handleUsun} 
            />
          ))
        )}
      </div>
      <MessageForm onWyslij={handleDodajWiadomosc} />
    </div>
  );
}

  {/* ... (koniec okna z wiadomościami) ... */}
      <div>

      {/* NOWOŚĆ 4: Pokaż napis TYLKO wtedy, gdy zmienna ktoPisze nie jest pusta */}
      {ktoPisze && (
        <div style={{ padding: '0 20px', fontSize: '0.85em', color: '#7f8c8d', fontStyle: 'italic', marginBottom: '5px' }}>
          ✏️ {ktoPisze} pisze wiadomość...
        </div>
      )}

      {/* NOWOŚĆ 5: Przekazujemy funkcję handleTyping do formularza */}
      <MessageForm onWyslij={handleDodajWiadomosc} onTyping={handleTyping} />
    </div>
  );
}

export default App;
