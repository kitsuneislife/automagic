# Guia de Uso do Sistema de Notícias

Este guia explica como utilizar o sistema modularizado para buscar, unificar e armazenar notícias de APIs diferentes (NewsAPI, GNews e MediaStack). O sistema está dividido em módulos, handlers e possui um fluxo organizado para facilitar a manutenção e escalabilidade.

---

## Estrutura do Projeto

```plaintext
news-database/
├── modules/
│   ├── database.mjs      # Gerencia conexão e operações no banco de dados SQLite
│   ├── unifier.mjs      # Converte e unifica notícias de diferentes fontes
│   ├── importer.mjs         # Gerencia chamadas às APIs de notícias
├── index.mjs    # Conecta módulos e define lógica de alto nível
├── README.md         # Este guia
```

---

## Módulos

### 1. `database.mjs`

Este módulo gerencia a conexão com o banco de dados SQLite e fornece métodos para:
- Criar tabelas e índices.
- Inserir notícias unificadas.
- Buscar notícias baseadas em critérios.
- Executar consultas SQL dinâmicas.

### 2. `unifier.mjs`

Este módulo converte notícias de diferentes formatos para um formato unificado, garantindo consistência no armazenamento. Suporta as seguintes fontes:
- **GNews**
- **NewsAPI**
- **MediaStack**

### 3. `importer.mjs`

Este módulo gerencia as chamadas às APIs de notícias. Ele fornece métodos para:
- Buscar notícias da **NewsAPI**.
- Buscar notícias da **GNews**.
- Buscar notícias da **MediaStack**.

---

## Handler

### `index.mjs`

O handler age como uma camada intermediária que conecta os módulos ao restante da aplicação. Ele oferece métodos para:
- Buscar notícias de uma API específica e armazená-las no banco de dados.
- Buscar notícias armazenadas no banco de dados com base em critérios.
- Executar consultas SQL dinâmicas.

---

## Configuração

1. Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis de ambiente:

```
NEWS_API_KEY=seu_api_key_newsapi
GNEWS_API_KEY=seu_api_key_gnews
MEDIASTACK_API_KEY=seu_api_key_mediastack
```

2. Certifique-se de que o banco de dados SQLite está acessível no caminho `./local/sqlite/system.db`.

---

## Como Usar

### Buscar e Armazenar Notícias de APIs

1. **Importe o Handler**:
   O `index` será usado para interagir com os módulos.

2. **Método `fetchAndStoreNews`**:
   Ele baixa as notícias de uma API específica, unifica os dados e os insere no banco de dados.

Exemplo para buscar e armazenar notícias da **NewsAPI** para os EUA:

```javascript
import index from './handlers/index.mjs';

(async () => {
    const stats = await index.fetchAndStoreNews('newsapi', 'us');
    console.log('Estatísticas de Inserção:', stats);
})();
```

### Buscar Notícias do Banco de Dados

1. **Método `getNews`**:
   Ele busca notícias armazenadas no banco de dados com base em critérios como fonte, limite de resultados e offset para paginação.

Exemplo para buscar as últimas 5 notícias:

```javascript
import index from './handlers/index.mjs';

const news = index.getNews({ limit: 5 });
console.log('Notícias Encontradas:', news);
```

### Executar Consultas SQL Dinâmicas

1. **Método `runDynamicQuery`**:
   Ele permite executar consultas SQL arbitrárias no banco de dados.

Exemplo para buscar notícias publicadas após uma data específica:

```javascript
import index from './handlers/index.mjs';

const query = 'SELECT * FROM news WHERE publishedAt > ? ORDER BY publishedAt DESC';
const params = ['2025-01-01'];
const results = index.runDynamicQuery(query, params);

console.log('Resultados da Consulta:', results);
```

### Encerrar Conexão com o Banco de Dados

1. **Método `closeDatabase`**:
   Ele fecha a conexão com o banco de dados SQLite.

Exemplo:

```javascript
import index from './handlers/index.mjs';

index.closeDatabase();
```

---

## Fluxo Completo

Segue um exemplo completo de como buscar, unificar e armazenar notícias de APIs diferentes, e depois buscar notícias do banco de dados:

```javascript
import index from './handlers/index.mjs';

(async () => {
    try {
        // Buscar e armazenar notícias da NewsAPI para os EUA
        const statsNewsAPI = await index.fetchAndStoreNews('newsapi', 'us');
        console.log('NewsAPI - Estatísticas de Inserção:', statsNewsAPI);

        // Buscar e armazenar notícias da GNews para o Brasil
        const statsGNews = await index.fetchAndStoreNews('gnews', 'br');
        console.log('GNews - Estatísticas de Inserção:', statsGNews);

        // Buscar notícias do banco de dados
        const news = index.getNews({ limit: 5 });
        console.log('Notícias Encontradas:', news);

    } catch (error) {
        console.error('Erro:', error.message);
    } finally {
        // Fechar conexão com o banco de dados
        index.closeDatabase();
    }
})();
```

---

## Adicionar Suporte para Novas APIs

1. **Adicione um método no `importer.mjs`**:
   Crie um método para buscar dados da nova API e retorne o formato bruto.

2. **Atualize o `unifier.mjs`**:
   Adicione um conversor que transforme os dados da nova API no formato unificado.

3. **Atualize o `index.mjs`**:
   Adicione o suporte à nova API no método `fetchAndStoreNews`.

---

## Conclusão

Este sistema modular é leve, rápido e fácil de manter. Ele permite gerenciar eficientemente as integrações com múltiplas APIs e o armazenamento de dados no SQLite. Siga as instruções acima para personalizar ou estender as funcionalidades conforme necessário.