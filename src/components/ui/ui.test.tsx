import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button, CampoValor, ConfirmDialog, Field, Input, Pagination } from ".";

describe("Field", () => {
  it("liga rótulo, erro e descrição acessível", () => {
    render(
      <Field rotulo="Valor" erro="Valor inválido" dica="Use vírgula para centavos">
        {(props) => <Input {...props} />}
      </Field>,
    );

    const campo = screen.getByLabelText("Valor");
    expect(campo).toHaveAttribute("aria-invalid", "true");
    expect(campo).toHaveAccessibleDescription("Use vírgula para centavos Valor inválido");
    expect(screen.getByRole("alert")).toHaveTextContent("Valor inválido");
  });

  it("sem erro não marca o campo como inválido", () => {
    render(<Field rotulo="Nome">{(props) => <Input {...props} />}</Field>);

    expect(screen.getByLabelText("Nome")).not.toHaveAttribute("aria-invalid");
  });
});

describe("Pagination", () => {
  it("some com uma página só", () => {
    const { container } = render(<Pagination pagina={1} totalPaginas={1} aoMudar={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("navega e trava na última página", async () => {
    const aoMudar = vi.fn();
    const { rerender } = render(<Pagination pagina={1} totalPaginas={3} aoMudar={aoMudar} />);

    expect(screen.getByText("Página 1 de 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /anterior/i })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: /próxima/i }));
    expect(aoMudar).toHaveBeenCalledWith(2);

    rerender(<Pagination pagina={3} totalPaginas={3} aoMudar={aoMudar} />);
    expect(screen.getByRole("button", { name: /próxima/i })).toBeDisabled();
  });
});

describe("Button", () => {
  it("carregando fica desabilitado e ocupado", () => {
    render(<Button carregando>Salvar</Button>);

    const botao = screen.getByRole("button", { name: /salvar/i });
    expect(botao).toBeDisabled();
    expect(botao).toHaveAttribute("aria-busy", "true");
  });
});

describe("CampoValor", () => {
  it("devolve o texto digitado e usa teclado decimal", async () => {
    const aoMudar = vi.fn();
    render(<CampoValor aria-label="Valor" valor="" aoMudar={aoMudar} />);

    const campo = screen.getByLabelText("Valor");
    expect(campo).toHaveAttribute("inputmode", "decimal");
    await userEvent.type(campo, "5");
    expect(aoMudar).toHaveBeenLastCalledWith("5");
  });
});

describe("ConfirmDialog", () => {
  it("confirma, e Esc fecha", async () => {
    const aoConfirmar = vi.fn();
    const aoMudar = vi.fn();
    render(
      <ConfirmDialog
        aberto
        aoMudar={aoMudar}
        titulo="Apagar lançamento?"
        descricao="Não dá para desfazer."
        textoConfirmar="Apagar"
        perigo
        aoConfirmar={aoConfirmar}
      />,
    );

    expect(screen.getByRole("alertdialog", { name: "Apagar lançamento?" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus();

    await userEvent.click(screen.getByRole("button", { name: "Apagar" }));
    expect(aoConfirmar).toHaveBeenCalledTimes(1);

    await userEvent.keyboard("{Escape}");
    expect(aoMudar).toHaveBeenCalledWith(false);
  });
});
