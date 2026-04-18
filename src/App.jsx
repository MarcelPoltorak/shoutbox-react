import Header from './assets/components/Header';
import MessageForm from './assets/components/MessageForm';

function App() {
  return (
    <div className="app-container">
      
      {/* Nasz górny pasek */}
      <Header />

      {/* Środkowe okno na wiadomości (na razie puste) */}
      <div className="chat-window">
        <p style={{ textAlign: 'center', color: '#999' }}>
          Brak wiadomości. Bądź pierwszy!
        </p>
      </div>

      {/* Dolny formularz wysyłania */}
      <MessageForm />

    </div>
  );
}

export default App;