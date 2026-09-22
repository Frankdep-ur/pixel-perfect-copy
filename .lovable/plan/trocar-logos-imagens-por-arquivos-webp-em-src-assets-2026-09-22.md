# Trocar logos/imagens por arquivos .webp em src/assets

Sem alterar layout, tamanhos nem textos. Apenas a origem das imagens muda de ponteiros CDN (`/__l5e/`) para arquivos locais `.webp`.

## 1. Copiar os 3 arquivos enviados para `src/assets/`
- `logo-lar77.webp`
- `hero-profissional.webp`
- `hero-sala.webp`

(origem: uploads do usuário em `/mnt/user-uploads/`)

## 2. Atualizar imports (URLs de ponteiro → URL direta do arquivo)

| Arquivo | Antes | Depois |
|---|---|---|
| `src/components/site-header.tsx` | `import logoLar77 from "@/assets/logo-lar77.png.asset.json"` + `logoLar77.url` (2 usos) | `import logoLar77 from "@/assets/logo-lar77.webp"` + `logoLar77` |
| `src/components/site-footer.tsx` | mesmo padrão, `logoLar77.url` (1 uso) | `logoLar77` |
| `src/lib/site-config.ts` | mesmo padrão; `LOGO_PADRAO = logoLar77.url` | `LOGO_PADRAO = logoLar77` |
| `src/lib/home-slides.ts` | `hero-profissional.jpg.asset.json` (`heroProfissional.url`) e `hero-sala.jpg` | `hero-profissional.webp` (`heroProfissional`) e `hero-sala.webp` (`heroSala`, uso direto já sem `.url`) |

Nenhum outro arquivo do projeto referencia esses assets (verificado por busca).

## 3. Apagar os arquivos antigos
- `lovable-assets delete --file src/assets/logo-lar77.png.asset.json` (remove o binário órfão do CDN e o ponteiro)
- `lovable-assets delete --file src/assets/hero-profissional.jpg.asset.json`
- `rm src/assets/hero-sala.jpg`

Obs.: a versão já publicada (lar10.lovable.app) serve do último build — as imagens antigas só deixam de existir no CDN; ao publicar a próxima atualização tudo passa a usar os `.webp`.

## 4. Verificação
- Busca no projeto: nenhum arquivo referencia mais `/__l5e/` nem os ponteiros `.asset.json`.
- Build e testes (`bun run test`) passando.
- Conferência visual da home no preview: logo no header/rodapé e os 2 slides do carrossel renderizando igual, sem mudança de layout.
