# **Documento de Entrega do Projeto**

## Apresentação
Infelizmente, ainda não foi possível dominar o Docker, e por isso eu não consegui fazer com que o arquivo Dockerfile crie o ambiente estável. Estou trabalhando para resolver essa questão e agradeço a sua compreensão.
Também tenho ciência que algumas skills, como implementação de testes, não foram aplicadas pois hoje onde trabalho tais tecnologias não são usadas e para tanto eu precisaria de mais tempo de aprendizagem, contudo me coloco a disposição para estudos, basta me dar a direção e um apoio quando surgirem dúvidas. 

## Requisitos necessários
Você vai precisar ter algumas ferramentas/aplicativos instalados para uma avaliação funcional do projeto. No tópico Subindo o Ambiente de Avaliação, será descrito o passo a passo para e comandos necessários.
- Nodejs: Recomendo a versão LTS mais atual;
- Docker: Estas ferramentas vão por Redis online, é mais fácil de ser configurado e usado do que o WSL. Optei pelo Docker pois o Redis não tem versão para Windows, também aproveitei para a oportunidade para aprender sobre a tecnologia.

## Tecnologias Empregadas no Projeto
O projeto emprega uma variedade de tecnologias, cada uma com um propósito específico:
- Docker: Utilizado para a virtualização em containers, proporcionando um ambiente isolado e controlado para a execução do projeto.
- Redis: Responsável pelo armazenamento de dados em memória, garantindo uma alta performance na recuperação de informações.
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
- A decisão de utilizar o Redis no back-end foi tomada para minimizar o tempo de resposta na entrega do GeoJSON das APIs do IBGE e evitar uma sobrecarga de requisições caso o front-end seja acessado por muitos usuários simultaneamente. Em resumo, a primeira leitura pode demorar um pouco, pois a busca é feita diretamente na API do IBGE. A partir desse momento, um cache é criado no Redis para cada GeoJSON recebido, tornando as requisições subsequentes mais rápidas e seguras. Implementei um tempo de vida de 7 dias para o cache. Após a leitura do cache, é feito uma verificação a data da última atualização e, se necessário, uma nova requisição é feita para a API do IBGE.
- Como os dados iniciais estão em um arquivo texto, já aproveitei e o instanciei em uma chave dentro do redis, isso acontece toda vez que o serviço back-end é inicializado;
- Como o objetivo solicitado atualmente é apenas as eleições de 2014, todo o processo foi escrito dentro de apenas uma classe chamada “eleicoes2014” e expus apenas três rotas para a API controlar, caso seja necessário expor outras eleições o controle de qual ano está sendo requirido deve ser enviado via params, assim não perdemos as rotas atuais e conseguimos controlar melhor novas implementações;

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
- Docker: crie um ambiente para o Redis.
  - Docker pull redis, instancie um container expondo a porta 6379; 
- Para colocar o servidor online; abra um terminal (CMD, Powershell, ...) e a partir da pasta server execute o comando abaixo:
  - npm install (este comando deve ser executado apenas uma vez pois ele é responsável por instalar as dependencias)
  - npm run start (responsável por iniciar o servidor)
- Abra um novo terminal e a partir da pasta web execute o comando abaixo:
  - npm install (este comando deve ser executado apenas uma vez pois ele é responsável por instalar as dependencias)
  - npm run start (responsável por iniciar o serviço web)
- Em seu navegador entre com o endereço <http://localhost:5173/eleicoes-2014/> ou use o Ctrl + clique sobre o endereço que o vite disponibilizou;
- Use o SPA a vontade;

## Conclusão
Agradeço a oportunidade de trabalhar neste projeto e estou ansioso para continuar aprimorando minhas competências. Se você tiver alguma dúvida ou precisar de mais informações, não hesite em entrar em contato comigo. Obrigado!

# **Agradecimentos**
Eu quero deixar registrado aqui meu relato sobre este momento.
Na última semana estudei e aprendi sobre muitos recursos que até o então só ouvi falar.
Docker, WSL, Leaflet, GeoJSON, Redis, montar estruturas JSON de grande porte, ...
Isso criou uma marca em mim e me trouxe lembranças muito agradáveis do inicio de minha carreia onde dar o meu melhor valeu muito a pena.
Obrigado pela oportunidade e pelas lembranças.
Espero de verdade fazer parte desse time e poder contribuir muito, fazendo algo que eu amo.
