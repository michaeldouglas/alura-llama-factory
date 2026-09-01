import type { Metadata } from "next";

import LegalPage from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Política de privacidade",
  description: "Entenda quais dados a EscutIA trata, por que eles são usados e como exercer seus direitos.",
  alternates: { canonical: "/privacidade" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="seus dados, com clareza"
      title="Política de privacidade"
      intro="Esta política explica quais dados a EscutIA trata, para que eles são usados, com quem podem ser compartilhados e quais escolhas estão disponíveis para você."
      updatedAt="31 de agosto de 2026"
    >
      <section aria-labelledby="privacy-scope">
        <h2 id="privacy-scope" className="text-2xl font-black tracking-tight text-navy">1. Escopo</h2>
        <p className="mt-4">Esta política se aplica ao site e à aplicação EscutIA, incluindo login, conversas salvas, registros de sentimentos, recursos pessoais, planos e gerenciamento de pagamentos.</p>
        <p className="mt-4">Conversas e registros podem revelar aspectos íntimos da sua vida. Evite inserir dados de terceiros ou informações que não sejam necessárias para usar o serviço.</p>
      </section>

      <section aria-labelledby="privacy-data">
        <h2 id="privacy-data" className="text-2xl font-black tracking-tight text-navy">2. Dados tratados</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li><strong className="text-navy">Conta e acesso:</strong> nome, e-mail, imagem de perfil e identificadores necessários para login Google e sessão.</li>
          <li><strong className="text-navy">Conteúdo salvo:</strong> conversas, mensagens, modo de conversa, check-ins, check-outs, registros de sentimentos, relatórios, anotações e recursos pessoais.</li>
          <li><strong className="text-navy">Dados gerados:</strong> classificações de sentimento, datas, contadores de uso e informações necessárias para apresentar histórico e limites.</li>
          <li><strong className="text-navy">Cobrança:</strong> identificadores de cliente, assinatura, preço, status, faturas e eventos relacionados à Stripe. O número completo do cartão é tratado pela Stripe.</li>
        </ul>
      </section>

      <section aria-labelledby="privacy-use">
        <h2 id="privacy-use" className="text-2xl font-black tracking-tight text-navy">3. Como usamos os dados</h2>
        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>autenticar você e proteger áreas restritas;</li>
          <li>salvar, exibir e organizar conversas, registros e recursos escolhidos por você;</li>
          <li>gerar respostas e classificar o sentimento predominante de um registro;</li>
          <li>gerenciar limites mensais, planos e pacotes de respostas adicionais;</li>
          <li>processar pagamentos, faturas, cancelamentos e reembolsos;</li>
          <li>prevenir duplicidades, fraude, abuso e falhas de processamento;</li>
          <li>manter, corrigir e melhorar tecnicamente o serviço.</li>
        </ul>
      </section>

      <section aria-labelledby="privacy-providers">
        <h2 id="privacy-providers" className="text-2xl font-black tracking-tight text-navy">4. Serviços de terceiros</h2>
        <p className="mt-4">O login é feito com o Google. Pagamentos, faturas e o portal de cobrança são operados pela Stripe.</p>
        <p className="mt-4">As mensagens podem ser processadas pelo provedor de modelo configurado para a aplicação. No ambiente atual, o serviço local é o padrão. Se a classificação por Hugging Face estiver configurada, o texto necessário para essa classificação poderá ser enviado a esse provedor.</p>
        <p className="mt-4">A EscutIA não vende seus dados e não utiliza esses dados para apresentar diagnóstico.</p>
      </section>

      <section aria-labelledby="privacy-security">
        <h2 id="privacy-security" className="text-2xl font-black tracking-tight text-navy">5. Dados sensíveis e segurança</h2>
        <p className="mt-4">Registros sobre sentimentos podem envolver dados pessoais sensíveis. Eles são tratados para os recursos que você escolheu usar, para manter seu histórico e para operar a aplicação.</p>
        <p className="mt-4">Adotamos medidas técnicas e organizacionais compatíveis com o serviço para proteger os dados. Nenhum serviço conectado à internet oferece risco zero, por isso também é importante proteger sua conta e escolher cuidadosamente o que compartilhar.</p>
      </section>

      <section aria-labelledby="privacy-storage">
        <h2 id="privacy-storage" className="text-2xl font-black tracking-tight text-navy">6. Armazenamento e exclusão</h2>
        <p className="mt-4">Os dados são mantidos pelo tempo necessário para oferecer o serviço e cumprir obrigações legais, financeiras, de segurança ou de resolução de disputas.</p>
        <p className="mt-4">O perfil permite exportar e excluir registros de sentimentos e conversas. Essas ações não excluem automaticamente sua identidade Google nem informações de transações que precisem ser preservadas por obrigação legal.</p>
      </section>

      <section aria-labelledby="privacy-rights">
        <h2 id="privacy-rights" className="text-2xl font-black tracking-tight text-navy">7. Seus direitos</h2>
        <p className="mt-4">A legislação brasileira de proteção de dados prevê direitos como confirmação e acesso, correção, eliminação quando aplicável, portabilidade, informações sobre compartilhamento e revisão de decisões automatizadas, observadas as hipóteses e limitações legais.</p>
        <p className="mt-4">A EscutIA já oferece exportação e exclusão de parte dos dados pelo perfil. Para outras solicitações, utilize o canal de contato disponível no site; podemos pedir confirmação de identidade para proteger sua conta.</p>
        <p className="mt-4">Você também pode consultar as orientações da <a className="font-bold text-purple underline decoration-purple/30 underline-offset-4 hover:text-navy" href="https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1/direito-dos-titulares" target="_blank" rel="noreferrer">ANPD sobre os direitos dos titulares</a>.</p>
      </section>

      <section aria-labelledby="privacy-cookies">
        <h2 id="privacy-cookies" className="text-2xl font-black tracking-tight text-navy">8. Cookies e sessão</h2>
        <p className="mt-4">A aplicação utiliza cookies e dados de sessão necessários para login, autenticação e funcionamento das áreas protegidas. Esta política não afirma o uso de cookies de publicidade ou analytics que não estejam configurados no serviço.</p>
      </section>

      <section aria-labelledby="privacy-contact">
        <h2 id="privacy-contact" className="text-2xl font-black tracking-tight text-navy">9. Atualizações e contato</h2>
        <p className="mt-4">Esta política pode ser atualizada quando o serviço, os provedores ou as obrigações aplicáveis mudarem. A data no início da página identifica a versão vigente.</p>
        <p className="mt-4">A identificação jurídica completa e o canal formal de privacidade devem ser preenchidos antes do uso em produção.</p>
      </section>
    </LegalPage>
  );
}
