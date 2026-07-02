import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Search, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function SearchBar() {
  const [, navigate] = useLocation();
  const [termo, setTermo] = useState("");
  const [aberto, setAberto] = useState(false);
  const [resultados, setResultados] = useState<any[]>([]);

  const searchQuery = trpc.busca.searchClientes.useQuery(
    { termo },
    { enabled: false }
  );

  // Debounce da busca
  useEffect(() => {
    if (!termo.trim()) {
      setResultados([]);
      return;
    }

    const timer = setTimeout(() => {
      searchQuery.refetch();
    }, 300);

    return () => clearTimeout(timer);
  }, [termo]);

  useEffect(() => {
    if (searchQuery.data) {
      setResultados(searchQuery.data as any[]);
    }
  }, [searchQuery.data]);

  const handleSelectCliente = (clienteId: number) => {
    setTermo("");
    setAberto(false);
    setResultados([]);
    navigate(`/clientes?id=${clienteId}`);
  };

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Buscar cliente por nome ou CPF..."
          value={termo}
          onChange={(e) => {
            setTermo(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          onBlur={() => setTimeout(() => setAberto(false), 200)}
          className="pl-10 pr-4"
        />
        {searchQuery.isFetching && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown de resultados */}
      {aberto && termo.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {searchQuery.isFetching ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Buscando...
            </div>
          ) : resultados && resultados.length > 0 ? (
            <div className="divide-y">
              {resultados.map((cliente) => (
                <button
                  key={cliente.id}
                  onClick={() => handleSelectCliente(cliente.id)}
                  className="w-full text-left px-4 py-3 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{cliente.nome}</div>
                      <div className="text-xs text-muted-foreground">
                        CPF: {cliente.cpf}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {cliente.statusProcesso || "Sem status"}
                      </div>
                    </div>
                    {cliente.urgenteAbsoluta && (
                      <div className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-medium">
                        Urgente
                      </div>
                    )}
                    {cliente.inadimplente && (
                      <div className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded font-medium">
                        Inadimpl.
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhum cliente encontrado
            </div>
          )}
        </div>
      )}
    </div>
  );
}
