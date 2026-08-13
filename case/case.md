# Case Eleições Presidenciais de 2014

## Cenário
Estamos no dia 5 de outubro de 2014, dia de votação do primeiro turno das eleições para presidente e o TSE acaba de liberar um arquivo num formato compacto com os resultados do primeiro turno e votação de todos os candidatos em todos os municípios do Brasil. Um partido político encomenda a criação de um site de exploração dos votos em todos os níveis de unidades político-administrativas do Brasil para entender como foi a distribuição dos seus votos entre estados e municípios.

## Desafio

### Backend
Implementar uma API que retorne o número de votos de todos os candidatos/partidos por unidades político-administrativas junto com informações geográficas com as fronteiras das unidades em formatoGeoJson.

O retorno da API em si é livre para sua decisão porém a estrutura de URLs não. Ela deve seguir exatamente o seguinte padrão:
* GET `/api/eleicao/2014/presidente/primeiro-turno/estados`
  Retornar informações dos votos agregados por estado e as suas malhas no formato GeoJson

* GET `/api/eleicao/2014/presidente/primeiro-turno/estados/{Estado}/municipios`

  Retornar informações dos votos agregados por municípios do estado {Estado} e as suas malhas no formatoGeoJson. {Estado} pode ser a sigla ou código, exemplo:
    * GET `/api/eleicao/2014/presidente/primeiro-turno/estados/33/municipios`
    * GET `/api/eleicao/2014/presidente/primeiro-turno/estados/RJ/municipios`

### Frontend
A partir da API, você agora precisa criar o site em si de exploração dos votos nos partidos, ele deve ser composto de apenas uma página (SPA) e nele deve ser possível escolher um partido e mostrar a distribuição dos votos nas unidades do Brasil de forma gráfica via um mapa. Por exemplo, se de todos os votos recebidos do Partido Verde, 80% estão na região Sudeste, 10% no Sul e outros 10% no Nordeste, a região Sudeste deveria ser preenchida no mapa com uma cor forte, Sul e Nordeste com uma cor fraca, e a região Norte eCentro-Oeste num tom quase sem opacidade alguma. Além das cores, uma _tooltip_ com os dados totais e esse “share” entre as unidades deve aparecer ao passar o mouse em cima das unidades. Segue _wireframe_ de exemplo:

![Mapa](map.png)

Apesar do wireframe indicar uma separação via regiões para ilustrar o comportamento de cores fortes e fracasde acordo com os votos no partido, o comportamento deve ser seguinte: Ao selecionar um partido, o mapa
deveria mostrar as informações e cores dos estados; Ao selecionar um estado, o mapa deveria dar um “zoom”no estado em si e apenas os municípios do estado escolhido deveriam ser preenchidos pelas cores e astooltips com as informações; Ao mudar de estado, o mapa deveria focar no novo estado e apenas os seusmunicípios deveriam ser preenchidos; Ao mudar o partido, o mapa deveria focar no Brasil e colorir os estados eo combobox de estados deve ser resetado.

## Anexos e informações
O único arquivo que pode ser utilizado no projeto é o de resultado das votações disponibilizado no link: https://drive.google.com/file/d/1Q81rYT9qmCrU2nPjLI3xysOpH981xA4u/view?usp=sharing


Ele é um arquivo texto no formato de “array de arrays”, com a votação de todos os candidatos por estado e por município.
Exemplo de parte do arquivo:

