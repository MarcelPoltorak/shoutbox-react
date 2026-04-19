import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

import Header from './assets/components/Header';
import MessageForm from './assets/components/MessageForm';
import Login from './assets/components/Login';
import Message from './assets/components/Message';

const SOCKET_URL = 'https://apichat.m89.pl';
const API_URL = 'https://apichat.m89.pl/api/messages';

const socket = io(SOCKET_URL);

function App() {
  const [wiadomosci, setWiadomosci] = useState([]);
  const [ktoPisze, setKtoPisze] = useState(null);
  const [mojNick, setMojNick] = useState(null);

  const typingTimer = useRef(null);

  // 🔹 Przywracanie nicku po odświeżeniu
  useEffect(() => {
    const zapisanyNick = localStorage.getItem('shoutboxNick');
    if (zapisanyNick) {
      setMojNick(zapisanyNick);
    }
  }, []);

  // 🔹 Socket listeners
  useEffect(() => {
    socket.on('chat_update', (noweWiadomosci) => {
      setWiadomosci(noweWiadomosci);
    });

    socket.on('is_typing', (nick) => {
      setKtoPisze(nick);

      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => {
        setKtoPisze(null);
      }, 2000);
    });

    return () => {
      socket.off('chat_update');
      socket.off('is_typing');
    };
  }, []);

  // 🔹 Typing event
  const handleTyping = () => {
    if (mojNick) {
      socket.emit('typing', mojNick);
    }
  };

  // 🔹 Dodawanie wiadomości
  const handleDodajWiadomosc = async (nowyTekst) => {
    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: mojNick,
          text: nowyTekst
        })
      });
    } catch (error) {
      console.error(error);
    }
  };

  // 🔹 Lajk
  const handleLajkuj = async (id) => {
    try {
      await fetch(`${API_URL}/${id}/like`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: mojNick })
      });
    } catch (error) {
      console.error(error);
    }
  };

  // 🔹 Usuwanie
  const handleUsun = async (id) => {
    if (!window.confirm("Czy na pewno chcesz usunąć tę wiadomość?")) return;

    try {
      await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error(error);
    }
  };

  // 🔹 Jeśli użytkownik nie jest zalogowany – pokazujemy ekran logowania
  if (!mojNick) {
    return (
      <div className="app-container">
        <Header />
        <Login onZaloguj={setMojNick} />
      </div>
    );
  }

  // 🔹 Główna aplikacja czatu (gdy nick jest ustawiony)
  return (
    <div className="app-container">
      <Header />

      <div className="chat-window">
        {wiadomosci.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999' }}>
            Ładowanie wiadomości...
          </p>
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

      {/* ✏️ Kto pisze */}
      {ktoPisze && (
        <div
          style={{
            padding: '0 20px',
            fontSize: '0.85em',
            color: '#7f8c8d',
            fontStyle: 'italic'
          }}
        >
          ✏️ {ktoPisze} pisze wiadomość...
        </div>
      )}

      <MessageForm
        onWyslij={handleDodajWiadomosc}
        onTyping={handleTyping}
      />
    </div>
  );
}

export default App;