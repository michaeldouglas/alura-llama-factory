# Revisão de conformidade de dados — G3

**Experiência:** `001-resource-efficient-finetune`  
**Responsável:** `dataset-specialist`  
**Skill aplicada:** `dataset-preparation`  
**Decisão:** `APPROVED` para recuperação sem transformação; `G4` permanece não iniciado.  
**Escopo desta revisão:** metadados, origem, termos, riscos, autorização e recuperação sem
transformação. Nenhum registro foi aberto, contado, validado ou transformado.

## Situação

O proprietário autorizou explicitamente o G3 após revisar este relatório. A autorização aceita a
licença CC BY 3.0, os termos atuais aplicáveis do X/Twitter e os riscos documentados, mas cobre
somente a recuperação byte-preserving da configuração e revisão exatas. O gate versionado é
`manifests/gates/g3.json`; ele não declara o dataset pronto para treinamento e não abre o G4.

## Origem e revisão proposta

- **Fonte:** repositório público `cardiffnlp/tweet_sentiment_multilingual` no Hugging Face,
  mantido por Cardiff NLP.
- **Configuração:** `portuguese`.
- **Revisão imutável proposta:** commit
  `606156db529f327fd871515cccbe14dcbafef682`, identificado no plano como o commit que introduz
  os arquivos portugueses.
- **Intenção:** usar os textos curtos para classificação de sentimento em três classes, com o
  mapeamento declarado `0=negative`, `1=neutral`, `2=positive`, posteriormente convertido para
  `negativo`, `neutro`, `positivo` em artefato derivado separado.
- **Metadados declarados, ainda não observados localmente:** `train`, `validation` e `test`, com
  contagens de referência de 1.839, 324 e 870 registros, respectivamente. Esses números não são
  evidência de validação: o plano exige recalcular contagens, hashes, duplicatas, idioma,
  comprimento, PII, conteúdo sensível e contaminação a partir dos bytes da revisão fixada.
