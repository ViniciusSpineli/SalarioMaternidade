import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Baby, Lock } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");

  const login = trpc.auth.login.useMutation({
    onSuccess: async () => {
      toast.success("Bem-vinda!");
      await utils.auth.me.invalidate();
    },
    onError: error => {
      toast.error(error.message || "Não foi possível entrar");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email, senha });
  };

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2 bg-rose-50">
      {/* Coluna da imagem (aparece em telas médias/grandes) */}
      <div className="relative hidden lg:block">
        <img
          src="/login-bg.jpg"
          alt="Gestante"
          className="absolute inset-0 h-full w-full object-cover"
        />
        {/* Sobreposição para dar contraste ao texto */}
        <div className="absolute inset-0 bg-gradient-to-t from-rose-950/70 via-rose-900/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-10 text-white">
          <div className="mb-3 flex items-center gap-2">
            <Baby className="h-7 w-7" />
            <span className="text-lg font-semibold tracking-tight">
              Salário-Maternidade
            </span>
          </div>
          <h2 className="text-3xl font-bold leading-tight drop-shadow-sm">
            Cuidando de cada etapa,
            <br /> do começo ao benefício.
          </h2>
          <p className="mt-3 max-w-md text-sm text-white/80">
            Sistema de gestão de clientes e acompanhamento do salário-maternidade.
          </p>
        </div>
      </div>

      {/* Coluna do formulário */}
      <div className="flex min-h-screen items-center justify-center p-6 lg:min-h-full">
        <div className="w-full max-w-sm">
          {/* Cabeçalho / marca */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-sm">
              <Baby className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Controle de Salário-Maternidade
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bem-vinda! Entre para acessar o sistema.
            </p>
          </div>

          {/* Cartão do formulário */}
          <div className="rounded-2xl border border-rose-100 bg-white p-6 shadow-xl shadow-rose-100/50">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Usuário</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="Digite seu usuário"
                  autoComplete="username"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <Input
                  id="senha"
                  type="password"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <Button
                type="submit"
                disabled={login.isPending}
                className="h-11 w-full bg-rose-600 text-base hover:bg-rose-700"
              >
                {login.isPending ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" /> Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </form>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Acesso restrito e protegido
          </p>
        </div>
      </div>
    </div>
  );
}
