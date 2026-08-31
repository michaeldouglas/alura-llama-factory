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
        <h2 id="terms-changes" className="text-2xl font-black tracking-tight text-navy">5. Cancelamento e reembolso</h2>
        <h3 className="mt-7 text-xl font-black tracking-tight text-navy">5.1. Direito de arrependimento</h3>
        <p className="mt-4">Nas contratações realizadas pela internet, você pode exercer o direito de arrependimento no prazo de 7 (sete) dias corridos, contado da confirmação da contratação ou do marco legal aplicável à disponibilização do serviço, conforme o caso. Não é necessário apresentar justificativa.</p>
        <p className="mt-4">Se o pedido for feito dentro desse prazo, a EscutIA devolverá integralmente, em regra 100% dos valores pagos, sem cobrança de multa. O exercício desse direito não é afastado pelo simples login ou uso da plataforma durante o prazo de reflexão. Após o recebimento do pedido, o acesso ao plano contratado será interrompido imediatamente, e o reembolso será encaminhado sem demora ao meio de pagamento utilizado, sujeito aos prazos operacionais da instituição financeira e da Stripe.</p>
        <h3 className="mt-7 text-xl font-black tracking-tight text-navy">5.2. Planos mensais recorrentes</h3>
        <p className="mt-4">Os planos mensais não têm fidelidade. Depois do prazo de arrependimento, você pode solicitar o cancelamento a qualquer momento. O cancelamento impede a próxima renovação e não gera, por si só, reembolso do ciclo de faturamento já pago, porque a licença de uso ficou disponível durante esse período.</p>
        <p className="mt-4">Quando o cancelamento for programado para o fim do ciclo vigente, o acesso ao plano pago permanece até a data exata indicada no painel, na fatura ou no portal de cobrança. Depois dessa data, a assinatura não será renovada e o acesso será ajustado ao Plano Grátis, quando aplicável. Uma fatura vencida, pendente ou já iniciada pode continuar sujeita às regras de cobrança do meio de pagamento.</p>
        <h3 className="mt-7 text-xl font-black tracking-tight text-navy">5.3. Planos com prazo determinado</h3>
        <p className="mt-4">Atualmente, a EscutIA oferece somente planos mensais. Se um plano anual ou outro plano com prazo determinado e fidelidade vier a ser disponibilizado, suas condições específicas — incluindo preço total, prazo, forma de pagamento, acesso e cancelamento — serão apresentadas de forma clara antes da contratação.</p>
        <p className="mt-4">Para uma oferta de prazo determinado que preveja cancelamento antecipado, o saldo dos meses não utilizados poderá ser devolvido proporcionalmente, com retenção de 10% desse saldo como multa rescisória, desde que essa condição esteja expressamente informada na oferta e seja aplicada de forma proporcional, equilibrada e compatível com a legislação de proteção do consumidor. Nessa hipótese, o acesso ao plano será encerrado após a confirmação do cancelamento. Essa regra não limita o direito de arrependimento nem outros direitos de reembolso previstos em lei.</p>
        <h3 className="mt-7 text-xl font-black tracking-tight text-navy">5.4. Como solicitar</h3>
        <ol className="mt-4 list-decimal space-y-2 pl-6">
          <li>Entre na sua conta e acesse a área <strong className="text-navy">Plano e uso</strong>.</li>
          <li>Para um cancelamento após o prazo de arrependimento, selecione <strong className="text-navy">Gerenciar assinatura</strong> ou a opção equivalente e conclua o pedido no portal seguro da Stripe.</li>
          <li>Para exercer o direito de arrependimento ou solicitar análise de reembolso, use o mesmo canal eletrônico da contratação quando disponível ou o canal de atendimento indicado no site. Informe o e-mail da conta, o plano, a data da contratação e, se possível, o identificador da fatura.</li>
          <li>A EscutIA confirmará o recebimento da solicitação pelo meio eletrônico utilizado e informará o resultado e, quando cabível, o encaminhamento do reembolso.</li>
        </ol>
        <p className="mt-4">O portal da Stripe pode apresentar opções diferentes conforme o tipo e o estado da assinatura. A utilização do portal não impede o exercício dos direitos previstos nesta seção por outro canal eletrônico disponibilizado pela EscutIA.</p>
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
