import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Award,
  Calendar,
  DollarSign,
  Percent,
  Star,
} from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useCurrency } from "../hooks/useCurrency";
import { useNotification } from "../hooks/useNotification";

interface MembershipType {
  id?: number;
  name: string;
  description: string;
  price: number;
  duration_days: number;

  membership_type: string;
  max_sessions_per_day: number | null;
  discount_percentage: number;
  priority_level: number;
  auto_renew: boolean;
  is_active: boolean;
  total_hours: string;
  benefits?: string;
}

export function MembershipTypes() {
  const [memberships, setMemberships] = useState<MembershipType[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<MembershipType>({
    name: "",
    description: "",
    price: 0,
    duration_days: 30,
    benefits: "",
    membership_type: "standard",
    max_sessions_per_day: null,
    discount_percentage: 0,
    priority_level: 0,
    auto_renew: false,
    is_active: true,
    total_hours: "",
  });

  const { formatCurrency } = useCurrency();
  const { success, error } = useNotification();

  useEffect(() => {
    loadMemberships();
  }, []);

  const loadMemberships = async () => {
    try {
      setLoading(true);
      const data = await (window as any).api.getMemberships();
      setMemberships(data);
    } catch (err) {
      error("Error al cargar tipos de membresía");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.price <= 0 || formData.duration_days <= 0) {
      error("Por favor complete todos los campos requeridos");
      return;
    }

    try {
      if (editingId) {
        await (window as any).api.updateMembership(
          editingId,
          formData.name,
          formData.description,
          formData.price,
          formData.duration_days,
          formData.auto_renew,
          formData.is_active,
          formData.total_hours,
        );
        success("Membresía actualizada correctamente");
      } else {
        await (window as any).api.createMembership(
          formData.name,
          formData.description,
          formData.price,
          formData.duration_days,
          formData.auto_renew,
          formData.is_active,
          formData.total_hours,
        );
        success("Membresía creada correctamente");
      }

      resetForm();
      loadMemberships();
    } catch (err) {
      error("Error al guardar la membresía");
    }
  };

  const handleEdit = (membership: MembershipType) => {
    setFormData(membership);
    setEditingId(membership.id || null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este tipo de membresía?")) return;

    try {
      await (window as any).api.deleteMembership(id);
      success("Membresía eliminada correctamente");
      loadMemberships();
    } catch (err) {
      error("Error al eliminar la membresía");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      price: 0,
      duration_days: 30,
      total_hours: "",
      membership_type: "standard",
      max_sessions_per_day: null,
      discount_percentage: 0,
      priority_level: 0,
      auto_renew: false,
      is_active: true,
      benefits: "",
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 overflow-auto bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            🎫 Tipos de Membresía
          </h1>
          <p className="text-sm text-gray-600">
            Gestiona los planes de membresía disponibles
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Membresía
        </Button>
      </div>

      {showForm && (
        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">
              {editingId ? "Editar Membresía" : "Nueva Membresía"}
            </h2>
            <Button
                        className="h-8 w-8 p-0" variant="outline" size="sm" onClick={resetForm}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: Membresía Mensual"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  N° de Entradas en horas
                </label>
                <Input
                  value={formData.total_hours}
                  onChange={(e) =>
                    setFormData({ ...formData, total_hours: e.target.value })
                  }
                  placeholder="Ej: 10 horas"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración (días) *
                </label>
                <Input
                  type="number"
                  value={formData.duration_days || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_days: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descuento (%)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.discount_percentage || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discount_percentage: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>


            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={2}
                placeholder="Descripción breve de la membresía"
              />
            </div>



            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.auto_renew}
                  onChange={(e) =>
                    setFormData({ ...formData, auto_renew: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">
                  Renovación automática
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Activa</span>
              </label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" />
                {editingId ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {memberships.map((membership) => (
          <Card
            key={membership.id}
            className={`p-6 ${!membership.is_active ? "opacity-60" : ""}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <Award className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-lg">{membership.name}</h3>
                  <span className="text-xs text-blue-600 font-medium">
                    {membership.total_hours || "Sin horas definidas"}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(membership)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(membership.id!)}
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </Button>
              </div>
            </div>

            {membership.description && (
              <p className="text-sm text-gray-600 mb-3">
                {membership.description}
              </p>
            )}

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="font-semibold">
                  {formatCurrency(membership.price)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>{membership.duration_days} días</span>
              </div>

              {membership.discount_percentage > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Percent className="w-4 h-4 text-purple-600" />
                  <span>{membership.discount_percentage}% descuento</span>
                </div>
              )}

              {membership.priority_level > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-600" />
                  <span>
                    Prioridad:{" "}
                    {membership.priority_level === 2 ? "VIP" : "Alta"}
                  </span>
                </div>
              )}
            </div>

            {membership.benefits && (
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Beneficios:
                </p>
                <ul className="text-xs text-gray-600 space-y-1">
                  {membership.benefits.split("\n").map((benefit, idx) => (
                    <li key={idx}>• {benefit}</li>
                  ))}
                </ul>
              </div>
            )}

            {!membership.is_active && (
              <div className="mt-3 text-xs text-red-600 font-semibold">
                INACTIVA
              </div>
            )}
          </Card>
        ))}
      </div>

      {memberships.length === 0 && !showForm && (
        <Card className="p-12 text-center">
          <Award className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500 mb-4">
            No hay tipos de membresía configurados
          </p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Primera Membresía
          </Button>
        </Card>
      )}
    </div>
  );
}
