const messages = [
  { from: "ai", text: "Oi. Eu estou aqui para ouvir você. Como você está se sentindo hoje?" },
  { from: "user", text: "Tenho me sentido muito cansado e ansioso ultimamente." },
  { from: "ai", text: "Obrigado por compartilhar isso comigo. Quer me contar um pouco mais sobre o que tem deixado você assim?" },
];

export default function ChatPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[490px]">
      <div aria-hidden="true" className="float-slow absolute -left-10 top-20 h-20 w-20 rounded-[30px] bg-peach/80 blur-[1px]" />
      <div aria-hidden="true" className="float-delay absolute -right-8 bottom-10 h-24 w-24 rounded-full bg-lilac/50 blur-[2px]" />
      <div className="relative overflow-hidden rounded-[30px] border border-white/80 bg-white/90 p-4 shadow-2xl shadow-purple/15 backdrop-blur">
        <div className="flex items-center justify-between border-b border-navy/8 px-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-brand text-lg font-black text-white shadow-md shadow-pink/20">E</div>
            <div>
              <p className="font-bold text-navy">EscutIA</p>
              <p className="flex items-center gap-1.5 text-xs font-medium text-navy/50"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> disponível agora</p>
            </div>
          </div>
          <span className="rounded-full bg-warm px-3 py-1.5 text-xs font-bold text-navy/50">conversa privada</span>
        </div>

        <div className="space-y-3 px-1 py-5">
          {messages.map((message, index) => (
            <div key={message.text} className={`flex ${message.from === "user" ? "justify-end" : "justify-start"} chat-message-${index + 1}`}>
              <div className={`max-w-[88%] rounded-[20px] px-4 py-3 text-sm leading-relaxed ${message.from === "user" ? "rounded-br-md bg-navy text-white" : "rounded-bl-md bg-[#f2efff] text-navy/80"}`}>
                {message.text}
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-warm p-2">
          <span className="flex-1 px-3 text-sm text-navy/35">Escreva o que você está sentindo...</span>
          <span aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-xl bg-purple text-lg text-white">↑</span>
        </div>
        <p className="mt-3 text-center text-[11px] font-medium text-navy/35">Seu espaço de conversa, no seu ritmo.</p>
      </div>
    </div>
  );
}
