// Mesmas regras do back-end (bcrypt só usa os primeiros 72 BYTES)
export function erroDeNovaSenha(senha: string): string | null {
  if (senha.length < 8) return "A senha precisa ter pelo menos 8 caracteres.";
  if (new TextEncoder().encode(senha).length > 72) {
    return "A senha pode ter no máximo 72 bytes (acentos e emojis ocupam mais de 1).";
  }
  return null;
}
