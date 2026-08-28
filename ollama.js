const pergunta =
  process.argv.slice(2).join(" ") ||
  "Explique o que é inteligência artificial.";

async function perguntar() {
  const response = await fetch("http://localhost:11434/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-oss:20b-cloud",
      messages: [
        {
          role: "user",
          content: pergunta,
        },
      ],
      stream: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro ${response.status}: ${await response.text()}`);
  }

  if (!response.body) {
    throw new Error("A resposta não possui um corpo para streaming.");
  }

  console.log("\nResposta:\n");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });

    const linhas = buffer.split("\n");

    // A última linha pode estar incompleta e fica para a próxima leitura
    buffer = linhas.pop() ?? "";

    for (const linha of linhas) {
      if (!linha.trim()) {
        continue;
      }

      const parte = JSON.parse(linha);

      if (parte.message?.content) {
        process.stdout.write(parte.message.content);
      }
    }
  }

  // Processa uma eventual última linha sem quebra de linha
  if (buffer.trim()) {
    const parte = JSON.parse(buffer);

    if (parte.message?.content) {
      process.stdout.write(parte.message.content);
    }
  }

  console.log("\n");
}

perguntar().catch((erro) => {
  console.error("\nErro ao chamar o Ollama:", erro.message);
});
