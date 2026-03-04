import { useState, useEffect } from "react";
import { X, Search, UserPlus } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import { useDatabase } from "../hooks/useDatabase";
import type { Client } from "../types";

interface ClientSelectorModalProps {
  onClose: () => void;
  onSelect: (client: Client) => void;
}

export function ClientSelectorModal({
  onClose,
  onSelect,
}: ClientSelectorModalProps) {
  const { getClients } = useDatabase();
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      setFilteredClients(
        clients.filter(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.phone?.toLowerCase().includes(query) ||
            c.parent_name?.toLowerCase().includes(query),
        ),
      );
    } else {
      setFilteredClients(clients);
    }
  }, [searchQuery, clients]);

  const loadClients = async () => {
    const rows = await getClients();
    setClients(rows);
    setFilteredClients(rows);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-[600px] max-h-[80vh] flex flex-col p-6 border-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Seleccionar Cliente</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Búsqueda */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, teléfono o tutor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            autoFocus
          />
        </div>

        {/* Botón Venta Rápida */}
        <Button
          variant="outline"
          onClick={() =>
            onSelect({
              id: -1,
              name: "Cliente General",
              created_at: "",
              is_member: false,
            })
          }
          className="mb-4 gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Venta Rápida (Sin Cliente)
        </Button>

        {/* Lista de Clientes */}
        <div className="flex-1 overflow-auto space-y-2">
          {filteredClients.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              No se encontraron clientes
            </div>
          ) : (
            filteredClients.map((client) => (
              <Card
                key={client.id}
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => onSelect(client)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                    {client.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{client.name}</div>
                    {client.parent_name && (
                      <div className="text-sm text-gray-500">
                        Tutor: {client.parent_name}
                      </div>
                    )}
                    {client.phone && (
                      <div className="text-sm text-gray-500">
                        {client.phone}
                      </div>
                    )}
                  </div>
                  {client.is_member && (
                    <div className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                      VIP
                    </div>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
