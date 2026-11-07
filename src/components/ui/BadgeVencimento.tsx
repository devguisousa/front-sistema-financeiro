import { Badge } from "./Badge";

const dias = (n: number) => `${n} ${n === 1 ? "dia" : "dias"}`;

/** "Vencida há 2 dias" (coral), "Vence hoje", "Em 5 dias". Nada depois do limite. */
export function BadgeVencimento({ diasAte, limite = 7 }: { diasAte: number; limite?: number }) {
  if (diasAte < 0) {
    return (
      <Badge tom="coral" ponto>
        Vencida há {dias(-diasAte)}
      </Badge>
    );
  }
  if (diasAte === 0) return <Badge tom="coral">Vence hoje</Badge>;
  if (diasAte === 1) return <Badge>Vence amanhã</Badge>;
  if (diasAte <= limite) return <Badge>Em {dias(diasAte)}</Badge>;
  return null;
}