- **Fontes de origem e revisão:** [cartão do dataset](https://huggingface.co/datasets/cardiffnlp/tweet_sentiment_multilingual)
  e [commit proposto](https://huggingface.co/datasets/cardiffnlp/tweet_sentiment_multilingual/commit/606156db529f327fd871515cccbe14dcbafef682).

## Licença CC BY 3.0

O cartão declara **Creative Commons Attribution 3.0 Unported (CC BY 3.0)**. A utilização planejada
deve preservar atribuição adequada, link para a licença e indicação de alterações; a atribuição não
pode sugerir endosso do autor ou do Cardiff NLP. A licença permite compartilhamento e adaptação
condicionados a esses termos, mas não resolve, por si só, direitos de privacidade, publicidade,
imagem, direitos morais ou outros direitos de terceiros que possam incidir sobre textos publicados.

Referências: [deed CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) e [código legal CC BY 3.0](https://creativecommons.org/licenses/by/3.0/legalcode.en).

## Termos aplicáveis da plataforma X/Twitter

O cartão também exige conformidade com os **X/Twitter Terms of Service** e os **X/Twitter API
Terms of Service**. A nomenclatura antiga “Twitter” permanece na documentação do dataset, mas a
revisão operacional deve usar os termos atuais do X e suas políticas de desenvolvedor na data da
autorização. O [X Terms of Service vigente](https://x.com/en/tos) indica vigência em 15 de janeiro
de 2026; para uso de recursos de desenvolvedor, remete adicionalmente ao [Developer Agreement](https://developer.x.com/developer-terms/agreement)
e à [Developer Policy](https://docs.x.com/developer-terms/policy).

Condições operacionais relevantes para o pedido G3:

- o uso deve respeitar os termos, as leis aplicáveis, as regras de conteúdo e as interfaces e
  instruções autorizadas; os termos proíbem scraping sem consentimento escrito prévio;
- a política de desenvolvedor restringe a redistribuição de X Content a terceiros e exige que
  terceiros que recebam conteúdo cumpram os termos, a política de privacidade, o Developer
  Agreement e a Developer Policy;
- a política exige respeito às expectativas razoáveis de privacidade e aos estados protegido,
  bloqueado e privado; conteúdo removido ou que deixe de estar disponível não deve ser tratado como
  livre para redistribuição;
- o dataset e qualquer derivado devem permanecer em local não versionado e não público. Não se
  autoriza publicar textos, IDs, dados pessoais, exemplos de treino, checkpoints ou pesos
  derivados como parte deste G3;
- a aceitação de CC BY 3.0 não equivale a uma autorização da plataforma X nem elimina obrigações
  de remoção, restrições de redistribuição ou direitos dos autores dos posts.

Referências: [cartão e termos citados pelo dataset](https://huggingface.co/datasets/cardiffnlp/tweet_sentiment_multilingual),
[X Developer Policy — redistribuição](https://docs.x.com/developer-terms/policy#content-redistribution) e
[X Terms of Service — uso de conteúdo](https://x.com/en/tos).

## Riscos de privacidade e conteúdo sensível

Nenhum registro foi inspecionado; portanto, não há contagens ou conclusão de ausência de PII,
conteúdo sensível ou duplicatas. A origem é composta por posts humanos públicos, e a normalização
de identificadores `@user` e URLs prevista no material de pesquisa não garante anonimização.
Devem ser tratados como possíveis, até validação:

- nomes, identificadores, links, localização, contatos, imagens ou outras pistas de reidentificação;
- opiniões políticas, religião, saúde, sexualidade, experiências pessoais e dados de terceiros;
- assédio, discurso de ódio, ameaças, violência, sexualidade explícita, automutilação, suicídio,
  abuso, discriminação ou outros conteúdos que possam ser ofensivos ou prejudiciais;
- texto protegido, removido, corrigido ou sujeito a solicitação de exclusão;
- duplicatas exatas, normalizadas ou quase duplicatas entre treino, validação e teste, que podem
  causar vazamento e superestimar a avaliação;
- texto não principalmente em português, sem sujeito principal, vazio, ilegível, com mais de 280
  caracteres Unicode ou com rótulo ausente/inválido.

Após autorização, a validação deverá quantificar esses achados sem alterar a fonte original. Casos
de privacidade, conteúdo sensível, licença ou termos sem resolução devem manter o dataset como
`BLOCKED`; nenhum dado ausente poderá ser inventado e nenhuma remoção poderá ocorrer sem critério
documentado e artefato derivado separado.

## Caminho externo aprovado e utilizado

Os bytes originais não entram no repositório. O caminho aprovado e utilizado é:

```text
%LOCALAPPDATA%\alura-llama-factory\001-resource-efficient-finetune\cache\dataset-source\cardiffnlp--tweet_sentiment_multilingual\606156db529f327fd871515cccbe14dcbafef682\
```

Esse diretório contém somente a fonte recuperada da revisão exata, preservada e tornada somente
leitura após a recuperação, com hashes e tamanhos registrados em manifesto versionado.
Qualquer derivado futuro deverá ficar fora do repositório, em diretório separado sob
`%LOCALAPPDATA%\alura-llama-factory\001-resource-efficient-finetune\data-derived\`, com versão de
transformação e linhagem por registro. Nenhum derivado foi criado nesta etapa.

## Decisão e escopo autorizado do G3

A decisão explícita, datada de 2026-08-22 e vinculada à revisão abaixo, cobre:

1. aceitar, para esta experiência, a licença **CC BY 3.0** e suas obrigações de atribuição;
2. aceitar os termos aplicáveis do X/Twitter, incluindo Terms of Service, Privacy Policy,
   Developer Agreement e Developer Policy na revisão vigente no momento da decisão;
3. aceitar os riscos de privacidade, conteúdo sensível, remoção, redistribuição e direitos de
   terceiros descritos neste relatório;
4. autorizar **somente a recuperação sem transformação** da configuração `portuguese` do
   repositório `cardiffnlp/tweet_sentiment_multilingual`, commit
   `606156db529f327fd871515cccbe14dcbafef682`, para o caminho externo planejado acima;
5. permitir o registro de revisão, arquivos, tamanhos e SHA-256 após a recuperação, sem adicionar
   os bytes ou textos ao controle de versão.

O pedido **não** inclui leitura analítica antecipada, limpeza, normalização, filtragem, remoção,
amostragem, conversão para JSONL/Alpaca, criação de derivado, validação G4, treinamento, inferência,
baseline, dry run, publicação, redistribuição ou autorização de qualquer outro dataset, modelo,
ambiente ou gate. Essas ações exigem as etapas e autorizações próprias previstas no Spec Kit.

## Decisão para o Orchestrator

**APPROVED.** O proprietário autorizou a recuperação após revisar a licença, os termos atuais do
X/Twitter, os riscos, a revisão imutável e o caminho externo exato. O dataset não está pronto para
treinamento e não há decisão G4. Não estão autorizados por este gate: leitura analítica dos
registros, validação de conteúdo, limpeza, normalização, filtragem, remoção, amostragem,
conversão, criação de derivado, inferência, baseline, dry run, treinamento, publicação ou
redistribuição.

## Resultado da recuperação autorizada

Os três arquivos JSONL da configuração `portuguese` foram recuperados da revisão exata para o
caminho externo aprovado, tornados somente leitura e registrados sem qualquer transformação em
`manifests/dataset-source.json`. O total é 340.595 bytes; o manifesto contém somente identidade,
OIDs LFS, tamanhos, SHA-256, URLs e evidência de imutabilidade; nenhum texto de origem foi
adicionado ao repositório.

| Arquivo | Bytes | SHA-256 (= OID LFS) |
|---|---:|---|
| `data/portuguese/test.jsonl` | 97.981 | `274fa27f495b42485698b49775bfa07226dc6acc8795bc350ad367234905fee8` |
| `data/portuguese/train.jsonl` | 207.443 | `95262fd2bf0e30657cf990ed9141aca8d9c0b0b18cdd35ef84b0488e2de9de09` |
| `data/portuguese/validation.jsonl` | 35.171 | `906d1bd07d39e7bed4d5d22697986652c8a1b778a9107f1e62a31f81d7ade9ac` |
As exclusões aprovadas (metadados do repositório, todas as outras línguas e qualquer caminho não
listado nos três arquivos portugueses) permanecem fora da recuperação.
