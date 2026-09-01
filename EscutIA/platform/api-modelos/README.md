# API local de modelos do EscutIA

Serviço FastAPI isolado para executar o modelo `mdba/escutia-lora` localmente.
Ele recebe um texto e devolve `negativo`, `neutro` ou `positivo`. O site não é
alterado por esta implementação.

## Como executar

Abra um terminal nesta pasta:

```powershell
cd C:\Users\mdbaa\development\alura\alura-llama-factory\EscutIA\platform\api-modelos
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
Copy-Item .env.example .env.local
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

Na primeira inicialização, o serviço baixa o modelo do Hugging Face para
`api-modelos/modelo/` e o carrega. Nas próximas inicializações, se os pesos
completos estiverem nessa pasta, o download não é repetido. Durante o processo
em execução, o pipeline também permanece carregado em memória e é reutilizado
nas requisições.

Se o repositório do modelo for privado, preencha `HF_TOKEN` somente no arquivo
local `.env.local`. Esse arquivo está ignorado pelo Git e nunca deve ser
publicado.

## Contrato HTTP

Verificar a API:

```powershell
Invoke-RestMethod http://localhost:8000/health
```

Classificar um texto:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://localhost:8000/sentiment `
  -ContentType "application/json" `
  -Body '{"text":"Estou muito feliz hoje"}'
```

Resposta esperada:

```json
{
  "sentiment": "positivo",
  "model": "mdba/escutia-lora",
  "elapsed_ms": 1234
}
```

Também existe o alias `/api/sentiment`, para facilitar a integração futura
com a rota de aplicação.

## Observações

- A API usa os mesmos prompts, `max_new_tokens=24` e geração determinística do
  `testar_modelo_lora.py`.
- `adapter_model.safetensors` sozinho não é aceito como cache válido: a API
  exige pelo menos outro arquivo de pesos `.safetensors` ou um arquivo
  `pytorch_model*.bin` do modelo completo.
- Não coloque pesos, tokens ou arquivos `.env.local` no GitHub.
