import { useState, useRef, useEffect } from 'react';
import './app.scss';

function App() {
  const [input, setInput] = useState('');
  const [chat, setChat] = useState([]);
  const messagesEndRef = useRef(null);

const sendMessage = async () => {
  if (!input.trim()) return;

  const userMessage = { sender: 'You', text: input };
  setChat(prev => [...prev, userMessage]);
  setInput(''); // clear the input immediately

  try {
    const res = await fetch('http://localhost:4444/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();
    setChat(prev => [...prev, { sender: 'AI', text: data.response }]);
  } catch (error) {
    setChat(prev => [...prev, { sender: 'AI', text: '⚠️ Failed to fetch response.' }]);
  }
};


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat]);

  return (
    <main>
      <section className="chat-container">
        <div className="chat-window">
          {chat.map((msg, i) => (
            <div key={i} className={`message ${msg.sender === 'You' ? 'user' : 'ai'}`}>
              <div className="bubble">
                <strong>{msg.sender}:</strong> {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-area">
          <input
            type="text"
            placeholder="Type a message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </section>
    </main>
  );
}

export default App;
