# EscutIA — site institucional

Frontend institucional da EscutIA, construído com Next.js, TypeScript e Tailwind CSS.

O site é uma experiência estática e responsiva para apresentar a proposta da plataforma de apoio emocional. Não há backend, autenticação ou integração com o agente nesta etapa.

## Executar localmente

Pré-requisito: Node.js 18.17 ou superior.

```bash
npm install
npm run dev
```

Depois, abra [http://localhost:3000](http://localhost:3000).

## Validar e gerar produção

```bash
npm run lint
npm run build
npm run start
```

## Organização

- `app/page.tsx`: composição da página inicial.
- `app/globals.css`: tokens visuais, responsividade e animações leves.
- `components/`: Header, Hero, ChatPreview, HowItWorks, Features, Safety, About, CTA e Footer.
- `public/logo.png`: logo oficial da EscutIA reutilizado no site.

## Posicionamento

A EscutIA é apresentada como uma plataforma de apoio emocional e bem-estar. O site deixa explícito que ela não substitui psicólogos, psiquiatras ou outros profissionais de saúde, não realiza diagnósticos e não oferece tratamento psicológico.
