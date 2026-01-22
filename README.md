# Gerador de Arte ASCII (Node.js)

API + frontend para gerar arte ASCII estilizada a partir de texto.

## Requisitos

- Node.js 18+

## Instalação

```bash
npm install
```

## Como rodar

### Opção 1: porta padrão (3000)

```bash
npm run dev
```

### Opção 2: escolher a porta (ex: 3001)

PowerShell:

```powershell
$env:PORT=3001
npm run dev
```

## Frontend

Abra no navegador:

- `http://localhost:3000/`

Se você estiver usando outra porta (ex: 3001), ajuste a URL:

- `http://localhost:3001/`

## API

### Healthcheck

`GET /health`

### Listar fontes

`GET /api/fonts`

### Gerar arte ASCII

`GET /api/ascii?text=Seu%20Texto&font=Standard`

Para múltiplas linhas no GET, use `%0A`:

`GET /api/ascii?text=Linha%201%0ALinha%202&font=Standard`

Ou via POST:

`POST /api/ascii`

Body JSON:

```json
{
  "text": "Linha 1\\nLinha 2",
  "font": "Standard"
}
```

Resposta:

```json
{
  "text": "Linha 1\\nLinha 2",
  "font": "Standard",
  "ascii": "..."
}
```

Limites atuais:

- Máximo 10 linhas
- Máximo 80 caracteres por linha

## Exemplos rápidos

```bash
curl "http://localhost:3000/api/ascii?text=Hello&font=Standard"
```

```bash
curl "http://localhost:3000/api/ascii?text=Linha%201%0ALinha%202&font=Standard"
```