```
[
   [
      "UF", "AC", "Acre", "AC",
      ["PSB", "Marina Silva", 167603, 41.99, "N"],
      ["PSDB", "A\u00e9cio Neves", 116109, 29.09, "N"],
      ["PT", "Dilma", 111641, 27.97, "N"],
      ["PSC","Pastor Everaldo",1203,0.3,"N"],
      ["PSOL","Luciana Genro",867,0.22,"N"],
      ["PRTB","Levy Fidelix",639,0.16,"N"],
      ["PV","Eduardo Jorge",597,0.15,"N"],
      ["PSDC","Eymael",282,0.07,"N"],
      ["PSTU","Z\u00e9 Maria",112,0.03,"N"],
      ["PCB","Mauro Iasi",68,0.02,"N"],
      ["PCO","Rui Costa Pimenta",14,0.0,"N"]
   ],
   [
      "Rio Branco", "1200401", "MU", "01392", "Acre", "AC",
      ["PSB","Marina Silva",115594,58.34,"N"],
      ["PSDB","A\u00e9cio Neves",44676,22.55,"N"],
      ["PT","Dilma",35802,18.07,"N"],
      ["PSOL","Luciana Genro",648,0.33,"N"],
      ["PSC","Pastor Everaldo",520,0.26,"N"],
      ["PV","Eduardo Jorge",346,0.17,"N"],
      ["PRTB","Levy Fidelix",332,0.17,"N"],
      ["PSDC","Eymael",155,0.08,"N"],
      ["PSTU","Z\u00e9 Maria",39,0.02,"N"],
      ["PCB","Mauro Iasi",25,0.01,"N"],
      ["PCO","Rui Costa Pimenta",6,0.0,"N"]
   ]
]
```

Para o desafio, você vai precisar apenas das informações dos municípios, o número em seguida de seu nome é seu identificador único. Já nas linhas dos candidatos, o primeiro número após o partido e nome é a votação que o candidato teve no município. **​Atenção** ​pois o arquivo em si terá alguns *arrays* que não são relativos aos
municípios, e eles devem ser ignorados.

Além do arquivo em anexo com o resultado das votações, você deve utilizar as APIs fornecidas pelo IBGE:
* https://servicodados.ibge.gov.br/api/docs/localidades?versao=1
* https://servicodados.ibge.gov.br/api/docs/malhas?versao=3

Para conseguir ter acesso aos identificadores únicos de todas as unidades político-administrativas assim como as suas malhas permitindo assim preencher os valores das opções e renderizar os mapas.

## Requisitos
* As linguagens permitidas para a construção da solução são: *Java*, *Kotlin*, *Clojure*, *Groovy*, *Javascript* e *TypeScript*. Fora isso, qualquer biblioteca ou framework estão liberados.
* Disponibilizar um README documentando racional, e qualquer coisa que queira documentar sobre o sistema e principalmente como iniciá-lo **(obrigatório)**.
* Disponibilizar um Dockerfile ou compose com instruções de como iniciar o sistema **(desejável)**
* Disponibilizar o projeto neste repositório **(obrigatório)**.


## Critério de avaliação
* **Completude**: ​Idealmente a aplicação entregue deveria atender as necessidades do cliente final que fez a encomenda do sistema, porém vamos analisar tudo que foi produzido por você. Caso não tenha sido possível implementar uma funcionalidade, é melhor criar um *mock* ou *dummy* do que simplesmente não entregar nada.
* **Assertividade**​: A aplicação está fazendo o que é esperado? Se tem algo faltando, o README explica o porquê? Quanto mais claro deixar o racional do que foi feito e pontos que não conseguiu atender, melhorias que acha que poderia fazer num futuro, etc... melhor
* **Organização do código​**: Separação clara de responsabilidades de pastas, pacotes, arquivos, classes, componentes, funções.
* ​**Legibilidade do código**: ​Um profissional menos experiente seria capaz de ler todo o código,
incluindo comentários, e entender o que foi feito?
* **​Segurança​**: Existe alguma vulnerabilidade clara?
* **​Cobertura de testes**: ​Existem testes unitários ou de integração que possam permitir que um *refactoring* seja feito garantindo uma regressão?
* **​Escolhas técnicas**​: A escolha das bibliotecas, banco de dados, arquitetura, etc... É uma escolha adequada para o tipo de aplicação?

## Prazo e como entregar
Este case não deve tomar muito do seu tempo - a ideia é que ele seja prático. Inicialmente você terá o prazo de 7 dias a partir do momento que você o receber, caso precise de mais tempo, basta avisar a pessoa de recrutamento que está em contato com você 😉.

Quando terminar o desafio, avisa pra gente e crie uma tag chamada `final` no seu repositório, para criar a tag basta seguir o passo a passo:
1. `git tag -a 'final' -m 'finalizei :-)'`
2. `git push origin 'final'`

Boa Sorte! 🚀
