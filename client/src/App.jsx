import { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [messages, setMessages] = useState([
    { sender: 'ai', text: "Hi! I'm your AI assistant. Ask me anything about education and technology 🚀" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function handleSend() {
    if (!input.trim()) return;
    setIsLoading(true);
    setMessages(msgs => [...msgs, { sender: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(msgs => [
        ...msgs,
        {
          sender: 'ai',
          text: `Here's an example reply for "${input}". Swap this with your backend call.`
        }
      ]);
      setIsLoading(false);
    }, 900);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading) handleSend();
    }
  }

  // Simple avatars for mockup — use real images if desired
  const avatarAI = (
    <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-indigo-200 font-bold text-indigo-700 shadow">
      🤖
    </span>
  );
  const avatarUser = (
    <span className="inline-flex items-center justify-center h-9 w-9 rounded-full bg-slate-300 font-bold text-slate-700 shadow">
      👤
    </span>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-white to-pink-100 flex items-center justify-center px-2 py-6">
      <div className="w-full max-w-lg h-[92vh] bg-white/90 shadow-2xl rounded-3xl flex flex-col border border-slate-100">
        <header className="bg-indigo-700 rounded-t-3xl text-white py-4 px-5 flex items-center gap-3 shadow">
          <span className="text-2xl">💬</span>
          <span className="font-bold text-xl tracking-wide">EducationAI Chat</span>
        </header>
        <main className="flex-1 overflow-y-auto px-3 py-5 space-y-4 bg-gradient-to-b from-white to-slate-50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} items-end`}>
              {msg.sender === 'ai' && avatarAI}
              <div className={`
                relative ml-2 mr-2 px-4 py-2 rounded-2xl shadow-md border
                ${msg.sender === 'ai' 
                  ? 'bg-indigo-50 text-indigo-900 border-indigo-100 rounded-bl-md'
                  : 'bg-indigo-600 text-white border-indigo-400 rounded-br-md'
                }
                max-w-[80%] 
              `}
                style={{wordBreak: "break-word"}}
              >
                {msg.text}
                {/* Bubble "tail" triangle */}
                <span className={`
                  absolute bottom-0
                  ${msg.sender === 'ai' 
                    ? 'left-[-8px] w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-indigo-50 border-b-8 border-b-transparent' 
                    : 'right-[-8px] w-0 h-0 border-t-8 border-t-transparent border-l-8 border-l-indigo-600 border-b-8 border-b-transparent'
                  }
                `} />
              </div>
              {msg.sender === 'user' && avatarUser}
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start items-center gap-2">
              {avatarAI}
              <div className="bg-indigo-100 text-indigo-900 px-4 py-2 rounded-2xl shadow max-w-[60%] animate-pulse border border-indigo-50">AI is typing…</div>
            </div>
          )}
          <div ref={chatEndRef}></div>
        </main>
        <form
          className="p-3 border-t flex gap-2 bg-slate-50 rounded-b-3xl"
          onSubmit={e => { e.preventDefault(); if (!isLoading) handleSend(); }}
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message…"
            className="flex-1 rounded-xl border-slate-300 bg-white px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400 min-h-[42px] max-h-[88px] font-medium"
            rows={1}
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-800 text-white rounded-xl font-semibold transition disabled:opacity-60 flex items-center"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
