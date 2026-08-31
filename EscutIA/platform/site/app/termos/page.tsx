import type { Metadata } from "next";

import LegalPage from "@/components/site/LegalPage";

export const metadata: Metadata = {
  title: "Termos de uso",
  description: "Conheça as regras para usar a EscutIA, seus planos, pagamentos e recursos de apoio emocional.",
  alternates: { canonical: "/termos" },
};

export default function TermsPage() {
  return (
    <LegalPage
      eyebrow="clareza para usar o espaço"
      title="Termos de uso"
      intro="Estas regras explicam como a EscutIA funciona, o que você pode esperar do serviço e quais são os limites de cada recurso."
      updatedAt="31 de agosto de 2026"
    >
      <section aria-labelledby="terms-about">
        <h2 id="terms-about" className="text-2xl font-black tracking-tight text-navy">1. Sobre a EscutIA</h2>
        <p className="mt-4">A EscutIA é um espaço digital para conversar, registrar como você está se sentindo e organizar pensamentos. Ela não é psicóloga, terapeuta, clínica ou serviço de emergência.</p>
        <p className="mt-4">As respostas da inteligência artificial têm finalidade informativa e de apoio à reflexão. Elas não são diagnóstico, tratamento, prescrição ou avaliação profissional de saúde.</p>
      </section>

      <section aria-labelledby="terms-account">
        <h2 id="terms-account" className="text-2xl font-black tracking-tight text-navy">2. Conta e acesso</h2>
        <p className="mt-4">O acesso usa uma conta Google. Você é responsável por manter sua sessão segura e por utilizar apenas dados e conteúdos que possa compartilhar legitimamente.</p>
        <p className="mt-4">Não compartilhe sua sessão nem registre dados de terceiros sem autorização. Se perceber acesso indevido, encerre a sessão e comunique o problema pelos canais disponíveis no site.</p>
      </section>

      <section aria-labelledby="terms-ai">
        <h2 id="terms-ai" className="text-2xl font-black tracking-tight text-navy">3. Conversas e inteligência artificial</h2>
        <p className="mt-4">Você decide o que escrever. O conteúdo pode ser utilizado para gerar respostas, organizar registros, classificar sentimentos e oferecer recursos relacionados, conforme explicado na Política de privacidade.</p>
        <p className="mt-4">Nenhuma resposta ou classificação deve ser entendida como conclusão sobre sua saúde, personalidade ou situação. Em uma emergência ou situação de risco, procure imediatamente os serviços de emergência e profissionais habilitados da sua região.</p>
      </section>

      <section aria-labelledby="terms-plans">
        <h2 id="terms-plans" className="text-2xl font-black tracking-tight text-navy">4. Planos, pagamentos e limites</h2>
        <p className="mt-4">A EscutIA oferece um plano gratuito e planos pagos mensais. Os limites de uso e os recursos de cada plano são os informados na página de planos e no Checkout antes da contratação. Nenhum plano promete uso ilimitado.</p>
        <p className="mt-4">Os pagamentos, cartões, faturas e dados de cobrança são processados pela Stripe. A EscutIA não armazena o número completo do seu cartão.</p>
      </section>

      <section aria-labelledby="terms-changes">
        <h2 id="terms-changes" className="text-2xl font-black tracking-tight text-navy">5. Troca e cancelamento</h2>
        <p className="mt-4">A troca de plano e o cancelamento são gerenciados pelo portal de cobrança da Stripe quando essa opção estiver disponível para a sua conta.</p>
        <p className="mt-4">Quando o cancelamento for programado para o fim do período, o acesso ao plano pago permanece até a data informada. Depois disso, não ocorre nova renovação. Uma fatura pendente pode continuar devida, e a existência de cancelamento não implica reembolso automático do período já iniciado.</p>
      </section>

      <section aria-labelledby="terms-addon">
        <h2 id="terms-addon" className="text-2xl font-black tracking-tight text-navy">6. Pacote de respostas adicionais</h2>
        <p className="mt-4">O Pacote EscutIA — 100 respostas adicionais é uma compra única, sem assinatura e sem renovação automática. Quando habilitado, ele adiciona 100 respostas ao ciclo vigente dos planos Essencial, Premium e Cuidado Humano.</p>
        <p className="mt-4">As respostas adicionais expiram no encerramento do ciclo mensal vigente, não são acumuladas para o ciclo seguinte e não alteram o plano principal. O pacote não está disponível para o Plano Grátis.</p>
      </section>

      <section aria-labelledby="terms-human-care">
        <h2 id="terms-human-care" className="text-2xl font-black tracking-tight text-navy">7. Cuidado Humano</h2>
        <p className="mt-4">O plano Cuidado Humano só deve ser contratado quando o atendimento estiver operacional. A sessão online é realizada por psicólogo humano habilitado, com CRP ativo, mediante agendamento e disponibilidade. Ela nunca é realizada pela inteligência artificial.</p>
        <p className="mt-4">Esse atendimento também não substitui serviços de emergência. Em situação urgente ou de risco, busque ajuda imediata pelos serviços locais apropriados.</p>
      </section>

      <section aria-labelledby="terms-responsible-use">
        <h2 id="terms-responsible-use" className="text-2xl font-black tracking-tight text-navy">8. Uso responsável</h2>
        <p className="mt-4">Você concorda em usar a EscutIA de forma legal, respeitosa e compatível com estes termos. Não é permitido abusar do serviço, tentar contornar limites, acessar dados de terceiros, inserir conteúdo ilegal ou interferir no funcionamento da plataforma.</p>
        <p className="mt-4">O acesso pode ser limitado ou suspenso quando necessário para proteger usuários, dados, pagamentos ou a operação do serviço.</p>
      </section>

      <section aria-labelledby="terms-availability">
        <h2 id="terms-availability" className="text-2xl font-black tracking-tight text-navy">9. Disponibilidade e mudanças</h2>
        <p className="mt-4">A plataforma pode passar por manutenção, atualizações e alterações de recursos. Algumas funcionalidades podem ser experimentais ou depender de integrações externas.</p>
        <p className="mt-4">Estes termos podem ser atualizados para refletir mudanças no serviço ou nas obrigações aplicáveis. A data no início desta página indica a versão vigente.</p>
      </section>

      <section aria-labelledby="terms-contact">
        <h2 id="terms-contact" className="text-2xl font-black tracking-tight text-navy">10. Dúvidas</h2>
        <p className="mt-4">Para dúvidas, utilize os canais de contato disponíveis na EscutIA. A identificação jurídica completa e o canal formal de contato devem ser preenchidos antes do uso em produção.</p>
      </section>
    </LegalPage>
  );
}
