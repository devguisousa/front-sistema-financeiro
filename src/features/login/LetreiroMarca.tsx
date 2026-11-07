// Lançamentos fictícios correndo no painel da marca (decorativo)
const ITENS = [
  { texto: "+ R$ 1.250,00 · VENDAS", cor: "text-verde" },
  { texto: "− R$ 186,40 · ALIMENTAÇÃO", cor: "text-coral" },
  { texto: "⇄ R$ 1.000,00 · RESERVA MENSAL", cor: "text-musgo" },
  { texto: "+ R$ 3.250,00 · SERVIÇOS", cor: "text-verde" },
  { texto: "− R$ 2.400,00 · FORNECEDORES", cor: "text-coral" },
  { texto: "+ R$ 112,40 · RENDIMENTOS", cor: "text-verde" },
  { texto: "− R$ 220,00 · TRANSPORTE", cor: "text-coral" },
];

export function LetreiroMarca() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-y border-[#121915] py-3.5 [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]"
    >
      <div className="letreiro font-mono text-[12px] tracking-[.04em]">
        {[...ITENS, ...ITENS].map((item, i) => (
          // a lista é fixa e duplicada para o loop: índice é a chave estável
          <span key={i} className={item.cor}>
            {item.texto}
          </span>
        ))}
      </div>
    </div>
  );
}
