export type Bloco = { titulo: string; itens: string[] };

/** Layout simples e legível no celular para páginas de texto (termos, privacidade, ajuda). */
export function PaginaTexto({
  titulo,
  resumo,
  blocos,
}: {
  titulo: string;
  resumo: string;
  blocos: Bloco[];
}) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-6 md:max-w-2xl">
      <h1 className="font-display text-[24px] font-bold leading-tight text-foreground">{titulo}</h1>
      <p className="mt-1.5 text-[13px] leading-snug text-muted-foreground">{resumo}</p>

      <div className="mt-6 space-y-4">
        {blocos.map((bloco) => (
          <section key={bloco.titulo} className="rounded-[18px] border border-accent/20 bg-card p-4">
            <h2 className="font-display text-[15px] font-semibold text-accent">{bloco.titulo}</h2>
            <ul className="mt-2 space-y-2">
              {bloco.itens.map((item) => (
                <li
                  key={item}
                  className="text-[13px] leading-relaxed text-muted-foreground before:mr-2 before:text-accent before:content-['•']"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
