# **Documento de Entrega do Projeto**

## Apresentação
Infelizmente, ainda não foi possível dominar o Docker, e por isso eu não consegui fazer com que o arquivo Dockerfile crie o ambiente estável. Estou trabalhando para resolver essa questão e agradeço a sua compreensão.
Também tenho ciência que algumas skills, como implementação de testes, não foram aplicadas pois hoje onde trabalho tais tecnologias não são usadas e para tanto eu precisaria de mais tempo de aprendizagem, contudo me coloco a disposição para estudos, basta me dar a direção e um apoio quando surgirem dúvidas. 

## Requisitos necessários
Você vai precisar ter algumas ferramentas/aplicativos instalados para uma avaliação funcional do projeto. No tópico Subindo o Ambiente de Avaliação, será descrito o passo a passo para e comandos necessários.
- Nodejs: Recomendo a versão LTS mais atual;

## Tecnologias Empregadas no Projeto
O projeto emprega uma variedade de tecnologias, cada uma com um propósito específico:
- Docker: Utilizado para a virtualização em containers, proporcionando um ambiente isolado e controlado para a execução do projeto.
- Javascript: A linguagem de programação adotada no desenvolvimento do projeto.
- Node.js: Ambiente de execução do Javascript, comumente empregado em aplicações back-end.
- Leaflet: Biblioteca Javascript dedicada à construção de ambientes de mapeamento interativos.
- ReactJS: Biblioteca Javascript utilizada para o desenvolvimento front-end, permitindo a criação de interfaces de usuário eficientes e reativas.
- Axios: Biblioteca Javascript empregada para facilitar a comunicação com APIs através de requisições HTTP.
- Express: Framework Javascript usado para gerenciar a API no lado do back-end, facilitando a criação de rotas e a manipulação de requisições e respostas.
- CORS: Mecanismo utilizado em conjunto com o Express para gerenciar os cabeçalhos HTTP, permitindo o controle de requisições de diferentes origens.
- Jsonwebtoken: Embora não tenha sido utilizado neste projeto, essa biblioteca serve para gerenciar tokens, tanto na geração quanto na verificação de autenticidade.
- Vite: é um plugin muito útil e tem como objetivo principal cuidar e distribuir as atualizações de página para o front-end em ambiente de desenvolvimento, isso evita que o desenvolvedor precise reiniciar o SPA toda vez que ele fizer uma alteração no código fonte.

## Detalhamento do Código (Back-end)
O back-end do projeto foi desenvolvido em Nodejs com foco na eficiência e na escalabilidade. Seguem detalhes sobre a implementação:
- Os dados são pré-processados por scripts de build em `server/src/data/generated/{ano}-{turno}/` (`meta.json`, `estados.json` e `municipios/{UF}.json`, GeoJSON com geometria já simplificada). No boot, o controller `server/src/controllers/eleicoes.js` varre essas pastas e mantém tudo em memória; não há Redis nem chamadas ao IBGE em tempo de execução.
- CORS restrito às origens de `ALLOWED_ORIGINS` (separadas por vírgula). GeoJSON responde com `Cache-Control: public, max-age=604800, immutable` (o ano está na URL); `/api/eleicoes` e `/meta` com `max-age=300`.

### Rotas da API
`:turno` aceita `1`/`2` ou `primeiro-turno`/`segundo-turno`; `:uf` aceita sigla (`SP`) ou código IBGE (`35`). Eleição ou UF inexistente retorna 404 com `{ "mensagem": "..." }`.
- `GET /api/eleicoes` — lista `[{ ano, turno, cargo, titulo }]` ordenada;
- `GET /api/eleicao/:ano/presidente/:turno/meta` — metadados e partidos (`{ ano, turno, cargo, titulo, partidos: [{ label, color }] }`);
- `GET /api/eleicao/:ano/presidente/:turno/estados` — FeatureCollection de todos os estados;
- `GET /api/eleicao/:ano/presidente/:turno/estados/:uf` — FeatureCollection com o estado;
- `GET /api/eleicao/:ano/presidente/:turno/estados/:uf/municipios` — FeatureCollection dos municípios da UF;
- Legado: `/api/eleicao/2014/presidente/primeiro-turno/estados/...` continua funcionando (equivale a 2014, 1º turno).

## Detalhamento do Código (Front-end)
O front-end do projeto foi desenvolvido com foco na experiência do usuário e a estruturação do código fonte permitindo uma fácil implementação de novos recursos. Seguem detalhes sobre a implementação:
- O arquivo principal é o main.jsx, é aqui que tudo começa;
- Foi criado um componente chamado Mapa, este componente está dentro da pasta src/components e também faz uso de outros dois componentes da mesma pasta;
- O componente Filter é usado para posicionar e controlar os campos Partido e Estado ele está diretamente ligado ao componente principal Mapa;
- O componente Loading é usado para mostrar ao usuário um spinner na transição entre o mapa do brasil e dos estados;
- Dentro da pasta Mapa, o componente foi dividido em arquivos menores, e que são importados dentro do principal Index.jsx, isso ajuda na manutenção e entendimento do código;
- Importante comentar que foi usado um recurso muito interessante do Javascript, a desestruturação. Ela torna mais fácil a comunicação do componente com as funções, pois não obriga a passagem de parâmetros sequencializados;

## Subindo o ambiente para avaliação
Os passos a seguir são necessários para colocar o ambiente online e assim visualizar o projeto rodando. Para facilitar o uso e garantir que os serviços vão ficar rodando abra um terminal (CMD, Powershell, ...) para cada ação:
- Para colocar o servidor online; abra um terminal (CMD, Powershell, ...) e a partir da pasta server execute o comando abaixo:
  - npm install (este comando deve ser executado apenas uma vez pois ele é responsável por instalar as dependencias)
  - npm run start (responsável por iniciar o servidor)
- Front: configure `web/.env` (copie de `web/.env.example`) com `VITE_API_URL` apontando para a raiz da API (ex.: `http://localhost:5036/api`). O front lista as eleições em `/api/eleicoes` e permite trocar de eleição pelo seletor;
- Abra um novo terminal e a partir da pasta web execute o comando abaixo:
  - npm install (este comando deve ser executado apenas uma vez pois ele é responsável por instalar as dependencias)
  - npm run start (responsável por iniciar o serviço web)
- Em seu navegador abra o endereço que o Vite disponibilizar no terminal;
- Use o SPA a vontade;

## Conclusão
Agradeço a oportunidade de trabalhar neste projeto e estou ansioso para continuar aprimorando minhas competências. Se você tiver alguma dúvida ou precisar de mais informações, não hesite em entrar em contato comigo. Obrigado!

# **Agradecimentos**
Eu quero deixar registrado aqui meu relato sobre este momento.
Na última semana estudei e aprendi sobre muitos recursos que até o então só ouvi falar.
Docker, WSL, Leaflet, GeoJSON, montar estruturas JSON de grande porte, ...
Isso criou uma marca em mim e me trouxe lembranças muito agradáveis do inicio de minha carreia onde dar o meu melhor valeu muito a pena.
Obrigado pela oportunidade e pelas lembranças.
Espero de verdade fazer parte desse time e poder contribuir muito, fazendo algo que eu amo.
